import Mediator from './Mediator';

const mediator = new Mediator();

class Actions {
  constructor(buttons) {
    /**
     * Массив объектов с таргетами по которым нажимаем, и событиями которые сработают от нажатия
     * @type {Array}
     */
    this.buttons = buttons;
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
    if (!this.buttons || !this.buttons.length) {
      return;
    }

    this.buttons.forEach((button) => {
      button.target.addEventListener('click', () => {
        mediator.publish(button.action);
      });
    });
  }
}

export default Actions;
