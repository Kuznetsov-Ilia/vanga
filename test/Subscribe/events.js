import {USER} from 'app/globals';
import Api from 'app/Api';
import {active} from './styles';
export default {
  click
}

function click(e) {
  var target = e.target;
  var isActive = target.classList.has(active);
  var method = isActive ? 'brand_unfollow' : 'brand_follow';
  var urlname = target.data('urlname');
  if (USER.isAuthed()) {
    e.preventDefault();
    Api(method, {urlname})
      .ok(() => target.classList.toggle(active, !isActive))
  }
}
