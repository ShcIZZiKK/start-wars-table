import Mediator from './Mediator';

const mediator = new Mediator();

class Table {
  constructor(options) {
    /**
     * Шапка таблицы
     * @type {Node}
     */
    this.head = options.head;

    /**
     * Тело таблицы
     * @type {Node}
     */
    this.body = options.body;

    /**
     * Количество столбцов в таблице
     * @type {Number}
     */
    this.columnCount = options.columnCount;

    /**
     * Единое хранилище данных
     * @type {Object}
     */
    this.store = options.store;

    /**
     * Обёртка тела таблицы
     */
    this.tableBodyWrapper = options.tableBodyWrapper;

    /**
     * Массив заголовков для сортировки
     * @type {Array}
     */
    this.headItems = [];

    /**
     * Экземпляр класса для работы с выводом данных
     */
    this.tableGenerator = null;

    /**
     * Экземпляр класса для работы с сортировкой данных
     */
    this.tableSorter = null;

    /**
     * Экземпляр класса для работы с удалением данных
     */
    this.tableDrops = null;

    /**
     * Класс для кнопки удаления
     * @type {String}
     */
    this.removeButtonClass = 'js-remove-row';
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#initDependencies();
    this.#subscribe();
    this.#checkSaveData();
    this.#checkSortDefault();
  }

  /**
   * Инициализация зависимостей
   */
  #initDependencies() {
    this.tableGenerator = new TableGenerator({
      head: this.head,
      body: this.body,
      columnCount: this.columnCount,
      removeButtonClass: this.removeButtonClass,
    });

    this.tableSorter = new TableSorter({
      head: this.head,
      store: this.store,
    });

    this.tableDrops = new TableDrops({
      body: this.body,
      store: this.store,
      removeButtonClass: this.removeButtonClass,
    });

    this.tableDragAndDrop = new TableDragAndDrop({
      table: this.tableBodyWrapper,
      store: this.store,
    });
  }

  /**
   * Проверка сохранённых данных в localStore
   */
  #checkSaveData() {
    this.store.checkData();
  }

  /**
   * Проверка сохранённой сортировки в localStore
   */
  #checkSortDefault() {
    this.store.checkSortData();
  }

  /**
   * Подписка на события посредника
   */
  #subscribe() {
    mediator.subscribe('localStore:success', (data) => {
      this.tableGenerator.insertData(data);
      this.tableSorter.init();
      this.tableDrops.init();

      this.#updateHeadItems(this.tableSorter.getHeadItems());
      this.tableGenerator.updateHeadItems(this.headItems);

      this.tableDragAndDrop.init();
    });

    mediator.subscribe('localStore:updateSort', (data) => {
      this.tableSorter.updateSortInfo(data);
    });

    mediator.subscribe('localStore:clear', () => {
      this.#updateHeadItems();
      this.tableGenerator.updateHeadItems(this.headItems);
      this.tableSorter.updateHeadItems(this.headItems);
    });
  }

  /**
   * Обновляет массив заголовков для сортировки
   * @param {Array} items
   * @private
   */
  #updateHeadItems(items = []) {
    this.headItems = items;
  }
}

class TableGenerator {
  constructor(options) {
    this.head = options.head;
    this.body = options.body;
    this.columnCount = options.columnCount;
    this.headItems = [];
    this.removeButtonClass = options.removeButtonClass;
  }

  /**
   * Вставляет данные на страницу
   * @param {Array} data
   */
  insertData(data) {
    if (!data || !data.length) {
      return;
    }

    const keys = Object.keys(data[0]);
    const size = keys.length >= this.columnCount ? this.columnCount : keys.length;

    this.#generateHead(keys, size);
    this.#insertDataBody(data, keys, size);
  }

  /**
   * Обновляет массив заголовков для сортировки
   * @param {Array} items
   */
  updateHeadItems(items) {
    this.headItems = items;
  }

  /**
   * Генерирует шапку таблицы
   * @param {Array} keys - массив ключей/заголовков
   * @param {Number} size - количество столбцов
   * @private
   */
  #generateHead(keys, size) {
    if (this.headItems.length) {
      return;
    }

    let result = '<tr>';

