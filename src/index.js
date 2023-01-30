import './assets/styles/styles.scss';
import App from './assets/scripts/App';

const baseUrl = 'https://swapi.dev/api';
const chapter = 'people';
const maxColumns = 5;
const classShowBlock = 'is-active';

const wrapper = document.querySelector('#app');

const application = new App({
  wrapper,
  maxColumns,
  classShowBlock,
  url: `${baseUrl}/${chapter}`,
});

application.init();
