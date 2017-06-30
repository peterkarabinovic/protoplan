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

    var listeners = {};
    
    s.on = function(path, fn){
        var paths = path.split(' ');
        paths.forEach(function(p){
            p = p.trim().split('.');
            listeners[p.length] = listeners[p.length] || [];
            listeners[p.length].push( {path:p, fn:fn} );
        });
    };

    s.off = function(path, fn){
        var paths = path.split(' ');
        paths.forEach(function(p){
            p = p.split('.');
            var ln = p.length;
            listeners = reject_array_prop(listeners, ln, function(it){ 
                return _.isEqual(it.path, p) &&  it.fn == fn; 
            });
        });
        
    };

    s.dispatch = function(action){
        var old_state = s.state;
        s.state = reducers(s.state, action);
        find_and_fire(s.state, old_state, _.clone(listeners), []);
        return s.state;
    };

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    });


    return s;
}

/**
 * Recursive run by properties search diff and fire events 
 * @param {*} new_obj 
 * @param {*} old_obj 
 * @param {*} listeners 
 * @param {*} path 
 */
function find_and_fire(new_obj, old_obj, listeners, path)
{
    if( _.isEmpty(listeners) )
        return

    new_obj = new_obj || {};
    old_obj = old_obj || {};
       
    var props = diffs(new_obj, old_obj);    
    var max_level = +_.max(_.keys(listeners));
    props.forEach(function(prop){
        var o1 = new_obj[prop];
        var o2 = old_obj[prop];
        var p = path.concat([prop]);
        listeners = reject_array_prop(listeners, p.length, function(it){
            if(_match(p, it.path)) {
                it.fn({new_val: o1, old_val: o2, path: p});
                return !_.contains(it.path, '*');
            }
            return false;
        });
        if(max_level > p.length)
            find_and_fire(o1, o2, listeners, p);
    });
}

function reject_array_prop(obj, prop, reject_fn){
    var a = obj[prop];
    if(a){
        a =  _.reject(a, reject_fn);
        if(a.length)
            obj[prop] = a;
        else
            delete obj[prop];
    }
    return obj;
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
    var keys = _.uniq( Object.keys(new_obj).concat( Object.keys(old_obj) ) );
    return keys.reduce(function(diffs, key){
        return _.isEqual(new_obj[key], old_obj[key]) ? diffs : diffs.concat(key);
    },[]);
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
 *  Reducer helpers
 */

function combine(reducerMap, rootReducer)
{
    return function(state, action){
        
        if(rootReducer)
            state = rootReducer(state, action);
        else if(_.isEmpty(state))
            state = {};
        
        var newState={};
        var hasChanged = false;
        _.each(reducerMap, function(reducer, key){
            newState[key] = reducer(state[key], action);
            hasChanged = hasChanged || state[key] !== newState[key];
        });
        return hasChanged ? newState : state;
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



/***
 * Immutable helper
 */
var Immutable = (function(){
    var i = {};
    i.update = function(obj, path, value){
        if(!_.isArray(path))
            path = path.split('.');
        obj = obj || {};
        if(path.length == 1){
           obj = _.clone(obj);
           obj[path[0]]  = value;
        }
        else {
            var prop = path[0];
            var prop_val = obj[prop];
            prop_val = i.update(prop_val, path.slice(1), value);
            obj = _.clone(obj);
            obj[prop] = prop_val;
        }
        return obj;
    };
    return i;
})();

var layers = handle(
    {
        base: null,
        additional: null,
        stands: null,
        equipment: null
    },
    {
        BASE_IMAGE_SET: function(state, action){
            return _.extend({}, state, {base: action.payload});
        },
        BASE_IMAGE_SIZE_UPDATE: function(state, action){
            var size_m = action.payload;
            return _.extend({}, state, {base: _.extend(state.base, {size_m: size_m})});
        },
    }
);

var map$1 = handle(
    {
        drawing_mode: null,
    },
    {
        DRAWING_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawing_mode: mode});
        }
    }
);


var modules = combine(
{
    base: handle(
        {
            points: [],
            length_px: null,
            length_m: null,
        },
        {
            DISTANCE_LINE_SET: function(state, action){
                return _.extend({}, state, {points: action.payload.points,
                                            length_m: action.payload.length_m,
                                            length_px: action.payload.length_px});
            }
    })
});

var root = handle({},
{
    DISTANCE_SET: function(state, action){
        var length_m = action.payload;
        var ratio =  length_m / state.modules.base.length_m;
        var size_m = state.layers.base.size_m;
        size_m = {
            x: size_m.x * ratio,
            y: size_m.y * ratio
        };
        state = Immutable.update(state, 'layers.base.size_m', size_m);
        state = Immutable.update(state, 'modules.base.length_m', length_m);
        return state;
    }
});


var Reducers = combine({
    layers: layers,
    map: map$1,
    modules: modules
}, root);


// SELECTORS

function getModuleBase(store) { return store.state.modules.base; }

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
    map$2 = L.map(el, 
    {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        editable: true,
            editOptions: {
                skipMiddleMarkers: true
            }
    });

    gridPanel = GridPanel(map$2);

    // State changes
    store.on('layers.base', function(e) { updateBaseLayer(e.new_val); });
    store.on('layers.base.size_m', function(e) { updateBaseLayerSize(e.new_val); });
    return map$2;
}


var map$2  = null;
var baseLayer = null;
var gridPanel = null;

function updateBaseLayer(img)
{
    if(baseLayer) {
        map$2.removeLayer(baseLayer);
    }
    var bounds = updateBaseLayerSize(img.size_m);
    baseLayer = L.imageOverlay(img.url, bounds).addTo(map$2);
}

function updateBaseLayerSize(size_m)
{
    var map_size = {x: map$2._container.offsetWidth, y: map$2._container.offsetHeight};
    var trans =  transformation(map_size, size_m);
    map$2.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map$2.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map$2.setMaxZoom( maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map$2.getZoom()))
        map$2.fitBounds(bounds);
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

var DRAW_DISTANCE = 'draw-distance';

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
            width: null, height: null,
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
            draw_line: function(){
                store('DRAWING_MODE_SET', DRAW_DISTANCE);
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

var DRAW_DISTANCE$1 = 'draw-distance';

function BaseScaleEditor(map, store){

    var line = null;
    var tooltip = null; 
    store.on('map.drawing_mode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE$1)
        {
            line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'});   
            line.on('editable:editing', on_edit);
        }
    });

    store.on('layers.base.size_m', function(){
        if(!line) return
        var points = getModuleBase(store).points;
        var latLngs = points.map(function(it){
            return map.unproject(it,1);
        });
        line.disableEdit();
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(getModuleBase(store).length_m);
    });

    function on_edit(event)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) 
        {
            var latLngs = line.getLatLngs();
            map.editTools.stopDrawing();
            var points = latLngs.map(function(it){
                return map.project(it,1);
            });
            var length_px = points[0].distanceTo(points[1]);
            var length_m = Math.round(L.CRS.Simple.distance(latLngs[0], latLngs[1]));
            updateTooltip(length_m);
            store('DISTANCE_LINE_SET', {length_px: length_px, length_m:length_m, points: points});
            store('DRAWING_MODE_SET', null);
        }
    }

    function updateTooltip(length_m){
        var content = length_m + ' m';
        if(line.getTooltip())
            line.getTooltip().setLatLng(line.getCenter()).setContent(content);
        else
            line.bindTooltip(content, {permanent:true, interactive:true}); 
                
    }

    
}

var store = Store(Reducers);
window.store = store;


var map = Map('map', store);
BaseImageView(store);
BaseScaleEditor(map, store);

}());
