import {selectedOverlay} from '../../state.js'
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
    var overlayId = null;
    var lineGroup = L.featureGroup().addTo(map);
    var carpetGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var category2layers = {
        'line': {group: lineGroup, toLayer: toPolyline},
        'carpet': {group: carpetGroup, toLayer: toRect},
        'note': {group: noteGroup, toLayer: toNote}
    }

    function updateGroup(cat, features){
        var group = category2layers[cat].group;
        var toLayer = category2layers[cat].toLayer; 
        var overlay_id = (selectedOverlay(store).id || -1).toString();
        var layers = _.groupBy(group, 'id');
        _.mapObject(features, function(feat, id){
            var layer_id = str(overlay_id, '.', id);
            if(layers[layer_id]) {
                delete layers[layer_id];
            }
            else {
                var style = config.overlay.types[cat][feat.type];
                var layer = toLayer(layer_id, feat, style) 
                group.addLayer(layer);
            }
        });
        _.values(layers).forEach(function(l){
            group.removeLayer(l);
        })
    }

    store.on('selectedOverlay.lines', _.partial(updateGroup, 'line') );
    store.on('selectedOverlay.carpets', _.partial(updateGroup, 'carpet') );
    store.on('selectedOverlay.notes', _.partial(updateGroup, 'note') );
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
