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
        for(var i=0; i<200; i++) 
        {
            var dx  = Math.random() * 500;
            var dy  = Math.random() * 500;
            var ang = Math.random() * 180;
            L.rotateImageLayer(url, [[200+dx,200+dy],[250+dx,150+dy]], {rotation: ang}).addTo(map);
            // L.imageOverlay(url, [[200+dx,200+dy],[250+dx,150+dy]], {rotation: ang}).addTo(map);
        }
        
    }

    function exit(){

    }
    return {enter:enter, exit:exit};
}



function toPoints(latLngs){
    var f = L.Util.formatNum;
    latLngs = _.flatten(latLngs);
    return latLngs.map(function(ll){ return [f(ll.lng,2), f(ll.lat,2)] });
}


L.rotateImageLayer = function(url, bounds, options) {
    return new L.RotateImageLayer(url, bounds, options);
};
// A quick extension to allow image layer rotation.
L.RotateImageLayer = L.ImageOverlay.extend({
    options: {rotation: 0},
    _animateZoom: function(e){
        L.ImageOverlay.prototype._animateZoom.call(this, e);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    },
    _reset: function(){
        L.ImageOverlay.prototype._reset.call(this);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    }
});