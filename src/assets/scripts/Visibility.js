import Mediator from './Mediator';

const mediator = new Mediator();

class Visibility {
  constructor(options) {
    /**
     * Класс для показа блоков
     * @type {String}
     */
    this.activeClass = options.activeClass;

    /**
     * Массив объектов с информацией о блоках которые скрываем/показываем
     */
    this.visibilityBlocks = options.visibility;

    /**
     * id объекта блоки которого показываем
     */
    this.activeBlocksId = null;
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
    if (!this.visibilityBlocks || !this.visibilityBlocks.length) {
      return;
    }

    this.visibilityBlocks.forEach((item) => {
      mediator.subscribe(item.action, () => {
        this.activeBlocksId = item.id;
        this.#toggleBlocks();
      });
    });
  }

  /**
   * Обрабатывает какие блоки на странице сейчас скрывать, а какие показывать
   */
  #toggleBlocks() {
    const hiddenBlocks = this.visibilityBlocks.reduce((res, item) => {
      if (item.id !== this.activeBlocksId) {
        res.push(item.blocks);
      }

      return res;
    }, []);
    const showBlocks = this.visibilityBlocks.reduce((res, item) => {
      if (item.id === this.activeBlocksId) {
        res.push(item.blocks);
      }

      return res;
    }, []);

    this.#hideBlocks(hiddenBlocks.flat());
    this.#showBlocks(showBlocks.flat());
  }

  /**
   * Показывает блоки
   * @param {Array} blocks - массив блоков которые пользователь должен видеть
   */
  #showBlocks(blocks) {
    blocks.forEach((block) => {
      block.classList.add(this.activeClass);
    });
  }

  /**
   * Скрывает блоки
   * @param {Array} blocks - массив блоков которые пользователь должен не видеть
   */
  #hideBlocks(blocks) {
    blocks.forEach((block) => {
      block.classList.remove(this.activeClass);
    });
  }
}

export default Visibility;
