
import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import {str, toPoints} from '../../utils/utils.js'
import {Stand} from '../../svg/leaflet-stand.js'


export default function(config, store, map){

    var mymodes = [m.DRAW_STAND1, m.DRAW_STAND2, m.DRAW_STAND3, m.DRAW_STAND4];
    var editor = edit(store, map);

    function onDrawMode(e){
        editor.exit();
        var i = mymodes.indexOf(e.new_val);
        if(i !== -1){
            editor.enter(i+1);
        }
    }

    store.on('map.drawMode', onDrawMode);
}

function edit(store, map){
    var outline = L.polygon([], {color: 'grey', fill: false, opacity: 0.7, weight: 7});
    var openWalls = 1;

    function move(e){
        var ce = e.latlng;
        var ll = [[-10,-10],[10,-10], [10,10], [-10,10], [-10,-10] ].map(function(it){
            return L.latLng(ce.lat+it[0], ce.lng+it[1]);
        });
        outline.setLatLngs(ll);
    }

    function onClick(e) {
        move(e);
        var feat =  { points: toPoints(layer.getLatLngs()), openWalls: openWalls, rotate: 0};
        store(a.STAND_ADD, feat);
        store(a.DRAWING_MODE_SET);        
        // new Stand(outline.getLatLngs(), {fillColor: 'red'}, openWallss).addTo(map);
    }

    function enter(w){
        openWalls = w;
        L.DomUtil.addClass(map._container,'move-cursor');
        move({latlng: map.getCenter()});
        map.addLayer(outline);
        map.on('mousemove', move);      
        map.on('click', onClick);      
    }

    function exit(){
        L.DomUtil.removeClass(map._container,'move-cursor');
        map.removeLayer(outline);
        map.off('mousemove', move);
        map.off('click', onClick);      
        
    }
    return {enter: enter, exit: exit}
}