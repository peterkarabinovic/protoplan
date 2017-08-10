import {EDIT_GRID} from '../../map/modes.js'
import * as Util from 'leaflet/src/core/Util.js';
import {DRAWING_MODE_SET, 
        BASE_GRID_GEOMETRY} from '../../actions.js'

export default function(store, map, bmv)
{
    function onGeometryChange()
    {
        var grid = bmv.grid.getPoints();
        store(BASE_GRID_GEOMETRY, grid);
    }

    store.on('map.drawMode', function(e)
    {
        if(e.new_val == EDIT_GRID){
            Util.setOptions(map.editTools, {skipMiddleMarkers: true, draggable: true});
            bmv.grid.enableEdit(map); 
            bmv.grid.on('editable:dragend', onGeometryChange)
            bmv.grid.on('editable:vertex:dragend', onGeometryChange)
        }
        else if(e.old_val == EDIT_GRID) {
            bmv.grid.off('editable:dragend', onGeometryChange)
            bmv.grid.off('editable:vertex:dragend', onGeometryChange)
            bmv.grid.disableEdit();
        }
    });
}