
import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import {str, toPoints} from '../../utils/utils.js'
import {selectedOverlayId, selectedOverlayFeat, selectedOverlayText, overlayNoteType} from '../../state.js'
import {Text} from '../../svg/leaflet-text.js'

export default function(config, store, map, overlayMapView)
{
    var editor = null;
    var selectedLayer = null;
    var cat2layers = overlayMapView.cat2layers;


    var m2e = {}
    m2e[m.DRAW_WALL] = editFeat('lines', store, map)
    m2e[m.DRAW_RECT] = editFeat('rects', store, map)
    m2e[m.DRAW_NOTE] = editNote(config, store, map)

    function log(e){
        console.log(e);
    }

    function onSelectedGeometryChanges(e){
        if(checkGeom(selectedLayer)){
            var selFeat = selectedOverlayFeat(store);
            var feat =  {points: toPoints(selectedLayer.getLatLngs()), id: selFeat.id};
            store(a.OVERLAY_FEAT_UPDATE, {feat: feat, cat: selFeat.cat});
        }
        selectedLayer.editor.reset();
        // selectedLayer.enableEdit(map); 

    }

    function updateSelectedLayer(e){
        if(selectedLayer) {
            selectedLayer.off('editable:dragend', onSelectedGeometryChanges)
            selectedLayer.off('editable:vertex:dragend', onSelectedGeometryChanges)
            selectedLayer.disableEdit();
            selectedLayer = null;
        }
        var feat = selectedOverlayFeat(store);
        if(feat){
            var overlay_id = selectedOverlayId(store)
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer) {
                L.setOptions(map.editTools, {skipMiddleMarkers: feat.cat !== 'lines', draggable: true});
                selectedLayer.enableEdit(map);   
                selectedLayer.on('editable:dragend', onSelectedGeometryChanges)
                selectedLayer.on('editable:vertex:dragend', onSelectedGeometryChanges)
            }
            else 
            selectedLayer = null;
        }
    }

    function onDrawMode(e) {
        if(editor) editor.exit();
        editor = m2e[e.new_val];
        if(editor) {
            editor.enter();
            store(a.OVERLAY_FEAT_SELECT);
        }
    }

    function onSelectedOverlayChange(){
        if(selectedLayer)
            selectedLayer.editor.reset();
    }


    store.on('map.drawMode', onDrawMode);
    store.on('ui.overlay.feat', updateSelectedLayer);
    // store.on('selectedOverlay', onSelectedOverlayChange);

    return {
        onTextChange: function(text){
            var feat = selectedOverlayFeat(store);
            var overlay_id = selectedOverlayId(store);
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer.getText() !== text){
                selectedLayer.setText(text);
                store(a.OVERLAY_FEAT_TEXT, {
                    text: text,
                    points: toPoints(selectedLayer.getLatLngs())
                });
            }
        }
    }
}


function editFeat(cat, store, map) 
{
    var layer = null ;
    function enter(m) {
        layer = (cat == 'lines') ? map.editTools.startPolyline(undefined) : map.editTools.startRectangle(undefined);
        layer.once('editable:drawing:commit', onCommit);
    }

    function exit()
    {
        layer.disableEdit();
        map.removeLayer(layer);
    }

    function onCommit(){
        if(checkGeom(layer))
        {
            var feat =  { points: toPoints(layer.getLatLngs())};
            store(a.OVERLAY_FEAT_ADD, {feat: feat, cat: cat});
        }
        store(a.DRAWING_MODE_SET);
    }
    return {enter:enter, exit:exit};
}

function editNote(config, store, map) 
{
    function onClick(e){
        var text = selectedOverlayText(store);
        var type = overlayNoteType(store);
        var style = config.overlay.types.notes[type].style;
        var $text = new Text([e.latlng],  text, 0, style).addTo(map)        
        var feat = {
            points: toPoints($text.getLatLngs()),
            rotate: 0,
            text: text,
            type: type         
        };
        map.removeLayer($text);
        store(a.OVERLAY_FEAT_ADD, {feat: feat, cat: 'notes'});
        store(a.DRAWING_MODE_SET);
        L.DomEvent.stopPropagation(e);
        // var style = {"fill": "red", "fontFamily":"Verdana", "fontSize": "large", "fontStyle":"italic"};
        // new Text([e.latlng],  "Kino i nimci", 0, style).addTo(map)
    }

    function enter() 
    {        
        L.DomUtil.addClass(map._container,'text-cusor');
        map.on('click',onClick);    
    }

    function exit(){
        L.DomUtil.removeClass(map._container,'text-cusor');
        map.off('click',onClick);            
    }

    return {enter:enter, exit:exit};
}



function checkGeom(layer){
    var checkDist = 1;
    _.reduce(_.flatten(layer.getLatLngs()), function(l1,l2){
        var d = l1.distanceTo(l2);
        if(d < checkDist) checkDist = d;
        return l2;
    });
    return checkDist == 1;
}


