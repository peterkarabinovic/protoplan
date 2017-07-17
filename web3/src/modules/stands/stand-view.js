import * as m from '../../map/modes.js'
import * as a from '../../actions.js'
import { drawMode} from '../../state.js' 
import StandEditing from './stand-editing.js'


function StandView(config, store){

    var MODES = {
        "stand0": m.DRAW_STAND1,
        "stand1": m.DRAW_STAND2,
        "stand2": m.DRAW_STAND3,
        "stand3": m.DRAW_STAND4
    };


    var vm = new Vue({
        el: "#stands",
        template: "#stands-template",
        data: {
            mode: null,
            selectedStandsId: store.prop('selectedStandsId'),
            types: {
                sel: store.prop('ui.stands.cat'),
                list: config.stands.types
            }
        },
        methods: {
            select: function(mode){
                var m = MODES[mode];
                store(a.DRAWING_MODE_SET, drawMode(store) == m ? undefined : m );
            },
            cssClass: function(p){
                return p == this.mode ? 'w3-border-blue  w3-border'  : '';
            },            
        }
    });

    store.on('map.drawMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });
    
}

export default function(config, store, map){
    StandView(config, store);
    StandEditing(config, store, map);
}