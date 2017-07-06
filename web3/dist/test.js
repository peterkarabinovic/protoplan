(function () {
'use strict';

/**
 *  Small functional programming stuff 
 */



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


/***
 * Immutable 
 */

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
            .style('pointer-events', 'none')
            .style('z-index', "2001");

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
        if(!map_size_m) {
            return;
        }    
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

L.Browser.touch = false;

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false,
    editable: true,
        editOptions: {
            // skipMiddleMarkers: true
        }
});
var gridPanel = GridPanel(map);
function updateBaseLayerSize(size_m)
{
    if(!size_m) return;
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  transformation(map_size, size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map.getZoom()))
        map.fitBounds(bounds);
    gridPanel(size_m);
    return bounds;
}

updateBaseLayerSize({x:800, y:600});

function View()
{
    return new Vue({
        el: '#form',
        data: {
            selection: null,
        },
        methods: {
            select: function(sel){ 
                this.selection = sel; 
            },
            cssClass: function(p){
                return p == this.selection ? 'w3-text-red'  : '';
            }
        }
    });
}

function Draw(view)
{
    var drawMode = null;
    var groupLayer = L.layerGroup().addTo(map);
    var modes = {
        line: drawLine(groupLayer),
        rect: drawRect(groupLayer),
        note: drawNote(groupLayer)
    };

    view.$watch('selection', function(sel)
    {
        if(drawMode){
            drawMode.exit();
        }
        drawMode = modes[sel];
        if(drawMode)
            drawMode.enter();
    });
}

function drawLine(groupLayer)
{
    var line = null;

    function enter(){
        line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'});
        line.on('editable:drawing:commit', on_commit);

    }

    function exit(){
        if(line) {
            line.disableEdit();
            map.removeLayer(line);
            line.off('editable:drawing:commit', on_commit);
            line = null;
        }
    }

    function on_commit(event){
        line.disableEdit();
        map.removeLayer(line);
        line.setStyle({weight:4, color: 'green'});
        groupLayer.addLayer(line);
        line.off('editable:drawing:commit', on_commit);
        line = null;
    }


    return {enter:enter, exit: exit};
}

function drawRect(groupLayer){
    var rect = null;
    
    function enter(){
        rect = map.editTools.startRectangle(undefined, {weight:2, color: 'red', dashArray:'5,10'});
        rect.on('editable:drawing:commit', on_commit);
    }
    function exit(){

    }
    function on_commit(event){
        rect.disableEdit();
        map.removeLayer(rect);
        rect.setStyle({weight:2, color: 'green'});
        groupLayer.addLayer(rect);
        rect.off('editable:drawing:commit', on_commit);
        rect = null;
    }
    return {enter:enter, exit: exit};
}

function drawNote(groupLayer){
    function enter(){

    }
    function exit(){

    }
    return {enter:enter, exit: exit};
}


Draw(View());

}());
