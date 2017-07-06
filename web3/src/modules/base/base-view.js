import {t} from '../../locale.js'
import {DRAW_DISTANCE} from '../../map/modes.js'
import {svgToBase64} from '../../svg/parser.js'
import {baseLayer, selectedBase} from '../../state.js'
import {BASE_LAYER_SET, 
        BASE_LAYER_SAVE,
        DRAWING_MODE_SET, 
        BASE_DISTANCE_LENGTH_SET} from '../../actions.js'



function BaseView(store) {
    var vm = new Vue({
        el: '#base-layer',
        template: '#base-layer-template',
        data: {
            width: null, height: null,
            lineLength: null,
            error: ''
        },
        methods: 
        {
            on_file: function(e){
                vm.error = ''
                var file = e.target.files[0];
                if(!file) return; 
                if(file.type !== 'image/svg+xml') {
                    vm.error = t('invalid_svg_type', {type: file.type});
                }
                else  
                {
                    var reader = new FileReader();
                    reader.onloadend = function(e){
                        svgToBase64(reader.result).fold(
                            function(e) { vm.error = e;} ,
                            function(e) {
                                store(BASE_LAYER_SET, {
                                    raw_svg: e.raw_svg,
                                    url: e.data_uri,
                                    size_m: {x: e.width, y: e.height},
                                    size_px: {x: e.width, y: e.height}
                                })
                            }
                        );
                    }
                    reader.readAsText(file);
                }
            },
            draw_line: function(){
                store(DRAWING_MODE_SET, DRAW_DISTANCE)
            },
            recalculateScale: function(){
                if(this.lineLength <= 0) return;
                store(BASE_DISTANCE_LENGTH_SET, this.lineLength);
            },
            needDrawLine: function(){
                return this.width && !this.lineLength;
            },
            needRecalculate: function(){
                var bl = selectedBase(store);
                return this.lineLength > 0 && this.lineLength != Math.round(bl.distance.length_m);
            },
            needSave: function(){
                var bl = baseLayer(store),
                    el = selectedBase(store);
                return !bl || !_.isEqual(bl.size_m, el.size_m) || !_.isEqual(bl.url, el.url);

            },
            save: function(){
                var el = selectedBase(store);
                store(BASE_LAYER_SAVE, {base: el})
            }
        }, 
        computed: {
            widthHeight: function(){
                return this.width ? this.width + ' m / ' + this.height + ' m' : ''
            }
        }
    });

    function updateWidthHeight(e){
        var base = e.new_val;
        if(base && base.size_m) { 
            vm.width = Math.round(base.size_m.x);
            vm.height = Math.round(base.size_m.y);
        }
        else {
            vm.width = vm.height = null;
        }
    }

    function updateLength_m(e){
        vm.lineLength = e.new_val;
    }

    store.on('selectedBase', updateWidthHeight);
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