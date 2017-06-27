
import {DRAW_DISTANCE} from '../modes.js'

/**
 * Draw distance line
 * @param {*} store 
 * @param {*} map 
 */

export default function(store, map)
{
    var line = null;

    store.on('map.drawMode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            line = map.editTools.startPolyline(undefined, {weight:1, color: 'red'})   
            map.on('editable:editing', on_edit)
        }
        else {
            map.off('editable:editing', on_edit)
        }
    });

    function on_edit(e)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) {
            map.editTools.stopDrawing();
        }
        
        store('DRAW_MODE_SET', null);
    }

}