import Actions from './Actions';
import Loader from './Loader';
import Pagination from './Pagination';
import Store from './Store';
import Table from './Table';
import Visibility from './Visibility';

class App {
  constructor(options) {
    this.wrapper = options.wrapper;
    this.maxColumns = options.maxColumns;
    this.classShowBlock = options.classShowBlock;
    this.url = options.url;
    this.store = null;
  }

  init() {
    this.#getElements();
    this.#initDependencies();
  }

  #getElements() {
    this.getButton = this.wrapper.querySelector('.js-get-data');
    this.clearButton = this.wrapper.querySelector('.js-clear-data');
    this.errorBlock = this.wrapper.querySelector('.js-error-block');
    this.plug = this.wrapper.querySelector('.js-plug');
    this.table = this.wrapper.querySelector('.js-table');
    this.tableHead = this.table.querySelector('thead');
    this.tableBody = this.table.querySelector('tbody');
    this.tableBodyWrapper = this.table.querySelector('.js-table-body');
    this.loader = this.wrapper.querySelector('.js-loader');
    this.paginationPrev = this.wrapper.querySelector('.js-pagination-prev');
    this.paginationNext = this.wrapper.querySelector('.js-pagination-next');
  }

  #initDependencies() {
    this.store = new Store(this.url);
    this.store.init();

    this.#initActions();
    this.#initVisibility();
    this.#initTable();
    this.#initLoader();
    this.#initPagination();
  }

  #initActions() {
    const actionsList = [
      { target: this.getButton, action: 'store:request' },
      { target: this.clearButton, action: 'localStore:clear' },
      { target: this.paginationPrev, action: 'pagination:prev' },
      { target: this.paginationNext, action: 'pagination:next' },
    ];
    const actions = new Actions(actionsList);

    actions.init();
  }

  #initVisibility() {
    const options = {
      activeClass: this.classShowBlock,
      visibility: [
        { id: 1, blocks: [this.errorBlock, this.getButton], action: 'store:error' },
        { id: 2, blocks: [this.plug, this.getButton], action: 'localStore:clear' },
        { id: 3, blocks: [this.table, this.clearButton], action: 'localStore:success' },
        { id: 4, blocks: [this.plug, this.getButton], action: 'localStore:empty' },
      ],
    };
    const visibility = new Visibility(options);

    visibility.init();
  }

  #initTable() {
    const options = {
      head: this.tableHead,
      body: this.tableBody,
      columnCount: this.maxColumns,
      store: this.store.localStore,
      tableBodyWrapper: this.tableBodyWrapper,
    };
    const tableBlock = new Table(options);

    tableBlock.init();
  }

  #initLoader() {
    const options = {
      loaderBlock: this.loader,
      activeClass: this.classShowBlock,
    };
    const loader = new Loader(options);

    loader.init();
  }

  #initPagination() {
    const buttons = {
      prev: this.paginationPrev,
      next: this.paginationNext,
      store: this.store.localStore,
    };
    const pagination = new Pagination(buttons);

    pagination.init();
  }
}

export default App;
