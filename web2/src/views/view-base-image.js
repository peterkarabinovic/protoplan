import {t} from '../locale.js'
import {getDistanceLine, getBaseLayer} from '../reducers/reducers.js'
import {DRAW_DISTANCE} from '../map/draw-modes.js'
import {svgToBase64} from '../svg/parser.js'

export function BaseImageView(store) 
{
    var vm = new Vue({
        el: '#base-layer',
        data: {
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
                                store('BASE_IMAGE_SET', {
                                    url: e.data_uri,
                                    size_m: {x: e.width, y: e.height}
                                })
                            }
                        );
                    }
                    reader.readAsText(file);
                }
            },
            hasLine: function(){
                return getDistanceLine(store);
            },
            draw_line: function(){
                store('DRAW_MODE_DISTANCE', DRAW_DISTANCE)
            },
            recalculateScale: function(){
                if(lineLength <= 0) return;
                store('DISTANCE_SET', lineLength);
            },
            needDrawLine: function(){
                return getBaseLayer(store) && !vm.hasLine();
            } 
        },
        computed: {
            widthHeight: function(){
                var bi = getBaseLayer(store);
                return bi ? bi.size_m.x + ' m / ' + bi.size_m.y + ' m' : ''
            },
            distance: function(){

            }
        }
    });

    store.on('map.baseImage.size_m', function(e){
        vm.$forceUpdate();
    });

    store.on('map.distanceLine', function(e){
        vm.lineLength = e.new_val;
    });
}
