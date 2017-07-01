
import {DRAW_DISTANCE} from '../../map/modes.js'
import {selectedBaseLayer} from '../../state.js'
import {BASE_DISTANCE_SET, DRAWING_MODE_SET} from '../../actions.js'


//export function DistanceLine

export default function(store, map){

    var line = null;
    var tooltip = null; 
    store.on('map.drawing_mode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'})   
            line.on('editable:editing', on_edit)
        }
    });

    store.on('selectedBaseLayer.distance', function(e){
        if(!e.new_val || !e.new_val.points) {
            if(line) {
                map.removeLayer(line);
                line = null;
            }
        }
    });

    store.on('selectedBaseLayer.size_m', function(e){
        if(!line || !e.new_val) return
        var points = selectedBaseLayer(store).distance.points;
        var latLngs = points.map(function(it){
            return map.unproject(it,1);
        });
        line.disableEdit()
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(selectedBaseLayer(store).distance.length_m)
    });

    function on_edit(event)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) 
        {
            var latLngs = line.getLatLngs();
            map.editTools.stopDrawing();
            var points = latLngs.map(function(it){
                return map.project(it,1);
            });
            var length_px = points[0].distanceTo(points[1]);
            var length_m = Math.round(L.CRS.Simple.distance(latLngs[0], latLngs[1]));
            updateTooltip(length_m)
            store(BASE_DISTANCE_SET, {length_px: length_px, length_m:length_m, points: points});
            store(DRAWING_MODE_SET, null);
        }
    }

    function updateTooltip(length_m){
        var content = length_m + ' m';
        if(line.getTooltip())
            line.getTooltip().setLatLng(line.getCenter()).setContent(content);
        else
            line.bindTooltip(content, {permanent:true, interactive:true}); 
                
    }

    function log(name, event){
        console.log(name, event.type, event);
    }
}