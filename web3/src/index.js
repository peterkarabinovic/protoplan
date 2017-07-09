import config from './config.json'
import {Store} from './utils/redux.js'
import {bindProp} from './utils/redux-vue.js'
import {initComponents} from './utils/vue-componets.js'
import initState from './state.js'
import reducers from './reducers.js'
import RequestsMiddleware from './middleware/requests.js'
import Map from './map/map.js'
import PavilionModule from './modules/pavilion/pavilion-view.js'
import BaseModule from './modules/base/base-view.js'
import OverlaysModule from './modules/overlays/overlay-view.js'

initComponents();


var store = Store(reducers, [RequestsMiddleware]);
bindProp(store);
store.state = initState;
window.store = store;


var map = Map('map', store);
PavilionModule(store);
BaseModule(store, map);
OverlaysModule(config, store, map);

store("INIT")





