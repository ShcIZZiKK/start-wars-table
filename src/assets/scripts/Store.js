import Mediator from './Mediator';
import Utils from './Utils';

const mediator = new Mediator();

class Store {
  constructor(url) {
    /**
     * Ссылка по которой запрашиваем данные
     * @type {String}
     */
    this.url = url;

    /**
     * Хранилище для работы с удалённым сервесом
     */
    this.apiStore = null;

    /**
     * Хранилище для работы с localStorage
     */
    this.localStore = null;
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#initStores();
    this.#subscribe();
  }

  /**
   * Инициализация хранилищ
   */
  #initStores() {
    this.apiStore = new ApiStore(this.url);
    this.localStore = new LocalStore(this.url);
    this.localStore.init();
  }

  /**
   * Подписка на события посредника
   */
  #subscribe() {
    mediator.subscribe('store:request', () => {
      this.apiStore.getData();
    });

    mediator.subscribe('store:success', (data) => {
      this.localStore.saveData(data.results);
      this.localStore.checkData();
      LocalStorePagination.updatePaginationInfo(data);

      const sort = this.localStore.getSortInfo();

      if (!Utils.isEmptyObject(sort)) {
        this.localStore.sortData(sort?.by, sort?.direction);
      }
    });

    mediator.subscribe('localStore:clear', () => {
      this.localStore.clearStore();
    });

    mediator.subscribe('pagination:next', () => {
      const newUrl = LocalStorePagination.getPaginationNextLink();

      this.#updatePageLink(newUrl);
    });

    mediator.subscribe('pagination:prev', () => {
      const newUrl = LocalStorePagination.getPaginationPrevLink();

      this.#updatePageLink(newUrl);
    });
  }

  /**
   * Обновляет ссылку для запросов
   * @param {String} newUrl - новая ссылка
   */
  #updatePageLink(newUrl) {
    if (!newUrl) {
      return;
    }

    this.url = newUrl;

    this.apiStore.updateLinkRequest(this.url);
    this.localStore.updateLinkRequest(this.url);

    const params = (new URL(this.url)).searchParams;
    const currentPage = params.get('page') || '1';

    LocalStorePagination.setCurrentPage(currentPage);

    mediator.publish('store:request');
  }
}

class ApiStore {
  constructor(url) {
    /**
     * Ссылка по которой запрашиваем данные
     * @type {String}
     */
    this.url = url;
  }

  /**
   * Устанавливает новую ссылку для запроса
   * @param {String} url
   */
  updateLinkRequest(url) {
    this.url = url;
  }

  /**
   * Запрашивает данные с сервера
   */
  async getData() {
    await fetch(this.url)
      .then(async (response) => {
        const data = await response.json();

        mediator.publish('store:success', data);
      })
      .catch((error) => {
        mediator.publish('store:error');

        console.error('Ошибка при запросе данных: ', error);
      })
      .finally(() => {
        mediator.publish('store:finallyRequest');
      });
  }
}

class LocalStore {
  constructor(url) {
    /**
     * Ссылка по которой запрашиваем данные
     * @type {String}
     */
    this.url = url;

    /**
     * Уникальные идентификаторы для записей
     * @type {Array}
     */
    this.ids = [];
  }

  init() {
    const currentPage = LocalStorePagination.getCurrentPage();

    if (currentPage) {
      this.updateLinkRequest(`${this.url}/?page=${currentPage}`);
    }

    const data = this.getData(this.url);

    LocalStoreCustomSort.checkCustomSort(data, this.saveData.bind(this));
  }

  /**
   * Устанавливает новую ссылку для запроса
   * @param {String} url
   */
  updateLinkRequest(url) {
    this.url = url;
  }

  /**
   * Получает данные из localStorage
   * @returns {Array} - массив данных
   */
  getData() {
    const result = localStorage.getItem(this.url);

    return result ? JSON.parse(result) : [];
  }

