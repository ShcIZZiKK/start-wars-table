import Mediator from './Mediator';

const mediator = new Mediator();

class Pagination {
  constructor(options) {
    /**
     * Ссылка на следующую страницу
     * @type {String}
     */
    this.nextPage = null;

    /**
     * Ссылка на предыдущую страницу
     * @type {String}
     */
    this.prevPage = null;

    /**
     * Кнопка на предыдущую страницу
     * @type {Node}
     */
    this.prevButton = options.prev;

    /**
     * Кнопка на следующую страницу
     * @type {Node}
     */
    this.nextButton = options.next;

    /**
     * Единое хранилище данных
     * @type {Object}
     */
    this.store = options.store;
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#subscribe();
    this.#checkPagination();
  }

  /**
   * Проверка дефолтной пагинации
   */
  #checkPagination() {
    this.store.getPagination();
  }

  /**
   * Подписка на события посредника
   */
  #subscribe() {
    mediator.subscribe('localStore:updatePagination', (data) => {
      const { previous, next } = data;

      this.nextPage = next || null;
      this.prevPage = previous || null;

      this.#updateVisibleButtons();
    });
  }

  /**
   * Скрывает/показывает кнопки пагинации
   */
  #updateVisibleButtons() {
    const methodToPrevButton = this.prevPage ? 'add' : 'remove';
    const methodToNextButton = this.nextPage ? 'add' : 'remove';

    this.prevButton.classList[methodToPrevButton]('is-active');
    this.nextButton.classList[methodToNextButton]('is-active');
  }
}

export default Pagination;
