(function () {
'use strict';

function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
}


var Maybe = (function () {
  var Some = function (x) { this.x = x; };
  Some.prototype.fmap = function (fn) { return Maybe.of(fn(this.x)); };
  Some.prototype.bind = function (fn) { return fn(this.x); };
  Some.prototype.toString = function () { return `Some(${this.x})`; };

  var None = function () {};
  None.fmap = function() { return None };
  None.bind = function() { return None };
  None.toString = function() { return 'None' }; 

  return {
    //of: (x) => x === null || x === undefined ? None : new Some(x),
    // lift: (fn) => (...args) => Maybe.of(fn(...args)),
    Some,
    None
  };
})();


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
        }
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

/*
 * @method parse_svg(svg_text: svg string): object
 * parse svg text
 */
function parse_svg(svg_text){
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

    var viewBox = null;
    if(svg_doc.viewBox.baseVal && svg_doc.viewBox.baseVal.width != 0) {
        var vb = svg_doc.viewBox.baseVal;
        viewBox = [vb.x, vb.y, vb.width, vb.height];
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


var SvgFileReader = function()
{
    var dispatch = d3.dispatch('new_svg', 'error');
    var error = function(msg) { dispatch.call('error', this, msg);};
    var new_svg = function(d) { dispatch.call('new_svg', this, d);};

    /*
    * @function reader_fn(e: event): void
    * handler for 'change' event of input[type='file']
    */
    var reader_fn = function(e){
        var file = e.target.files[0]; 
        if(!file) return;
        if(file.type !== 'image/svg+xml') {
            error(t('invalid_svg_type', {type: file.type}));
        }
        else {
            var reader = new FileReader();
            reader.onloadend = function(e){
                var res = parse_svg(reader.result);
                res.fold(error, new_svg);
            };
            reader.readAsText(file);
        }
    };

    reader_fn.on = function(type,fn) { dispatch.on(type,fn); }; 
    return reader_fn
};

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

var svg_file_reader = SvgFileReader();


var vm = new Vue({
    el: '#svg-file',
    data: {
        error: ''
    },
    methods: {
        on_change: function(e){
            svg_file_reader(e);            
        }
    }
});

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

svg_file_reader.on('error', function(er){
    vm.error = er;
});

var image = null;
svg_file_reader.on('new_svg', function(e){
    if(image){
        map.removeLayer(image);
    }
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};
    var img_size = {x: e.width, 
                    y: e.height};
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: transformation(map_size,img_size) });
    var bounds = [[0,0], [e.height, e.width]];
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);
    map.removeLayer(gridLayer);
    map.addLayer(gridLayer);
});

var coord_vm = new Vue({
    el: '#coords',
    data: { x:0, y:0}
});

map.on('mousemove', function(e){
    var latlng = e.latlng;
    coord_vm.x = L.Util.formatNum(latlng.lng, 2);
    coord_vm.y = L.Util.formatNum(latlng.lat, 2);
});

var gridLayer =  L.d3SvgOverlay(function(selection, proj) {
    var points = [];
    if(image) {
        var ll = image.getBounds().getCenter();
        var x = d3.randomNormal(ll.lng, 100);
        var y = d3.randomNormal(ll.lat, 100);
        points = d3.range(10).map( it => {
            return proj.latLngToLayerPoint(L.latLng(y(), x()))
        });
    }
    var p = it => proj.latLngToLayerPoint(it);
    var circles = selection.selectAll('circle').data(points);
    circles.enter()
            .append('circle')
            .style("opacity", "0.3")
            .attr("r", 5)
    .merge(circles)
            .attr("cx", d => d.x )
            .attr("cy", d => d.y );                
});

}());
