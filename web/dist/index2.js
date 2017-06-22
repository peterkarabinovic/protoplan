(function () {
'use strict';

function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
}





/***
 *  Either monad
 */
var Either = function(left, right){
    var has_left = function() { return left ? true : false }; 
    var has_right = function() { return right ? true : false };

    return {
        has_left: has_left,
        has_right: has_right,
        fold: function(left_fn, right_fn) {
            has_left() ? left_fn(left) : right_fn(right);
        },
        right: function() { return right}
    }
};

Either.right = function(value){
    return Either(null, value)
};

Either.left = function(value){
    return Either(value)
};

var cur_locale = 'ru';

function t(s, o, loc){
    loc = loc || cur_locale;
    var rep = translations[s] &&  translations[s][loc];
    if(!rep) 
        return 'Missing ' + loc + ' translation: ' + s;
    if(o) for(var k in o)  rep = rep.replace('{' + k + '}', o[k]);
    return rep
}

var translations = 
{
    "invalid_svg_type": {
        "ru": "Не верный тип файла: {type}"
    },
    "invalid_svg_content": {
        "ru": "SVG-документ с ошибками"
    },
    "no_svg_size":{
        "ru": 'SVG-документ должен содержать атрибуты "width" и "height"'
    },
    "no_svg_dimensions": {
        "ru": 'В SVG-документе отсутствуют и атрибуты "width", "height" и атрибут "viewBox"'
    }
};

function svgToBase64(svg_text)
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

    var viewBox = null;
    if(svg_document.viewBox.baseVal && svg_document.viewBox.baseVal.width != 0) {
        var vb = svg_document.viewBox.baseVal;
        viewBox = [vb.x, vb.y, vb.width, vb.height];
    }
    var svg_raw =   new XMLSerializer().serializeToString(svg_document); 
    var data_uri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg_raw)));
    
    if(!viewBox && (svg_document.width.baseVal.value == 0 || svg_document.height.baseVal.value == 0 )){
        return Either.left(t('no_svg_dimensions'))
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
        svg_raw: svg_raw,
        width: width,
        height: height,
        data_uri: data_uri
    })    
}

/**
 * Calculate map transformation 
 * @param {Size} map_size  - size of map's div
 * @param {Size} img_size  - size of images in custom unit (meters)
 */
function transformation(map_size, img_size){
   
    var x_ratio = map_size.x / img_size.x;
    var y_ratio = map_size.y / img_size.y;
    if(x_ratio <= y_ratio){
        var a = x_ratio;
        var b = 0;
        var c = x_ratio;
        var d = (map_size.y - (x_ratio * img_size.y)) / 2;
    }
    else { 
        var a = y_ratio;
        var b = (map_size.x - (y_ratio * img_size.x)) / 2;
        var c = y_ratio;
        var d = 0;
    }
    return new L.Transformation(a,b,c,d);        
}

/**
 * Calculate max zoom
 * @param {Size} img_size - size of images in custom unit (meters)
 * @param {int} min_width - length of min visible width (default 10)
 */
function maxZoom(img_size, min_width){
    min_width = min_width || 10;
    var max_width = Math.max(img_size.y, img_size.x);
    // var maxZoom = Math.log2( max_width / (1 * min_width) )   -- IE 11 not supported log2
    var maxZoom = Math.log( max_width / (1 * min_width) )  / Math.log(2);
    return Math.round(maxZoom);
}

/**
 * Constructor of Envelope
 * @param {*} min_x 
 * @param {*} min_y 
 * @param {*} max_x 
 * @param {*} max_y 
 */
function Env(min_x, min_y,max_x, max_y){
    return {
        min_x: min_x,
        min_y: min_y,
        max_x: max_x,
        max_y: max_y,
        intersection: function(env){
            return Env(
                Math.max(this.min_x, env.min_x),
                Math.max(this.min_y, env.min_y),
                Math.min(this.max_x, env.max_x),
                Math.min(this.max_y, env.max_y)
            )            
        },
        min: function(){ return L.point(this.min_x, this.min_y); },
        max: function(){ return L.point(this.max_x, this.max_y); },
        minLatLng: function(){ return L.latLng(this.min_y, this.min_x); },
        maxLatLng: function(){ return L.latLng(this.max_y, this.max_x); }
        
    }
}

/**
 * As LatLngBounds with its SouthNorthWestEast stuff mislead with planar metric space
 * Envelope seems more convenient 
 * @param {LatLngBounds} bounds 
 */
function Envelope(bounds)
{
    return Env(
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
    )
}

function toContainerEnvelope(env, map)
{
    var min = map.latLngToContainerPoint({lat: env.min_y, lng: env.min_x});
    var max = map.latLngToContainerPoint({lat: env.max_y, lng: env.max_x});
    return Env(min.x, min.y, max.x, max.y);
}

d3.text('svg/schema.svg', function(error, svg){
    if (error) return;
    var e = svgToBase64(svg).right();
    var map1 = map('map1', e), 
        map2 = map('map2', e);

    var image = L.imageOverlay(e.data_uri, map1[1]).addTo(map1[0]);
    canvasDraw(e, map2[1], map2[0]);

});

function map(el, e)
{
    var map = L.map(el, {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
    });

    var img_size = {x: e.width, y: e.height};
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  transformation(map_size, img_size);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans }); 
    map.setMaxBounds([[-img_size.y, -img_size.x], [img_size.y*2, img_size.x*2]]);
    var bounds =  L.latLngBounds([[0,0], [img_size.y, img_size.x]]);
    map.setMaxZoom( maxZoom(img_size) );
    map.fitBounds(bounds);
    return [map, bounds];
}

function canvasDraw(e, img_bounds, map){
    var img_size = {x: e.width, y: e.height};
    var map_size = map.getSize();
    var img_env = Envelope(img_bounds);
    var ppm = L.point(img_size.x / img_env.max_x, img_size.y / img_env.max_y); // pixels per meter


    var img = new Image();
    img.src = e.data_uri;
    img.onload = function()
    {
        L.canvasLayer2(drawImage).addTo(map);
    };

    function drawImage(canvas)
    {
        var container_img_env = toContainerEnvelope(img_env, map);
        var canvas_place = { 
            x: Math.max(0, container_img_env.min_x),
            y: Math.max(0, container_img_env.min_y)
        }; 
        var canvas_img_size = {
            width: Math.min(container_img_env.max_x, map_size.x) - canvas_place.x,
            height: Math.min(container_img_env.max_y, map_size.y) - canvas_place.y,
        };
        var zoom = map.getZoom();
        var visible_env = Envelope(map.getBounds()).intersection(img_env);
        var img_clip_place = visible_env.min().scaleBy(ppm).round();
        var img_clip_size = visible_env.max().scaleBy(ppm).round().subtract(img_clip_place);


        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, img_clip_place.x, 
                           img_clip_place.y, 
                           img_clip_size.x, 
                           img_clip_size.y, 
                           canvas_place.x, 
                           canvas_place.y, 
                           canvas_img_size.width, canvas_img_size.height );
    }
   
}

}());
