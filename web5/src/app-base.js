import _  from './es6/underscore.js'
import Bind from './es6/bind.js'
import {Store} from './utils/redux.js'
import initState from './state.js'
import reducers from './reducers.js'
import Map from './map/map.js'
import BaseMapView from './modules/base/base-map-view.js'
import {FileHandler} from './modules/base/base-file-change.js'

var store = Store(reducers);
store.state = initState;
window.store = store;

var map = Map('map', store);
BaseMapView(store,map)
store("INIT")


var form = Bind({
    error: '',
}, {
    error: '#error',
})

document.getElementById('file').onchange = FileHandler(store, function(error){ error.length && alert(error); } );