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
 * As LatLngBounds with its SouthNorthWestEast stuff mislead with planar metric space
 * Envelope seems more convenient 
 * @param {LatLngBounds} bounds 
 */
function Envelope(bounds)
{
    return {
        min_x: bounds.getWest(),
        min_y: bounds.getSouth(),
        max_x: bounds.getEast(),
        max_y: bounds.getNorth()
    }
}

function toContainerEnvelope(env, map)
{
    var min = map.latLngToContainerPoint({lat: env.min_y, lng: env.min_x});
    var max = map.latLngToContainerPoint({lat: env.max_y, lng: env.max_x});
    return {
        min_x: min.x,
        min_y: min.y,
        max_x: max.x,
        max_y: max.y
    }
}

function toLayerEnvelope(env, map)
{
    var min = map.latLngToLayerPoint({lat: env.min_y, lng: env.min_x});
    var max = map.latLngToLayerPoint({lat: env.max_y, lng: env.max_x});
    return {
        min_x: min.x,
        min_y: min.y,
        max_x: max.x,
        max_y: max.y
    }
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

L.Browser.touch = false;


var vm = new Vue({
    el: '#app',
    data: {
        error: '',
        width_m: null,
        height_m: null,
        width_px: null,
        height_px: null,
        line: null,
        lineLength: null
    },
    methods: {
        on_change: function(e)
        {
            var file = e.target.files[0]; 
            if(!file) return;
            if(file.type !== 'image/svg+xml') {
                this.error = t('invalid_svg_type', {type: file.type});
            }
            else {
                var reader = new FileReader();
                reader.onloadend = function(e){
                    var res = svgToBase64(reader.result);
                    res.fold(function(e) { vm.error = e;},
                             function(e){
                                vm.width_px = vm.width_m = Math.round(e.width);
                                vm.height_px = vm.height_m = Math.round(e.height);
                                var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
                                var img_size_m = {x: e.width, y: e.height};               
                                var bounds = update_image_scale(map_size, img_size_m);
                                map.fitBounds(bounds);
                                gridPanel(img_size_m);
                                
                                new_svg(e, bounds);
                                new_canvas(e, bounds);
                             });
                };
                reader.readAsText(file);
            }
            
        },
        on_line: function(e){
            this.line = map.editTools.startPolyline(undefined, {weight:1, color: 'red'});
        },
        needLine: function(){
            return this.width_m && !this.line;
        },
        isLine: function(){
            return this.line && this.line.getLatLngs().length == 2;
        },
        recalculateScale: function(){
            var bounds = this.line.getBounds();
            this.line.bindTooltip('dsdsds');
        }
    },
    computed: {
        widthHeight: function(){
            return  this.width_m ? (this.width_m + " м / " + this.height_m + " м") : "";
        }
    }
});

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false,
    editable: true,
    editOptions: {
        skipMiddleMarkers: true
    }
});

map.on('editable:editing', function(event){
    var line = event.layer;
    if(line.getLatLngs().length == 2)
        map.editTools.stopDrawing();
});



var gridPanel = GridPanel(map);

var image = null;
function update_image_scale(map_size, img_size_m){
    var trans =  transformation(map_size, img_size_m);
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]]);    
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);

    map.setMaxZoom( maxZoom(img_size_m) );
        
    if(image) {
        image.setBounds(bounds);
        map.fitBounds(bounds);
        gridPanel(img_size_m);
    }
    return bounds
}

function new_svg(e, bounds) 
{
    if(image){
        map.removeLayer(image);
    }
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
 
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

    
}


function new_canvas(e, bounds)
{

    // points
    var env = Envelope(bounds); 
    var randomX = d3.randomUniform(env.min_x, env.max_x);
    var randomY = d3.randomUniform(env.min_y, env.max_y); 
    var points = [];
    for (var i = 0; i < 10000; i++) {
        points.push({x:randomX(), y:randomY() });
    }

    var memoryImages = new Image();
    memoryImages.src = e.data_uri;
    memoryImages.onload = function(){
        L.canvasLayer()
         .delegate(ca)    
         .addTo(map);
    };

    var ca = {};
    ca.onDrawLayer = function(info) 
    {
        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
        var env = Envelope(info.bounds); 
        var layer_env = toLayerEnvelope(env, info.layer._map);
        var container_env = toContainerEnvelope(env, info.layer._map);
        console.log('map.getPixelOrigin()',info.layer._map.getPixelOrigin());
        console.log('env',env);
        console.log('layer_env',layer_env);
        console.log('container_env',container_env);



        {
        // ctx.fillStyle = "rgba(255,116,0, 1)";
        // points.forEach( p => {
        //     if(!info.bounds.contains([p.y, p.x])) {
        //         return;
        //     }
        //     var dot = info.layer._map.latLngToContainerPoint([p.y, p.x]);
        //     ctx.beginPath();
        //     ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        //     ctx.fill();
        //     ctx.closePath();
        // })
        }
    };
    

}

}());
