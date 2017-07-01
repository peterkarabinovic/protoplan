import {Store} from './utils/redux.js'
import {initComponents} from './utils/vue-componets.js'
import initState from './state.js'
import reducers from './reducers.js'
import RequestsMiddleware from './middleware/requests.js'
import Map from './map/map.js'
import BaseModule from './modules/base/index.js'
import PavilionModule from './modules/pavilion/ui-view.js'

initComponents();


// var reducers = combine({
//     layers: combine({
//         base: BaseModule.reducer
//     }),
//     map: Map.reducer
// });

var store = Store(reducers, [RequestsMiddleware]);
store.state = initState;
window.store = store;


var map = Map('map', store);
PavilionModule(store);
BaseModule(store, map);

store("INIT")





