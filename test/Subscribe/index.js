import template from './template';
import events from './events';
import View from 'my-view';
export default View.assign({template, events, init});
function init() {
  console.log('init');
}
