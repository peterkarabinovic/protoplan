
import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import {selectedStand, selectedStandsId} from '../../state.js'
import {str, toPoints} from '../../utils/utils.js'
import {Stand} from '../../svg/leaflet-stand.js'


export default function(config, store, map, standMapView){
    var $stand = null;
    var $stands = standMapView.stands;
    var mymodes = [m.DRAW_STAND1, m.DRAW_STAND2, m.DRAW_STAND3, m.DRAW_STAND4];
    var editor = edit(store, map);

    function onDrawMode(e){
        editor.exit();
        var i = mymodes.indexOf(e.new_val);
        if(i !== -1){
            editor.enter(i+1);
        }
    }

    function onSelectedGeometryChange(e){
        var stand = selectedStand(store);
        var points = toPoints($stand.getLatLngs())
        store(a.STAND_POINTS_UPDATE, {stand: stand, points:points})
    }

    function onStandSelect(){
        if($stand) {
            $stand.off('editable:dragend', onSelectedGeometryChange)
            $stand.off('editable:vertex:dragend', onSelectedGeometryChange)
            $stand.disableEdit();
            store.off('entities.stands.'+$stand.stands_id+'.'+$stand.id, onStandSelect);            
            console.log('disableEdit', $stand.id);
            $stand = null;
        }
        var stand = selectedStand(store);
        if(stand){
            $stand = $stands[stand.id];
            if($stand) {
                L.setOptions(map.editTools, {skipMiddleMarkers: true, draggable: true});
                $stand.enableEdit(map);   
                console.log('enableEdit', $stand.id);
                
                $stand.on('editable:dragend', onSelectedGeometryChange)
                $stand.on('editable:vertex:dragend', onSelectedGeometryChange)
                store.on('entities.stands.'+$stand.stands_id+'.'+$stand.id, onStandSelect);
            }
            
        }
    }

    store.on('map.drawMode', onDrawMode);
    store.on('ui.stands.sel', onStandSelect);

}

function edit(store, map){
    var outline = L.polygon([], {color: 'black', fill: false, opacity: 1, weight: 2, dashArray: "5,5"});
    var openWalls = 1;

    function move(e){
        var ce = map.snap(e.latlng);
        var ll = [[-10,-10],[10,-10], [10,10], [-10,10], [-10,-10] ].map(function(it){
            return L.latLng(ce.lat+it[0], ce.lng+it[1]);
        });
        console.log('move', ll.map( it => it.lat).join(','))
        outline.setLatLngs(ll);
    }

    function onClick(e) {
        move(e);
        var type = store.state.ui.stands.type;
        var feat =  { points: toPoints(outline.getLatLngs()), openWalls: openWalls, rotate: 0, type: type};
        store(a.STAND_ADD, feat);
        store(a.DRAWING_MODE_SET);  
        L.DomEvent.stopPropagation(e);      
    }

    function enter(w){
        openWalls = w;
        L.DomUtil.addClass(map._container,'move-cursor');
        outline.setLatLngs([]);
        // move({latlng: map.getCenter()});
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