import {t} from '../../locale.js'
import {svgToBase64} from '../../svg/parser.js'
import {BASE_LAYER_SET} from '../../actions.js'

export function FileHandler(store, error_fn)
{
    return function(e){
        error_fn('')
        var file = e.target.files[0];
        if(!file) return; 
        if(file.type !== 'image/svg+xml') {
            error_fn(t('invalid_svg_type', {type: file.type}));
        }
        else  
        {
            var reader = new FileReader();
            reader.onloadend = function(e){
                svgToBase64(reader.result).fold(
                    error_fn ,
                    function(e) {
                        store(BASE_LAYER_SET, {
                            grid: {
                                topLeft: {x:0, y:0},
                                bottomRight: {x: Math.round(e.width), y: Math.round(e.height)}
                            },
                            raw_svg: e.raw_svg,
                            url: e.data_uri,
                            size_m: {x: Math.round(e.width), y: Math.round(e.height)},
                            size_px: {x: e.width, y: e.height}
                        })
                    }
                );
            }
            reader.readAsText(file);
        }
        
    }
}