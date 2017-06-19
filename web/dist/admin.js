(function () {
'use strict';

function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
}

function memorize(f) {
	if (!f.cache) f.cache = {};
	return function() {
		var cacheId = [].slice.call(arguments).join('');
		return f.cache[cacheId] ?
				f.cache[cacheId] :
				f.cache[cacheId] = f.apply(window, arguments);
	};
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

function GridPanel(map){

    var map_size = map._container.getBoundingClientRect();
    var margin = {left: 50, right: 0, top: 5, bottom: 30};
    var map_size_m = null;

    var format_meters = function(d) { return d + ' м'};

    var $graphPanel = d3.select('body')
        .append('svg')
            .style('position', 'absolute')
            .style('top', (map_size.top - margin.top) + 'px')
            .style('left', (map_size.left - margin.left - 1) + 'px')
            .style('height', (map_size.height + margin.top + margin.bottom) + 'px')
            .style('width', (map_size.width + margin.left + margin.right) + 'px')
            .style('pointer-events', 'none');

    // Axis X
    var $axisX = $graphPanel.append('g')
                    .attr('class', 'x axis')
                    .attr("transform", "translate("+ margin.left+"," + (margin.top + map_size.height) + ")");
    var scaleX = d3.scaleLinear().range([0, map_size.width]);
    var axisX = d3.axisBottom(scaleX).ticks(10).tickFormat(format_meters);

    // Axis Y
    var $axisY = $graphPanel.append('g')
                    .attr('class', 'y axis')
                    .attr("transform", "translate("+ (margin.left) +"," + margin.top + ")");
    var scaleY = d3.scaleLinear().range([0, map_size.height ]);
    var axisY = d3.axisLeft(scaleY).ticks(10).tickFormat(format_meters);

    // Grid
    var $gridX = $graphPanel.append('g')
                    .attr('class', 'grid')
                    .attr("transform", "translate(" + margin.left + "," + (margin.top + map_size.height) + ")");
    var gridAxisX = d3.axisBottom(scaleX).ticks(40)
                                   .tickSize(-map_size.height, 0, 0)
                                   .tickFormat('');

    var $gridY = $graphPanel.append('g')
                    .attr('class', 'grid')
                    .attr("transform", "translate("+ margin.left + "," + margin.top + ")");

    var gridAxisY = d3.axisRight(scaleY)
                                    .ticks(40)
                                   .tickSize(map_size.width, 0, 0)
                                   .tickFormat('');

    var get_grid_ticks = memorize(function(){
        var domainX = scaleX.domain();
        var domainY = scaleY.domain();     
        var x_step = Math.round(Math.abs(scaleX.invert(20) - scaleX.invert(0)));
        x_step = Math.max(0.5, x_step);
        return [
            Math.abs( (domainX[1] - domainX[0]) / x_step),
            Math.abs( (domainY[1] - domainY[0]) / x_step)
        ]        
    });

    var render = function() {
        if(!map_size_m)
            return;
        var b = map.getBounds();
        scaleX.domain([b.getWest(), b.getEast()]);
        $axisX.call(axisX);

        scaleY.domain([map_size_m.y-b.getSouth(), map_size_m.y-b.getNorth() ]);
        $axisY.call(axisY);

        var ticks = get_grid_ticks(map.getZoom());
        gridAxisX.ticks(ticks[0]);
        gridAxisY.ticks(ticks[1]);
        $gridX.call(gridAxisX);
        $gridY.call(gridAxisY);
    
    }; 

    map.on('move', render);

    return function(size_m){
        map_size_m = size_m;
        render();
    }
}

var svg_file_reader = SvgFileReader();


var vm = new Vue({
    el: '#svg-file',
    data: {
        error: '',
        width_m: null,
        height_m: null,
        width_px: null,
        height_px: null
    },
    methods: {
        on_change: function(e){
            svg_file_reader(e);            
        }
    },
    computed: {
        width: {
            get: function(){ return this.width_m;},
            set: function(val) {
                if(+val <= 1) return;
                this.width_m = +val;
                this.height_m = Math.round((this.height_px / this.width_px) * this.width_m);
                update_image_scale({x:this.width_m, y: this.height_m});
            }
        },
        height: {
            get: function(){ return this.height_m;},
            set: function(val) {
                if(+val <= 1) return;
                this.height_m = +val;
                this.width_m = Math.round((this.width_px / this.height_px) * this.height_m);
                update_image_scale({x:this.width_m, y: this.height_m});
            }
        }
        
    }
});


var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

var gridPanel = GridPanel(map);

svg_file_reader.on('error', function(er){
    vm.error = er;
});

var image = null;

function update_image_scale(img_size_m){
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};

    var trans =  transformation(map_size, img_size_m);
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]]);    
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);

    // set max zoom
    var max_dimension = Math.max(img_size_m.y, img_size_m.x);
    // var maxZoom = Math.log2( max_dimension / (1 * 10) )   -- IE 11 not supported log2
    var maxZoom = Math.log( max_dimension / (1 * 10) )  / Math.log(2);
    maxZoom =  Math.round(maxZoom);
    map.setMaxZoom(maxZoom);
        
    if(image) {
        image.setBounds(bounds);
        map.fitBounds(bounds);
        gridPanel(img_size_m);
    }
    return bounds


}

svg_file_reader.on('new_svg', function(e){
    if(image){
        map.removeLayer(image);
    }
    vm.width_px = vm.width_m = Math.round(e.width);
    vm.height_px = vm.height_m = Math.round(e.height);
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};
    var img_size = {x: e.width, 
                    y: e.height};

    var img_size_m = {x: e.width, 
                    y: e.height};               
    var bounds = update_image_scale( img_size_m);     

    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);

    // {
    //     var randomX = d3.randomUniform(bounds[0][1], bounds[1][1]) 
    //     var randomY = d3.randomUniform(bounds[0][0], bounds[1][0]) 
    //     for(var i=0; i<100; i++) {
    //         var x = randomX();
    //         var y = randomY();
    //         var b = [[y,x],[y+20,x+20]];
    //         var image2 = L.imageOverlay('svg/examples/atm.svg', 
    //                         b, 
    //                         {interactive: true}).addTo(map);

    //         // image2.on('mousedown click mousemove mouseover mouseout contextmenu', function(e){
    //         //     console.log('mousedown')
    //         //     L.DomEvent.preventDefault(e)
    //         //     L.DomEvent.stop(e)
    //         // })

    //         var draggable = new L.Draggable(image2._image);
    //         draggable.enable();
    //         draggable.on('dragend', function(e){
    //             console.log(e);
    //         })
    //     }

    // }

    gridPanel(img_size_m);
});

var vm2 = new Vue({
    el: '#coords',
    data:{
        x:0,
        y:0
    }
});

map.on('mousemove', function( e) {
    vm2.x = e.latlng.lng;
    vm2.y = e.latlng.lat;
});

}());
