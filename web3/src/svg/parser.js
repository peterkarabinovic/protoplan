import {Either} from '../utils/fp.js'
import {startswith} from '../utils/utils.js'
import {t} from '../locale.js'


var hidenElement = null;

function getHidenEl(){
    if(hidenElement)
        return hidenElement;
    hidenElement = document.createElement("div");    
    hidenElement.style = 'visibility: hidden; position: absolute; top:0; left:0;'
    hidenElement = document.body.appendChild(hidenElement);
    return hidenElement;
}

export function svgToBase64(svg_text)
{
    if(!svg_text || svg_text.length < 7) 
        return Either.left(t('invalid_svg_content'))
      
    var parser = new DOMParser();    
    var svg_document = parser.parseFromString(svg_text, "image/svg+xml").documentElement;
    if( !svg_document ||
        !svg_document.getAttribute ||
        !startswith(svg_document.getAttribute('xmlns'), 'http://www.w3.org/2000/svg'))
        return Either.left(t('invalid_svg_content'))
    if(!svg_document.height || !svg_document.width)
        return Either.left(t('no_svg_size'))

    var viewBox = null
    if(svg_document.viewBox.baseVal && svg_document.viewBox.baseVal.width != 0) {
        var vb = svg_document.viewBox.baseVal;
        viewBox = [vb.x, vb.y, vb.width, vb.height]
    }
    var raw_svg =   new XMLSerializer().serializeToString(svg_document); 
    var data_uri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(raw_svg)));
    
    if(!viewBox && (svg_document.width.baseVal.value == 0 || svg_document.height.baseVal.value == 0 )){
        var node = document.importNode(svg_document, true);
        node = getHidenEl().appendChild(node);
        var box = node.getBBox();
        viewBox = [0,0,box.x + box.width, box.y + box.height];
        getHidenEl().removeChild(node);
        // return Either.left(t('no_svg_dimensions'))
    }
    var width = 0, height = 0;
    if(viewBox){
        width = viewBox[2];
        height = viewBox[3];
    }
    if(svg_document.width.baseVal.value != 0)
        width = svg_document.width.baseVal.value;
    if(svg_document.height.baseVal.value != 0)
        height = svg_document.height.baseVal.value;
    return Either.right({
        svg_document: svg_document,
        raw_svg: raw_svg,
        width: width,
        height: height,
        data_uri: data_uri
    })    
}

export function svgToDocument(svg_text){
    var parser = new DOMParser(); 
    return parser.parseFromString(svg_text, "image/svg+xml").documentElement;
}

