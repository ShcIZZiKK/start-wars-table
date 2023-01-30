import Mediator from './Mediator';

const mediator = new Mediator();

class Loader {
  constructor(options) {
    /**
     * Блок лоадера
     * @type {Node}
     */
    this.loaderBlock = options.loaderBlock;

    /**
     * Класс для показа лоадера
     * @type {String}
     */
    this.activeClass = options.activeClass;
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.#subscribe();
  }

  /**
   * Подписка на события посредника
   */
  #subscribe() {
    mediator.subscribe('store:request', () => {
      this.#showLoader();
    });

    mediator.subscribe('store:finallyRequest', () => {
      this.#hideLoader();
    });
  }

  /**
   * Показывает лоадер
   */
  #showLoader() {
    this.loaderBlock.classList.add(this.activeClass);
  }

  /**
   * Скрывает лоадер
   */
  #hideLoader() {
    this.loaderBlock.classList.remove(this.activeClass);
  }
}

export default Loader;
