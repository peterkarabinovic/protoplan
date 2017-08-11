import _  from '../../es6/underscore.js'
import {t} from '../../locale.js'
import {DRAW_DISTANCE, EDIT_GRID} from '../../map/modes.js'

import {FileHandler} from './base-file-change.js'
import {baseLayer} from '../../state.js'
import {DRAWING_MODE_SET, 
        BASE_DISTANCE_LENGTH_SET} from '../../actions.js'


export default function BaseView(store) {

    var el = function(id) { return document.getElementById(id) }
    var show = function(id) { el(id).style['display'] = '' }
    var hide = function(id) { el(id).style['display'] = 'none' }
    var html = function(id, t) {  el(id).innerHTML = t }
    var text = function(id, t) {  el(id).innerText = t }
    var value = function(id, t) {  el(id).value = t }


    el('file').onchange = FileHandler(store, function(error){ 
        html('error', error);
    });

    el('draw_line').onchange = function(){
        store(DRAWING_MODE_SET, el('draw_line').checked ? DRAW_DISTANCE : null);
    }

    el('grid_edit').onchange = function(){
        store(DRAWING_MODE_SET, el('grid_edit').checked ? EDIT_GRID : null);
    }

    el('distance_input').oninput = _.debounce( function(e){
        var v = parseInt(el('distance_input').value)
        if(!Number.isNaN(v) && v > 0)
            store(BASE_DISTANCE_LENGTH_SET, v);
    }, 500);

    store.on('selectedBase.size_m', function(e){
        if(e.new_val) {
            var size = e.new_val
            show('toolbar')
            show('size')
            text('size_input', Math.round(size.x) + 'x' + Math.round(size.y))
        }
    }); 

    store.on('selectedBase.distance', function(e){
        if(e.new_val){
            show('distance');
            value('distance_input', e.new_val.length_m)
        }
        else {
            hide('distance');
        }
    });

    store.on('map.drawMode', function(e){
        el('draw_line').checked = e.new_val == DRAW_DISTANCE;
        el('grid_edit').checked = e.new_val == EDIT_GRID;
    });
} 

