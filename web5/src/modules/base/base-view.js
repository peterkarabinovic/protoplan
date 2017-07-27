import {t} from '../../locale.js'
import {DRAW_DISTANCE} from '../../map/modes.js'

import {FileHandler} from './base-file-change.js'
import {baseLayer} from '../../state.js'
import {BASE_LAYER_SAVE,
        DRAWING_MODE_SET, 
        BASE_DISTANCE_LENGTH_SET} from '../../actions.js'



function BaseView(store) {
    var onFile = FileHandler(store, function(error){
        vm.error = error;
    });
    var vm = new Vue({
        el: '#base-layer',
        template: '#base-layer-template',
        data: {
            width: null, height: null,
            lineLength: null,
            error: '',
            selectedBase: store.prop('selectedBase')
        },
        methods: 
        {
            on_file: onFile,

            draw_line: function(){
                store(DRAWING_MODE_SET, DRAW_DISTANCE)
            },
            recalculateScale: function(){
                if(this.lineLength <= 0) return;
                store(BASE_DISTANCE_LENGTH_SET, this.lineLength);
            },
            needDrawLine: function(){
                return this.selectedBase.$val && !this.selectedBase.$val.distance;
            },
            needRecalculate: function(){
                var sb = this.selectedBase.$val;
                return sb && this.lineLength > 0 && this.lineLength != Math.round(sb.distance.length_m);
            },
            needSave: function(){
                var bl = baseLayer(store),
                    sb = this.selectedBase.$val;
                return sb &&  (!_.isEqual(bl.size_m, sb.size_m) || !_.isEqual(bl.url, sb.url));

            },
            save: function(){
                store(BASE_LAYER_SAVE, {base: this.selectedBase.$val})
            }
        }, 
        computed: {
            widthHeight: function(){
                var sb = this.selectedBase.$val;
                return sb && sb.size_m ? Math.round(sb.size_m.x) + ' m / ' + Math.round(sb.size_m.y) + ' m' : ''
            }
        }
    });

    // function updateWidthHeight(e){
    //     var base = e.new_val;
    //     if(base && base.size_m) { 
    //         vm.width = Math.round(base.size_m.x);
    //         vm.height = Math.round(base.size_m.y);
    //     }
    //     else {
    //         vm.width = vm.height = null;
    //     }
    // }

    function updateLength_m(e){
        vm.lineLength = e.new_val;
    }

    // store.on('selectedBase', updateWidthHeight);
    store.on('selectedBase.distance.length_m', updateLength_m);    

    return vm;
} 

import BaseMapView from './base-map-view.js' 
import BaseMapDistance from './base-map-distance.js'   

export default function(store, map)
{
    BaseView(store);
    BaseMapView(store, map);
    BaseMapDistance(store, map);
};