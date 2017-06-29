
import {DRAW_DISTANCE} from '../map/modes.js'
import {getModuleBase} from '../reducers/reducers.js'


//export function DistanceLine

export function BaseScaleEditor(map, store){

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

    store.on('layers.base.size_m', function(){
        if(!line) return
        var points = getModuleBase(store).points;
        var latLngs = points.map(function(it){
            return map.layerPointToLatLng(it);
        });
        line.disableEdit()
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(getModuleBase(store).length_m)
    });

    function on_edit(event)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) 
        {
            var latLngs = line.getLatLngs();
            map.editTools.stopDrawing();
            var points = latLngs.map(function(it){
                return map.latLngToLayerPoint(it);
            });
            var length_px = points[0].distanceTo(points[1]);
            var length_m = Math.round(L.CRS.Simple.distance(latLngs[0], latLngs[1]));
            updateTooltip(length_m)
            store('DISTANCE_LINE_SET', {length_px: length_px, length_m:length_m, points: points});
            store('DRAWING_MODE_SET', null);
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