  /**
   * Проверяет есть ли данные в localStorage и передаёт их посреднику
   */
  checkData() {
    try {
      const data = this.getData(this.url);

      if (!data || !data.length) {
        mediator.publish('localStore:empty', data);

        return;
      }

      mediator.publish('localStore:success', data);
    } catch (error) {
      console.error('Ошибка при получении данных из localStore', error);
    }
  }

  /**
   * Сохраняет данные в локальное хранилище
   * @param {Array} data - массив данных
   */
  saveData(data) {
    this.addIds(data);

    localStorage.setItem(this.url, JSON.stringify(data));
  }

  /**
   * Очищает хранилище
   */
  clearStore() {
    localStorage.removeItem(this.url);
    localStorage.removeItem('previous');
    localStorage.removeItem('next');
    localStorage.removeItem('sort');
    LocalStoreCustomSort.removeCustomSort();
    // localStorage.removeItem('currentPage');
    this.ids = [];
  }

  /**
   * Добавляет идентификаторы к записям
   * @param {Array} data - массив записей
   */
  addIds(data) {
    if (data && data[0]?.id) {
      return;
    }

    data.forEach((item) => {
      if (this.ids.length) {
        const newId = this.ids[this.ids.length - 1] + 1;
        this.ids.push(newId);
        item.id = newId;

        return;
      }

      this.ids.push(1);
      item.id = 1;
    });
  }

  /**
   * Сортирует данные в хранилище
   * @param {Number} indexColumn - индект колонки для сортировки
   * @param {String} direction - направление сортировки
   */
  sortData(indexColumn, direction) {
    const data = this.getData(this.url);

    LocalStoreCustomSort.removeCustomSort();
    LocalStoreSorter.sortData(data, indexColumn, this.saveData.bind(this), direction);
  }

  /**
   * Проверяет есть ли сейчас информация о сортирке
   */
  // eslint-disable-next-line class-methods-use-this
  checkSortData() {
    LocalStoreSorter.checkSortData();
  }

  /**
   * Получает информацию о текущей сохранённой сортировке
   * @returns {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  getSortInfo() {
    return LocalStoreSorter.getSortInfo();
  }

  /**
   * Удаляет запись из хранилища
   * @param {String} id - id записи
   */
  removeRow(id) {
    const data = this.getData(this.url);

    LocalStoreDrops.removeRow(data, id, this.saveData.bind(this));
  }

  /**
   * Сообщает информацию о пагинации
   */
  // eslint-disable-next-line class-methods-use-this
  getPagination() {
    LocalStorePagination.getPagination();
  }

  // eslint-disable-next-line class-methods-use-this
  setCustomSort(orderList) {
    LocalStoreCustomSort.setCustomSort(orderList);
  }
}

class LocalStoreSorter {
  /**
   * Сортирует данные в хранилище
   * @param {Array} data - данные
   * @param {Number} indexColumn - индект колонки для сортировки
   * @param {Function} action - функция для сохранения результата
   * @param {String} defaultDirection - направление сортировки по умолчанию
   */
  static sortData(data, indexColumn, action, defaultDirection) {
    const keys = Object.keys(data[0]);
    const sort = LocalStoreSorter.getSortInfo();
    const fieldSortNane = keys[indexColumn];

    if (Utils.isEmptyObject(sort)) {
      Utils.sortAsc(data, fieldSortNane);
      LocalStoreSorter.saveSortData(indexColumn, 'asc');
    } else {
      const { by } = sort;
      let { direction } = sort;

      if (defaultDirection) {
        direction = defaultDirection;
      } else if (by !== indexColumn) {
        direction = 'asc';
      } else {
        direction = direction === 'asc' ? 'desc' : 'asc';
      }

      const methodSort = direction === 'asc' ? Utils.sortAsc : Utils.sortDesc;

      methodSort(data, fieldSortNane);

      LocalStoreSorter.saveSortData(indexColumn, direction);
    }

    action(data);

    mediator.publish('localStore:success', data);
  }

