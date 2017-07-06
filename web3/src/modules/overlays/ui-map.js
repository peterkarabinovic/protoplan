
import {Selfcheck} from './../../utils/utils.js'
import * as m from '../../map/modes.js'
import * as p from './primitives.js'
import * as a from '../../actions.js'
import {mode2editor} from './editors.js'
/**
 * 
 *  overlay state 
 * {
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

var selfcheck = Selfcheck();

export default function uiMap(store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);
    var selectedFeature = null;
    var editor = null;


    lineGroup.on('click', _.partial(onFeatureClick, 'lines'));
    rectGroup.on('click', _.partial(onFeatureClick, 'rects'));
    noteGroup.on('click', _.partial(onFeatureClick, 'notes'));

    function onSelectOverlay(e){
        lineGroup.clearLayers();
        rectGroup.clearLayers();
        noteGroup.clearLayers();
        if(e.new_val) {
            var overlay = e.new_val;
            _.each(overlay.lines || {}, function(line){
                lineGroup.addLayers( p.toPolyline(line) );
            });
            _.each(overlay.rects || {}, function(rect){
                lineGroup.addLayers( p.toRect(rect) );
            });
        }
    }

    function onNewFeature(e){
        var obj = null;
        switch(e.cat){
            case 'lines':
                obj = p.toLine(e.feat);
                lineGroup.addLayer(e.feat);
                break;
            case 'rects':
                obj = p.toCarpet(e.feat);
                rectGroup.addLayer(e.feat);
                break;
            case 'notes':
                noteGroup.addLayer(e.feat);
                break;
        }
        store(a.OVERLAY_FEAT_ADD, {cat: e.cat, feat: obj});
        store(a.DRAWING_MODE_SET,null);
    }

    function onFeatureClick(cat, e)
    {
        if(selectedFeature == e.layer)
            return;
        if(selectedFeature) 
            selectedFeature.disableEdit()
        selectedFeature = e.layer;
        selectedFeature.enableEdit(map);
    }

    _.values(mode2editor).forEach(function(it) { it.on('new-feat', selfcheck(onNewFeature)); })
    store.on('selectedOverlay', selfcheck(onSelectOverlay));
    store.on('map.drawingMode', function(e){
        if(editor) editor.exit();
        editor = mode2editor[e.new_val];
        if(editor) editor.enter(map);
    });
}

