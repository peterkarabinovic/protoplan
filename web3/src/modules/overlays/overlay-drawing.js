import * as m from '../../map/modes.js'
import * as a from '../../actions.js'

export default function(store, map)
{
    var editor = null;
    var m2e = {}
    m2e[m.DRAW_WALL] = editFeat('lines', store, map)
    m2e[m.DRAW_RECT] = editFeat('rects', store, map)
    m2e[m.DRAW_NOTE] = editNote(store, map)


    store.on('map.drawingMode', function(e){
        if(editor) editor.exit();
        editor = m2e[e.new_val];
        if(editor) {
            editor.enter();
            store(a.OVERLAY_FEAT_SELECT);
        }
    });
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
        var feat =  { points: toPoints(layer.getLatLngs())};
        store(a.OVERLAY_FEAT_ADD, {feat: feat, cat: cat});
        store(a.DRAWING_MODE_SET);
    }
    return {enter:enter, exit:exit};
}

function editNote() {
    function enter() {

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
    latLngs = _.flatten(latLngs);
    return latLngs.map(function(ll){ return [ll.lng, ll.lat] });
}