    for (let i = 0; i < size; i++) {
      result = `${result}<th>${keys[i]}</th>`;
    }

    result = `${result}<th></th></tr>`;

    this.head.innerHTML = result;
  }

  /**
   * Генерирует тело таблицы
   * @param {Array} data - массив данных
   * @param {Array} keys - массив ключей
   * @param {Number} size - количество столбцов
   * @private
   */
  #insertDataBody(data, keys, size) {
    this.body.innerHTML = data.reduce((row, item) => {
      const { id } = item;
      let newRow = `<tr data-id="${id}">`;

      for (let i = 0; i < size; i++) {
        newRow = `${newRow}<td>${item[keys[i]]}</td>`;
      }

      newRow = `${newRow}
                <td>
                    <button class="${this.removeButtonClass}">X</button>
                </td>
            </tr>`;

      return `${row}${newRow}`;
    }, '');
  }
}

class TableSorter {
  constructor(options) {
    this.head = options.head;
    this.store = options.store;
    this.headItems = [];
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#bindEvents();
  }

  /**
   * Навешивает обработчики событий
   */
  #bindEvents() {
    if (!this.headItems.length) {
      this.headItems = this.head.querySelectorAll('th');

      this.headItems.forEach((item, index) => {
        item.addEventListener('click', () => {
          this.store.sortData(index);
        });
      });
    }
  }

  /**
   * Обновляет массив заголовков для сортировки
   * @param {Array} items
   */
  updateHeadItems(items) {
    this.headItems = items;
  }

  /**
   * Возвращает массив заголовков для сортировки
   * @returns {Array}
   */
  getHeadItems() {
    return this.headItems;
  }

  /**
   * Обновляет визуализацию сортировки
   * @param {Number} by - индекс столбца с активной сортировкой
   * @param {String} direction - направление сортировки
   */
  updateSortInfo({ by = 0, direction = 'asc' }) {
    if (!this.headItems.length) {
      return;
    }

    this.headItems.forEach((item) => {
      item.classList.remove('is-active');
    });

    this.headItems[by].classList.add('is-active');

    if (direction === 'asc') {
      this.headItems[by].classList.remove('sort-desc');
      this.headItems[by].classList.add('sort-asc');

      return;
    }

    this.headItems[by].classList.remove('sort-asc');
    this.headItems[by].classList.add('sort-desc');
  }
}

class TableDrops {
  constructor(options) {
    this.body = options.body;
    this.store = options.store;
    this.removeButtonClass = options.removeButtonClass;
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#bindEvents();
  }

  /**
   * Навешивает обработчики событий
   */
  #bindEvents() {
    const removeButtons = this.body.querySelectorAll(`.${this.removeButtonClass}`);

    removeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const { id } = button.closest('tr').dataset;

        this.store.removeRow(id);
      });
    });
  }
}

class TableDragAndDrop {
  constructor(options) {
    this.table = options.table;
    this.store = options.store;
    this.draggingEle = null;
    this.draggingRowIndex = null;
    this.placeholder = null;
    this.list = null;
    this.isDraggingStarted = false;
    this.x = 0;
    this.y = 0;
  }

  init() {
    this.defaultMouseDownHandler = this.mouseDownHandler.bind(this);
    this.defaultMouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.defaultMouseUpHandler = this.mouseUpHandler.bind(this);
    this.#bindEvents();
  }

