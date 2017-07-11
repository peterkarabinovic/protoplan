import {selectedOverlayId} from '../../state.js'
import {str} from '../../utils/utils.js'
import {rotateImageOverlay} from '../../svg/leaflet-rotate-image.js'
import {svgToBase64} from '../../svg/parser.js'
import {textDocument} from '../../svg/text.js'
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
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var cat2group = {
        lines: {group: lineGroup, toLayer: toPolyline},
        rects: {group: rectGroup, toLayer: toLeafletRect},
        notes: {group: noteGroup, toLayer: _.partial(toNote, map)}
    }

    var cat2layers = {
        lines: {},
        rects: {},
        notes: {},
    }

    function updateGroup(cat, e){
        var features = e.new_val || [];
        var group = cat2group[cat].group;
        var toLayer = cat2group[cat].toLayer; 
        var overlay_id = selectedOverlayId(store);
        var the_layers = _.clone(cat2layers[cat]);
        _.mapObject(features, function(feat, id){
            var layer_id = str(overlay_id, '.', id);
            if(the_layers[layer_id]) {
                delete the_layers[layer_id];
            }
            else {
                var style = config.overlay.types[cat][feat.type].style;
                var layer = toLayer(layer_id, feat, style) 
                group.addLayer(layer);
                cat2layers[cat][layer_id] = layer;
            }
        });
        _.mapObject(the_layers, function(layer, id){
            group.removeLayer(layer);
            delete cat2layers[cat][id];
        });
    }

    store.on('selectedOverlay.lines', _.partial(updateGroup, 'lines') );
    store.on('selectedOverlay.rects', _.partial(updateGroup, 'rects') );

    function updateStyles(cat, e)
    {
        var id = e.path[2],
            type = e.new_val;
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', id);
        var layes = cat2layers[cat];
        if(layes[layer_id]){
            var style = config.overlay.types[cat][type].style;
            layes[layer_id].setStyle(style);
        }
    }

    function updateNotes(e)
    {
        var id = e.path[2];
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', id);
        var layers = cat2layers.notes;
        if(e.old_val && layers[layer_id]) {
            cat2group.notes.group.removeLayer(layes[layer_id]);
            delete layers[layer_id];
        } 
        if(e.new_val) {
            var note = e.new_val;
            var style = config.overlay.types.notes[note.type].style;
            var layer = toNote(map, layer_id, note, style)
            cat2group.notes.group.addLayer(layer);            
            layers[layer_id] = layer;
        }
    }

    store.on('selectedOverlay.lines.*.type', _.partial(updateStyles, 'lines') );
    store.on('selectedOverlay.rects.*.type', _.partial(updateStyles, 'rects') );
    store.on('selectedOverlay.notes.*.*', updateNotes );

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

function toNote(map, id, note, style)
{
    var svg_text = textDocument(note.text, style);
    var d = svgToBase64(svg_text).right;
    var rb = map.latLngToContainerPoint(note.topLeft).add({x: d.width, y: d.height});
    var rightBottom = map.containerPointToLatLng(rb); 
    var layer = rotateImageOverlay(d.data_uri, [note.topLeft, rightBottom], {rotate: note.rotate});
    layer.id = id;
    return layer;
}


function toLatLngs(points) {
    return points.map(function(p){ return  L.latLng(p[1], p[0])});
}
