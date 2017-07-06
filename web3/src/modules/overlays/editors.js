import * as m from '../../map/modes.js'

var Evented = L.Evented;
var extend = L.extend;

function editFeat(type) 
{
    var feat = null ;
    var map = null;
    function enter(m) {
        map = m;
        feat = (type == 'lines') ? map.editTools.startPolyline(undefined) : map.editTools.startRectangle(undefined);
        feat.once('editable:drawing:commit', onCommit)
    }

    function exit(){
        if(feat) {
            feat.disableEdit();
            map.removeLayer(feat);
            feat = null;
        }
    }

    var e = extend( new Evented(), {enter:enter, exit:exit} );

    function onCommit(){
        var f = feat;
        exit();
        e.fire("new-feat", {feat:f, cat:type});
    }

    return e;
}

function editNote() {
    function enter() {

    }

    function exit(){

    }
    return extend( new Evented(), {enter:enter, exit:exit} );
}

var m2e = {}
m2e[m.DRAW_WALL] = editFeat('lines')
m2e[m.DRAW_RECT] = editFeat('rects')
m2e[m.DRAW_NOTE] = editNote()

export var mode2editor = m2e;