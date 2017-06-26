import {Store} from './redux.js'
import Reducers from './reducers/reducers.js'
import {Map} from './map/map.js'
import {BaseImageView} from './views/view-base-image.js'


var store = Store(Reducers);
window.store = store;

store("INIT")

Map('map', store);
BaseImageView(store);





