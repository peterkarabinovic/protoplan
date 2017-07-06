import {Store} from './utils/redux.js'
import {initComponents} from './utils/vue-componets.js'
import initState from './state.js'
import reducers from './reducers.js'
import RequestsMiddleware from './middleware/requests.js'
import Map from './map/map.js'
import PavilionModule from './modules/pavilion/ui-view.js'
import BaseModule from './modules/base/ui-view.js'
import OverlaysModule from './modules/overlays/ui-view.js'

initComponents();


var store = Store(reducers, [RequestsMiddleware]);
store.state = initState;
window.store = store;


var map = Map('map', store);
PavilionModule(store);
BaseModule(store, map);
OverlaysModule(store, map);

store("INIT")





