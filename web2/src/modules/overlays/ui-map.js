
import {Selfcheck} from './../../utils/utils.js'

/**
 * 
 *  overlay state 
 * {
 *      lines: {
 *          "id1": { points: [], style: {} },
 *          "id2": { points: [], style: {} },
 *      },
 *      rect: {
 *          "id1": { points: [], style: {} },
 *          "id2": { points: [], style: {} },
 *      },
 *      note: {
 *          "id1": { topleft: [], rotate: number, text: string, style: {} },
 *          "id2": { topleft: [], rotate: number, text: string, style: {} }
 *      }
 * }
 * 
 *  
 */

var selfcheck = Selfcheck();

export default function uiMap(store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);
    var selectedFeature = null;

    store.on('selectedOverlayLayer', selfcheck(function(e){
        lineGroup.clearLayers();
        rectGroup.clearLayers();
        noteGroup.clearLayers();
        if(e.new_val) {
            var overlay = e.new_val;
            _.each(overlay.lines || {}, function(line, id){
                var latlngs = line.points.map(toLatLng);
                var poly = L.polyline(latlngs, lineStyle(line));
                poly.id = id;
                lineGroup.addLayers(poly);
            });
        }
    }));
}

function toLatLng(p) {
    return  L.latLng(p.y, p.x)
}

function lineStyle(line){
    return {weight:2, color: 'red'}
}

function drawPrimitive(type, store, featureGroup)
{

}