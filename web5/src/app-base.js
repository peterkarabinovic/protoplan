import _  from './es6/underscore.js'
import {Store} from './utils/redux.js'
import initState from './state.js'
import reducers from './reducers.js'
import Map from './map/map.js'
import BaseMapView from './modules/base/base-map-view.js'
import BaseMapDistance from './modules/base/base-map-distance.js'
import {FileHandler} from './modules/base/base-file-change.js'

import {DRAW_DISTANCE} from './map/modes.js'
import {DRAWING_MODE_SET} from './actions.js'

var store = Store(reducers);
store.state = initState;
window.store = store;

var map = Map('map', store);
BaseMapView(store,map)
BaseMapDistance(store,map)
store("INIT")


var $ = function(id) { return document.getElementById(id) }
var show = function(id) { $(id).style['display'] = '' }
var html = function(id, t) {  $(id).innerHTML = t }
var text = function(id, t) {  $(id).innerText = t }


$('file').onchange = FileHandler(store, function(error){ 
    html('error', error);
});

$('draw_line').onclick = function(){
    store(DRAWING_MODE_SET, DRAW_DISTANCE);
}

store.on('selectedBase.size_m', function(e){
    if(e.new_val) {
        var size = e.new_val
        show('toolbar')
        show('size')
        text('size', size.x + ' - ' + size.y)
    }
});

