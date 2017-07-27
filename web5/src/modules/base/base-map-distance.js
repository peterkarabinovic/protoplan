
import {DRAW_DISTANCE} from '../../map/modes.js'
import {selectedBase} from '../../state.js'
import {BASE_DISTANCE_SET, DRAWING_MODE_SET} from '../../actions.js'



export default function(store, map){

    var line = null;
    var tooltip = null; 
    store.on('map.drawMode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            L.setOptions(map.editTools, {skipMiddleMarkers: true});
            line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'})   
            line.on('editable:editing', on_edit)
        }
        else if(e.old_val == DRAW_DISTANCE) {
            L.setOptions(map.editTools, {skipMiddleMarkers: false});            
        }
    });

    store.on('selectedBase.distance', function(e){
        if(!e.new_val || !e.new_val.points) {
            if(line) {
                line.disableEdit();
                map.removeLayer(line);
                line = null;
            }
        }
    });

    store.on('selectedBase.size_m', function(e){
        if(!line || !e.new_val || !selectedBase(store).distance) return
        var points = selectedBase(store).distance.points;
        var latLngs = points.map(function(it){
            return map.unproject(it,1);
        });
        line.disableEdit()
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(selectedBase(store).distance.length_m)
    });

    function on_edit(event)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) 
        {
            var latLngs = line.getLatLngs();
            map.editTools.commitDrawing();
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

}