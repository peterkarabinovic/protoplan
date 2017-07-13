import {selectedOverlayId} from '../../state.js'
import {str} from '../../utils/utils.js'
import {Text} from '../../svg/leaflet-text.js'
/**
 * 
 *  overlay state 
 * {
 *      id: overlayId,
 *      lines: {
 *          "id1": { points: [], type: {} },
 *          "id2": { points: [], type: {} },
 *      },
 *      rects: {
 *          "id1": { points: [], type: {} },
 *          "id2": { points: [], type: {} },
 *      },
 *      notes: {
 *          "id1": { points: [], rotate: number, text: string, type: {} },
 *          "id2": { points: [], rotate: number, text: string, type: {} }
 *      }
 * }
 * 
 *  
 */

export default function(config, store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var cat2group = {
        lines: {group: lineGroup, toLayer: toPolyline},
        rects: {group: rectGroup, toLayer: toLeafletRect},
        notes: {group: noteGroup, toLayer: toText}
    }

    var cat2layers = {
        lines: {},
        rects: {},
        notes: {},
    }

    function updateLayers(cat, e){
        var layers = cat2layers[cat];
        var group = cat2group[cat].group;
        var toLayer = cat2group[cat].toLayer; 
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', _.last(e.path));
        if(e.new_val && !e.old_val) {
            var feat = e.new_val;
            var style = config.overlay.types[cat][feat.type].style;
            var layer = toLayer(layer_id, feat, style);
            group.addLayer(layer);
            layers[layer_id] = layer;
        }
        else if(!e.new_val && e.old_val){
            var layer = layers[layer_id];
            map.removeLayer(layer);
            delete layers[layer_id];
        }
        else {
            var feat = e.new_val
            var layer = layers[layer_id];
            var style = config.overlay.types[cat][feat.type].style;
            layer.setStyle(style, true);  
            if(cat === 'notes'){
                layer.setText(feat.text, true);
                layer.setRotate(feat.rotate, true);
            }    
            layer.setLatLngs(toLatLngs(feat.points));    
        }
    }


    store.on('selectedOverlay.lines.*', _.partial(updateLayers, 'lines') );
    store.on('selectedOverlay.rects.*', _.partial(updateLayers, 'rects') );
    store.on('selectedOverlay.notes.*', _.partial(updateLayers, 'notes') );

    return {cat2group: cat2group, cat2layers:cat2layers};
}

function toPolyline(id, line, style)
{
    var poly = L.polyline(toLatLngs(line.points), style);
    poly.id = id;
    return poly;
}

function toLeafletRect(id, rect, style){
    var poly = L.rectangle(toLatLngs(rect.points), style);
    poly.id = id;
    return poly;
}

function toText(id, note, style)
{
    var layer = new Text(toLatLngs(note.points), note.text, note.rotate, style);
    layer.id = id;
    return layer;
}


function toLatLngs(points) {
    return points.map(function(p){ return  L.latLng(p[1], p[0])});
}
