import {selectedOverlayId} from '../../state.js'
import {str} from '../../utils/utils.js'
/**
 * 
 *  overlay state 
 * {
 *      id: overlayId,
 *      lines: {
 *          "id1": { points: [], type: {} },
 *          "id2": { points: [], type: {} },
 *      },
 *      carpets: {
 *          "id1": { points: [], type: {} },
 *          "id2": { points: [], type: {} },
 *      },
 *      notes: {
 *          "id1": { topleft: [], rotate: number, text: string, type: {} },
 *          "id2": { topleft: [], rotate: number, text: string, type: {} }
 *      }
 * }
 * 
 *  
 */

export default function(config, store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var carpetGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var cat2group = {
        lines: {group: lineGroup, toLayer: toPolyline},
        carpets: {group: carpetGroup, toLayer: toRect},
        notes: {group: noteGroup, toLayer: toNote}
    }

    var cat2layers = {
        lines: {},
        carpets: {},
        notes: {},
    }

    function updateGroup(cat, e){
        var features = e.new_val || [];
        var group = cat2group[cat].group;
        var toLayer = cat2group[cat].toLayer; 
        var overlay_id = selectedOverlayId(store);
        var the_layers = cat2layers[cat];
        _.mapObject(features, function(feat, id){
            var layer_id = str(overlay_id, '.', id);
            if(the_layers[layer_id]) {
                delete the_layers[layer_id];
            }
            else {
                var style = config.overlay.types[cat][feat.type];
                var layer = toLayer(layer_id, feat, style) 
                group.addLayer(layer);
                cat2layers[cat][layer_id] = layer;
            }
        });
        _.values(the_layers).forEach(function(l){
            group.removeLayer(l);
        })
    }

    store.on('selectedOverlay.lines', _.partial(updateGroup, 'lines') );
    store.on('selectedOverlay.carpets', _.partial(updateGroup, 'carpets') );
    store.on('selectedOverlay.notes', _.partial(updateGroup, 'notes') );

    return {cat2group: cat2group, cat2layers:cat2layers};
}

function toPolyline(id, line, style)
{
    var poly = L.polyline(toLatLngs(line.points), style);
    poly.id = id;
    return poly;
}

function toRect(id, carpet, style){
    var poly = polygon(toLatLngs(carpet.points), style);
    poly.id = id;
    return poly;
}

function toNote(id, note, style){
}


function toLatLngs(points) {
    return points.map(function(p){ return  latLng(p[1], p[0])});
}
