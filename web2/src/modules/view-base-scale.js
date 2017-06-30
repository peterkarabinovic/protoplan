import {t} from '../utils/locale.js'
import {getModuleBase} from '../reducers/reducers.js'
import {DRAW_DISTANCE} from '../map/modes.js'
import {svgToBase64} from '../svg/parser.js'

export function BaseImageView(store) 
{
    var vm = new Vue({
        el: '#base-layer',
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
            draw_line: function(){
                store('DRAWING_MODE_SET', DRAW_DISTANCE)
            },
            recalculateScale: function(){
                if(this.lineLength <= 0) return;
                store('DISTANCE_SET', this.lineLength);
            },
            needDrawLine: function(){
                return this.width && !this.lineLength;
            },
            needRecalculate: function(){
                return this.lineLength > 0 && this.lineLength != Math.round(getModuleBase(store).length_m);
            }
        }, 
        computed: {
            widthHeight: function(){
                return this.width ? this.width + ' m / ' + this.height + ' m' : ''
            }
        }
    });

    store.on('layers.base', function(e){
        var base = e.new_val;
        vm.width = Math.round(base.size_m.x);
        vm.height = Math.round(base.size_m.y);
    });

    store.on('modules.base.length_m', function(e){
        vm.lineLength = Math.round(e.new_val);
    });
}