  /**
   * Сохраняет информацию о сортировки в localStorage
   * и сообщает подписанным компонентам что произошла сотировка
   * @param {Number} index - индекс столбца в котором сортируем
   * @param {String} direction - направление сортировки
   */
  static saveSortData(index, direction) {
    localStorage.setItem('sort', JSON.stringify({
      by: index,
      direction,
    }));

    mediator.publish('localStore:updateSort', {
      by: index,
      direction,
    });
  }

  /**
   * Получает информацию о текущей сохранённой сортировке
   * @returns {Object}
   */
  static getSortInfo() {
    const sort = localStorage.getItem('sort');

    if (sort) {
      return JSON.parse(sort);
    }

    return {};
  }

  /**
   * Проверяет есть ли сейчас информация о сортирке
   * и если есть сообщает подписчикам что нужно отсортировать данные
   */
  static checkSortData() {
    const sort = LocalStoreSorter.getSortInfo();

    if (!Utils.isEmptyObject(sort)) {
      mediator.publish('localStore:updateSort', sort);
    }
  }
}

class LocalStoreDrops {
  /**
   * Удаляет запись из хранилища
   * @param {Array} data - данные
   * @param {String} id - id записи
   * @param {Function} action - функция для сохранения результата
   * @returns
   */
  static removeRow(data, id, action) {
    const removeItemIndex = data.findIndex((item) => Number(item.id) === Number(id));

    if (removeItemIndex === -1) {
      return;
    }

    data.splice(removeItemIndex, 1);

    action(data);

    if (data.length) {
      mediator.publish('localStore:success', data);

      return;
    }

    mediator.publish('localStore:clear');
  }
}

class LocalStorePagination {
  /**
   * Обновляет данные о пагинации
   * @param {Object} data - новые данные
   */
  static updatePaginationInfo(data) {
    const { previous, next } = data;
    const pagination = {};

    if (previous) {
      localStorage.setItem('previous', previous);
      pagination.previous = previous;
    } else {
      localStorage.removeItem('previous');
    }

    if (next) {
      localStorage.setItem('next', next);
      pagination.next = next;
    } else {
      localStorage.removeItem('next');
    }

    mediator.publish('localStore:updatePagination', pagination);
  }

  /**
   * Сообщает данные о текущей пагинации
   */
  static getPagination() {
    mediator.publish('localStore:updatePagination', {
      previous: localStorage.getItem('previous'),
      next: localStorage.getItem('next'),
    });
  }

  /**
   * Возвращает ссылку на предыдущую страницу
   * @return {string}
   */
  static getPaginationPrevLink() {
    return localStorage.getItem('previous');
  }

  /**
   * Возвращает ссылку на следующую страницу
   * @return {string}
   */
  static getPaginationNextLink() {
    return localStorage.getItem('next');
  }

  /**
   * Устанавливает номер текущей страницы
   * @param {String} currentPage
   */
  static setCurrentPage(currentPage) {
    localStorage.setItem('currentPage', currentPage);
  }

  /**
   * Возвращает номер текущей страницы
   */
  static getCurrentPage() {
    return localStorage.getItem('currentPage');
  }
}

class LocalStoreCustomSort {
  /**
   * Проверяет есть ли сохранённая информация о кастомной сортировке
   * @param {Array} data - данные
   * @param {Function} action - функция для сохранения результата
   */
  static checkCustomSort(data, action) {
    const customOrder = JSON.parse(LocalStoreCustomSort.getCustomSort());

    if (!customOrder) {
      return;
    }

    const newArray = [];

    for (let i = 0; i < customOrder.length; i++) {
      const item = data.find((elem) => Number(elem.id) === Number(customOrder[i]));

      newArray.push(item);
    }

    action(newArray);
  }

  /**
   * Сохраняет массив с кастомным порядком сортировки
   * @param {Array} orderList
   */
  static setCustomSort(orderList) {
    localStorage.setItem('customSort', JSON.stringify(orderList));
  }

  /**
   * Возвращает массив с кастомным порядком сортировки
   */
  static getCustomSort() {
    return localStorage.getItem('customSort');
  }

  /**
   * Удаялет массив с кастомным порядком сортировки
   */
  static removeCustomSort() {
    localStorage.removeItem('customSort');
  }
}

export default Store;
