import _  from './es6/underscore.js'
import {Store} from './utils/redux.js'
import {reduceReducers} from './utils/redux.js'
import initState from './state.js'
import {mapReducer, baseReducer} from './reducers.js'
import Middleware from './middleware/requests.js'
import Map from './map/map.js'
import BaseMapView from './modules/base/base-map-view.js'



var store = Store(reduceReducers([mapReducer, baseReducer]), [Middleware]);
store.state = initState;
window.store = store;

var map = Map('map', store);
var bmv = BaseMapView(store,map)
store("INIT")


