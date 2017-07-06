import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import uiMap from './ui-map.js'
import {wallType, carpetType, noteType} from '../../state.js' 

import OverlayMapView from './overlay-map-view.js'
import OverlaySelectTools from './overlay-select-tools.js'
import OverlayDrawing from './overlay-drawing.js'


function OverlayView(config, store)
{
    var MODES = {
        "line": m.DRAW_WALL,
        "rect": m.DRAW_RECT,
        "note": m.DRAW_NOTE
    };


    var vm = new Vue({
        el:"#overlays-layer",
        template: '#overlays-layer-template',
        data: {
            mode: null,
             
            wallTypes: config.overlay.types.wall,
            carpetTypes: config.overlay.types.carpet,
            noteTypes: config.overlay.types.note,

            selWallType: wallType(store),
            selCarpetType: carpetType(store),
            selNoteType: noteType(store)
        },
        methods: {
            select: function(sel){ 
                store(a.DRAWING_MODE_SET, MODES[mode])
            },
            cssClass: function(p){
                return p == this.mode ? 'w3-text-red'  : 'w3-text-grey';
            }
        }
    })

    store.on('map.drawingMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });

    store.on('ui.overlay', function(e){
        vm.selWallType = wallType(store);
        vm.selCarpetType = carpetType(store);
        vm.selNoteType = noteType(store);
    });
}

export default function(config, store, map){
    OverlayView(config, store);
    var omv = OverlayMapView(config, store, map);
    OverlaySelectTools(config, store, map, omv);
    OverlayDrawing(store, map);
}