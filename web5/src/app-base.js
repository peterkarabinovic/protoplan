import _  from './es6/underscore.js'
import {Store} from './utils/redux.js'
import {reduceReducers} from './utils/redux.js'
import initState from './state.js'
import {mapReducer, baseReducer} from './reducers.js'
import Map from './map/map.js'
import BaseView from './modules/base/base-view.js'
import BaseMapView from './modules/base/base-map-view.js'
import BaseMapDistance from './modules/base/base-map-distance.js'
import BaseGridEdit from './modules/base/base-grid-edit.js'



var store = Store(reduceReducers([mapReducer, baseReducer]));
store.state = initState;
window.store = store;

var map = Map('map', store);
BaseView(store);
var bmv = BaseMapView(store,map)
BaseMapDistance(store,map)
BaseGridEdit(store, map, bmv)
store("INIT")


