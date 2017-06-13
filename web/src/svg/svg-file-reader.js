
import {Either, startswith} from '../utils.js'
import {t} from '../locale.js'

/*
 * @method parse_svg(svg_text: string): object
 * parse svg text
 */
export function parse_svg(svg_text){
    if(!svg_text || svg_text.length < 7) 
        return Either.left(t('invalid_svg_content'))
      
    var parser = new DOMParser();    
    var svg_doc = parser.parseFromString(svg_text, "image/svg+xml").documentElement;
    if( !svg_doc ||
        !svg_doc.getAttribute ||
        !startswith(svg_doc.getAttribute('xmlns'), 'http://www.w3.org/2000/svg'))
        return Either.left(t('invalid_svg_content'))
    if(!svg_doc.height || !svg_doc.width)
        return Either.left(t('no_svg_size'))

    var viewBox = null
    if(svg_doc.viewBox.baseVal && svg_doc.viewBox.baseVal.width != 0) {
        var vb = svg_doc.viewBox.baseVal;
        viewBox = [vb.x, vb.y, vb.width, vb.height]
    }
    var svg_raw =   new XMLSerializer().serializeToString(svg_doc); 
    var data_uri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg_raw)));
    
    if(!viewBox && (svg_doc.width.baseVal.value == 0 || svg_doc.height.baseVal.value == 0 )){
        return Either.left(t('no_svg_dimensions'))
    }
    var width = 0, height = 0;
    if(viewBox){
        width = viewBox[2];
        height = viewBox[3];
    }
    if(svg_doc.width.baseVal.value != 0)
        width = svg_doc.width.baseVal.value;
    if(svg_doc.height.baseVal.value != 0)
        height = svg_doc.height.baseVal.value;
    return Either.right({
        svg_doc: svg_doc,
        svg_raw: svg_raw,
        width: width,
        height: height,
        data_uri: data_uri
    })    
}


export default function()
{
    var dispatch = d3.dispatch('new_svg', 'error')
    var error = function(msg) { dispatch.call('error', this, msg)};
    var new_svg = function(d) { dispatch.call('new_svg', this, d)};

    /*
    * @function reader_fn(el: string): void
    * handler for 'change' event of input[type='file']
    */
    var reader_fn = function(e){
        var file = e.target.files[0] 
        if(!file) return;
        if(file.type !== 'image/svg+xml') {
            error(t('invalid_svg_type', {type: file.type}));
        }
        else {
            var reader = new FileReader();
            reader.onloadend = function(e){
                var res = parse_svg(reader.result);
                res.fold(error, new_svg)
            }
            reader.readAsText(file)
        }
    }

    reader_fn.on = function(type,fn) { dispatch.on(type,fn) } 
    return reader_fn
}