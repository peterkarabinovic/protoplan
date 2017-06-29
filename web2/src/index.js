import {Store} from './redux.js'
import Reducers from './reducers/reducers.js'
import {Map} from './map/map.js'
import {BaseImageView} from './modules/view-base-scale.js'
import {BaseScaleEditor} from './modules/map-base-scale.js'


var store = Store(Reducers);
window.store = store;


var map = Map('map', store);
BaseImageView(store);
BaseScaleEditor(map, store)





