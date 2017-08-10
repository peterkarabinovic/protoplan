
import * as Util from 'leaflet/src/core/Util.js';
import {toLatLng} from 'leaflet/src/geo/LatLng.js'
import {Simple as CRSSimple} from "leaflet/src/geo/crs/CRS.Simple.js";
import {tooltip} from  "leaflet/src/layer/Tooltip.js";
import {popup} from  "leaflet/src/layer/Popup.js";
import {polyline} from  'leaflet/src/layer/vector/Polyline.js';
import {DRAW_DISTANCE} from '../../map/modes.js'
import {selectedBase} from '../../state.js'
import {BASE_DISTANCE_SET, DRAWING_MODE_SET} from '../../actions.js'

// hack to rollup.js load all layer functions
console.log(typeof(tooltip), typeof(popup))

export default function(store, map){

    var line = null;
    var tooltip = null; 
    store.on('map.drawMode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            var ce = map.getCenter();
            var b = map.getBounds();
            var w = (b.getEast() - b.getWest()) / 4;
            var ll = [toLatLng(ce.lat, ce.lng + w),  toLatLng(ce.lat, ce.lng - w)];
            line = polyline(ll, {weight:2, color: 'red', dashArray:'5,10'})   
            line.addTo(map);
            Util.setOptions(map.editTools, {skipMiddleMarkers: true});
            line.enableEdit(map); 
            line.on('editable:editing', on_edit);
            on_edit({layer: line})
        }
        else if(e.old_val == DRAW_DISTANCE) {
            Util.setOptions(map.editTools, {skipMiddleMarkers: false}); 
            store(BASE_DISTANCE_SET);
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
            var length_m = Math.round(CRSSimple.distance(latLngs[0], latLngs[1]));
            updateTooltip(length_m)
            store(BASE_DISTANCE_SET, {length_px: length_px, length_m:length_m, points: points});
            // store(DRAWING_MODE_SET, null);
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