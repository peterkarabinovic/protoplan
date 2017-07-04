import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import uiMap from './ui-map.js'


function uiView(store)
{
    var SEL = {
        "line": m.DRAW_WALL,
        "rect": m.DRAW_RECT,
        "note": m.DRAW_NOTE
    };


    var vm = new Vue({
        el:"#overlays-layer",
        template: '#overlays-layer-template',
        data: {
            sel: null,
        },
        methods: {
            select: function(sel){ 
                store(a.DRAWING_MODE_SET, SEL[sel])
            },
            cssClass: function(p){
                return p == this.sel ? 'w3-text-red'  : 'w3-text-grey';
            }
        }
    })

    store.on('map.drawingMode', function(e){
        vm.sel = _.findKey(SEL, function(it) { return it == e.new_val});
    });
}

export default function(store, map){
    uiView(store);
    uiMap(store, map);
}