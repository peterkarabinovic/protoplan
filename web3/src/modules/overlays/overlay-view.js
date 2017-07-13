import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import { drawMode, 
        selectedOverlayFeat, overlayLayer, selectedOverlay} from '../../state.js' 

import OverlayMapView from './overlay-map-view.js'
import OverlaySelectTools from './overlay-select-tools.js'
import OverlayDrawing from './overlay-drawing.js'


function OverlayView(config, store)
{
    var MODES = {
        "lines": m.DRAW_WALL,
        "rects": m.DRAW_RECT,
        "notes": m.DRAW_NOTE
    };


    var vm = new Vue({
        el:"#overlays-layer", 
        template: '#overlays-layer-template',
        data: {
            mode: null,
            selectedOverlay: store.prop('selectedOverlay'),
            types: {
                lines: {
                    sel: store.prop('ui.overlay.types.lines'),
                    list: config.overlay.types.lines 
                },
                rects: {
                    sel: store.prop('ui.overlay.types.rects'),
                    list: config.overlay.types.rects 
                },
                notes: {
                    sel: store.prop('ui.overlay.types.notes'),
                    list: config.overlay.types.notes
                }
            },
            type: null,
        },
        methods: { 
            select: function(mode){ 
                var m = MODES[mode];
                store(a.DRAWING_MODE_SET, drawMode(store) == m ? undefined : m );
            },
            cssClass: function(p){
                return p == this.mode ? 'w3-border-blue  w3-border'  : '';
            },
            needSave: function(){
                var so = this.selectedOverlay.$val;
                return so && !_.isEqual(overlayLayer(store), so);
            },
            save: function(){
                var o = this.selectedOverlay.$val;
                store(a.OVERLAY_SAVE, o);
                this.selectedOverlay.$val = null;
            },
            rollback: function(){
                store(a.OVERLAY_ROLLBACK);
            }
        }
    })

    store.on('map.drawMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });

    store.on('ui.overlay.feat', function(){
        var feat = selectedOverlayFeat(store);
        vm.type = feat ? vm.types[feat.cat] : null;
    })

    vm.$watch('type.sel.$val', function(val){
        if(val) {
            var feat = selectedOverlayFeat(store);
            store(a.OVERLAY_TYPE_SELECT, {feat: feat, type_id: val});
        }
    });
}

export default function(config, store, map){
    OverlayView(config, store);
    var omv = OverlayMapView(config, store, map);
    OverlaySelectTools(config, store, map, omv);
    OverlayDrawing(config, store, map, omv);
}