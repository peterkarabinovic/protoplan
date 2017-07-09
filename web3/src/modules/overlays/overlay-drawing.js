import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import {str} from '../../utils/utils.js'
import {selectedOverlayId, selectedOverlayFeat} from '../../state.js'

export default function(store, map, overlayMapView)
{
    var editor = null;
    var selectedLayer = null;
    var cat2layers = overlayMapView.cat2layers;


    var m2e = {}
    m2e[m.DRAW_WALL] = editFeat('lines', store, map)
    m2e[m.DRAW_RECT] = editFeat('rects', store, map)
    m2e[m.DRAW_NOTE] = editNote(store, map)

    function updateSelectedLayer(e){
        if(selectedLayer) {
            selectedLayer.disableEdit();
            selectedLayer = null;
        }
        var feat_path = e.new_val;
        if(feat_path){
            var feat = selectedOverlayFeat(store);
            var overlay_id = selectedOverlayId(store)
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer) {
                L.setOptions(map.editTools, {skipMiddleMarkers: feat.cat !== 'lines', draggable: true});
                selectedLayer.enableEdit(map);      
            }
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


    store.on('map.drawMode', onDrawMode);
    store.on('ui.overlay.feat', updateSelectedLayer);
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
        var checkDist = 1;
        _.reduce(_.flatten(layer.getLatLngs()), function(l1,l2){
            var d = l1.distanceTo(l2);
            if(d < checkDist) checkDist = d;
            return l2;
        });
        if(checkDist == 1) {
            var feat =  { points: toPoints(layer.getLatLngs())};
            store(a.OVERLAY_FEAT_ADD, {feat: feat, cat: cat});
        }
        store(a.DRAWING_MODE_SET);
    }
    return {enter:enter, exit:exit};
}

function editNote(store, map) 
{
    function enter() {
         var url = 'assets/examples/atm.svg'
         L.imageOverlay(url, [[100,100],[200,200]]).addTo(map);
         L.imageOverlay(url, [[200,200],[250,150]]).addTo(map);

        var topleft    = L.latLng(300, 100),
            topright   = L.latLng(300, 150),
            bottomleft = L.latLng(400, 100);

        var overlay = L.imageOverlay.rotated(url, topleft, topright, bottomleft, {
            opacity: 0.8,
            interactive: true,
        }).addTo(map);         
    }

    function exit(){

    }
    return {enter:enter, exit:exit};
}

// function toWall(polyline){
//     return {
//         points: toPoints(polyline.getLatLngs()),
//         id: polyline.id,
//         style: polyline.style
//     }
// }

function toPoints(latLngs){
    var f = L.Util.formatNum;
    latLngs = _.flatten(latLngs);
    return latLngs.map(function(ll){ return [f(ll.lng,2), f(ll.lat,2)] });
}
