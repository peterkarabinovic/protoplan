(function () {
'use strict';

/**
 * 
 * @param {function} reducers - reduce state function 
 * @param {Array} middleware - optional array of middleware
 * @param {Object} initState - optional init state
 */
function Store(reducers, middleware)
{
    middleware = middleware || [];

    var s = function(action_type, payload) {
        return s.dispatch({ type: action_type, payload: payload});
    };
    s.state = {};

    var listeners = {}, exactly_listeners = {};
    s.on = _.partial(_on, listeners);
    s.on_exactly = _.partial(_on, exactly_listeners);
    s.off = _.partial(_off, listeners);
    s.off_exactly = _.partial(_off, exactly_listeners);

    s.dispatch = function(action){
        var old_state = s.state;
        s.state = reducers(s.state, action);
        var diffs = diff_paths(s.state, old_state);
        if(!_.isEmpty(diffs)) {
            var events = _collect_diff_event([], diffs);
            fire(listeners, exactly_listeners, events);
        }
        return s.state;
    };

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    });


    return s;
}

/**
 * find all diff paths in two objects
 * @param {Object} obj1 
 * @param {Object} obj2 
 */
function diff_paths(new_obj, old_obj){
    var props = diffs(new_obj, old_obj);
    var paths = {};
    props.forEach(function(prop){
        var o1 = new_obj[prop];
        var o2 = old_obj[prop];
        paths[prop] = {new_val:o1, old_val:o2};
        paths[prop].paths = L.extend({}, diff_paths(o1, o2));
    });
    return paths;
}

/**
 * find the properties that is not equals
 * @param {Object} obj1  
 * @param {Object} obj2 
 */
function diffs(new_obj, old_obj)
{
    if(!_.isObject(new_obj) || !_.isObject(old_obj))
        return [];
    if(_.isArray(new_obj) || _.isArray(old_obj))
        return [];
    var keys = _.uniq( Object.keys(new_obj).concat( Object.keys(old_obj) ) );
    return keys.reduce(function(diffs, key){
        return _.isEqual(new_obj[key], old_obj[key]) ? diffs : diffs.concat(key);
    },[]);
}

function _on(listeners, path, fn) {
    path = path.split('.');
    listeners[path.length] = listeners[path.length] || [];
    listeners[path.length].push( {path:path, fn:fn} );
}

function _off(listeners, path, fn) {
    path = path.split('.');
    var ln = path.length;
    var ll = listeners[ln];
    if(ll){
        ll = _.reject(ll, function(it){ return _.isEqual(it.path, path) &&  it.fn == fn; });
        listeners[ln] = ll.length ? ll : undefined;  
    }
}


function fire(listeners, terminal_listeners, events)
{
    _.each(events, function(e){
        var len = e.path.length;
        var ll = listeners[len] || [];
        if(e.terminal)
            ll = ll.concat( terminal_listeners[len] || [] );
        _.each(ll, function(it){
            if(_match(e.path, it.path))
                it.fn(e);
        });
    });
}


function _match(path, mask_path){
    path = _.clone(path);
    for(var i in mask_path) {
        if(mask_path[i] === '*')
            path[i] = '*';
    }
    return _.isEqual(path, mask_path);
}

/**
 * Return list of change event
 *  Change event is:
 *               { path: Array, - property list
 *                 old_val: Any, 
 *                 new_val: Any,
 *                 terminal: Boolean - is terminal diff property or not
 *               }
 */
function _collect_diff_event(path, diff_paths){
    return _.reduce(diff_paths, function(events, diff, prop) {
        var p = path.concat([prop]);
        events.push({ path: p, old_val: diff.old_val, new_val: diff.new_val, terminal: _.isEmpty(diff.paths) });
        events = events.concat( _collect_diff_event(p, diff.paths) );
        return events;
    },[]);
}




/**
 *  Reducer helpers
 */

function combine(reducerMap)
{
    return function(state, action){
        if(_.isEmpty(state))
            state = {};
        
        var new_state={};
        _.each(reducerMap, function(reducer, key){
            new_state[key] = reducer(state[key], action);
        });
        return _.extend({}, state, new_state);
    }
}

function handle(defaultState, handlers)
{
    defaultState = defaultState || {};
    return function(state, action){
        if(_.isEmpty(state))
            state = _.clone(defaultState);
        
        return (handlers[action.type] || _.identity)(state, action);
    }
}

var mapReducers = handle(
    {
        drawMode: null,    // distance_line, polyline, carpet ... 
        baseImage: null,   // {}
        distanceLine: null, // <Number>
        envLayer: null
    },
    {
        
        BASE_IMAGE_SET: function(state, action){
            return _.extend({}, state, {baseImage: action.payload});
        },
        BASE_IMAGE_SIZE_UPDATE: function(state, action){
            var size_m = action.payload;
            return _.extend({}, state, {baseImage: _.extend(state.baseImage, {size_m: size_m})});
        },
        DRAW_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawMode: mode});
        },
        DISTANCE_SET: function(state, action){
            var dist_m = action.payload;
            return _.extend({}, state, {distanceLine: dist_m});
        },
        
    }
);


var Reducers = combine({
    map: mapReducers
});


// SELECTORS
function getBaseLayer(store) { return store.state.map && store.state.map.baseImage; }
function getDistanceLine(store) { return store.state.map && store.state.map.distanceLine; }

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
function Either(left, right){
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
}

Either.right = function(value){
    return Either(null, value)
};

Either.left = function(value){
    return Either(value)
};


/*
 * Selfcheck - wrap callback function for check if it already called in stack above
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

function Map(el, store)
{
    map = L.map(el, 
    {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        editable: true,
            editOptions: {
                skipMiddleMarkers: true
            }
    });

    gridPanel = GridPanel(map);

    // State changes
    store.on_exactly('map.baseImage', function(e) { updateBaseLayer(e.new_val); });
    store.on('map.baseImage.size_m', function(e) { updateBaseLayerSize(e.new_val); });
}


var map  = null;
var baseLayer = null;
var gridPanel = null;

function updateBaseLayer(img)
{
    if(baseLayer) {
        map.removeLayer(baseLayer);
    }
    var bounds = updateBaseLayerSize(img.size_m);
    baseLayer = L.imageOverlay(img.url, bounds).addTo(map);
}

function updateBaseLayerSize(size_m)
{
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  transformation(map_size, size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    map.fitBounds(bounds);
    gridPanel(size_m);
    if(baseLayer)
        baseLayer.setBounds(bounds);
    return bounds;
}

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

var DRAW_DISTANCE = 'draw_line';

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

function BaseImageView(store) 
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
                vm.error = '';
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
                                });
                            }
                        );
                    };
                    reader.readAsText(file);
                }
            },
            hasLine: function(){
                return getDistanceLine(store);
            },
            draw_line: function(){
                store('DRAW_MODE_DISTANCE', DRAW_DISTANCE);
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

    store.on('map.baseImage', function(e){
        vm.$forceUpdate();
    });

    store.on('map.distanceLine', function(e){
        vm.lineLength = e.new_val;
    });
}

var store = Store(Reducers);
window.store = store;

store("INIT");

Map('map', store);
BaseImageView(store);

}());
