import {combine, Store} from './utils/redux.js'
import Map from './map/map.js'
import BaseModule from './modules/base/index.js'

var reducers = combine({
    layers: combine({
        base: BaseModule.reducer
    }),
    map: Map.reducer
});

var store = Store(reducers);
window.store = store;


var map = Map('map', store);
BaseModule(store, map);