  #bindEvents() {
    this.table.querySelectorAll('tr').forEach((row) => {
      const firstCell = row.firstElementChild;

      firstCell.classList.add('draggable');
      firstCell.addEventListener('mousedown', this.defaultMouseDownHandler);
    });
  }

  static #swap(nodeA, nodeB) {
    const parentA = nodeA.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    nodeB.parentNode.insertBefore(nodeA, nodeB);

    parentA.insertBefore(nodeB, siblingA);
  }

  static #isAbove(nodeA, nodeB) {
    const rectA = nodeA.getBoundingClientRect();
    const rectB = nodeB.getBoundingClientRect();

    return rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2;
  }

  cloneTable() {
    const width = parseInt(window.getComputedStyle(this.table).width, 10);

    this.list = document.createElement('div');
    this.list.classList.add('clone-list');
    this.list.style.position = 'absolute';
    this.table.parentNode.insertBefore(this.list, this.table);

    this.table.style.visibility = 'hidden';

    this.table.querySelectorAll('tr').forEach((row) => {
      const item = document.createElement('div');
      item.classList.add('draggable');

      const newTable = document.createElement('tbody');
      newTable.setAttribute('class', 'clone-table');
      newTable.style.width = `${width}px`;

      const newRow = document.createElement('tr');
      const cells = [].slice.call(row.children);

      cells.forEach((cell) => {
        const newCell = cell.cloneNode(true);

        newCell.style.width = `${parseInt(window.getComputedStyle(cell).width, 10)}px`;
        newRow.appendChild(newCell);
      });

      newTable.appendChild(newRow);
      item.appendChild(newTable);
      this.list.appendChild(item);
    });
  }

  mouseDownHandler(e) {
    const originalRow = e.target.parentNode;

    this.draggingRowIndex = [].slice.call(this.table.querySelectorAll('tr')).indexOf(originalRow);
    this.x = e.clientX;
    this.y = e.clientY;

    document.addEventListener('mousemove', this.defaultMouseMoveHandler);
    document.addEventListener('mouseup', this.defaultMouseUpHandler);
  }

  mouseMoveHandler(e) {
    if (!this.isDraggingStarted) {
      this.isDraggingStarted = true;

      this.cloneTable();

      this.draggingEle = [].slice.call(this.list.children)[this.draggingRowIndex];
      this.draggingEle.classList.add('dragging');
      this.placeholder = document.createElement('div');
      this.placeholder.classList.add('placeholder');
      this.draggingEle.parentNode.insertBefore(this.placeholder, this.draggingEle.nextSibling);
      this.placeholder.style.height = `${this.draggingEle.offsetHeight}px`;
    }

    this.draggingEle.style.position = 'absolute';
    this.draggingEle.style.top = `${this.draggingEle.offsetTop + e.clientY - this.y}px`;
    this.draggingEle.style.left = `${this.draggingEle.offsetLeft + e.clientX - this.x}px`;

    this.x = e.clientX;
    this.y = e.clientY;

    const prevEle = this.draggingEle.previousElementSibling;
    const nextEle = this.placeholder.nextElementSibling;

    if (prevEle && TableDragAndDrop.#isAbove(this.draggingEle, prevEle)) {
      TableDragAndDrop.#swap(this.placeholder, this.draggingEle);
      TableDragAndDrop.#swap(this.placeholder, prevEle);

      return;
    }

    if (nextEle && TableDragAndDrop.#isAbove(nextEle, this.draggingEle)) {
      TableDragAndDrop.#swap(nextEle, this.placeholder);
      TableDragAndDrop.#swap(nextEle, this.draggingEle);
    }
  }

  mouseUpHandler() {
    if (!this.placeholder || !this.placeholder.parentNode) {
      return;
    }

    // eslint-disable-next-line no-unused-expressions
    this.placeholder && this.placeholder.parentNode.removeChild(this.placeholder);

    this.draggingEle.classList.remove('dragging');
    this.draggingEle.style.removeProperty('top');
    this.draggingEle.style.removeProperty('left');
    this.draggingEle.style.removeProperty('position');

    const endRowIndex = [].slice.call(this.list.children).indexOf(this.draggingEle);

    this.isDraggingStarted = false;
    this.list.parentNode.removeChild(this.list);

    let rows = [].slice.call(this.table.querySelectorAll('tr'));

    // eslint-disable-next-line no-unused-expressions
    this.draggingRowIndex > endRowIndex
      ? rows[endRowIndex].parentNode.insertBefore(rows[this.draggingRowIndex], rows[endRowIndex])
      : rows[endRowIndex].parentNode.insertBefore(
        rows[this.draggingRowIndex],
        rows[endRowIndex].nextSibling,
      );

    this.table.style.removeProperty('visibility');

    document.removeEventListener('mousemove', this.defaultMouseMoveHandler);
    document.removeEventListener('mouseup', this.defaultMouseUpHandler);

    rows = [].slice.call(this.table.querySelectorAll('tr'));

    const orderList = rows.map((item) => item.dataset.id);

    this.store.setCustomSort(orderList);
  }
}

export default Table;
