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
        if(s.state !== old_state)
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





function reduceReducers(reducers){
    return function(state, action){
        reducers.forEach(function(fn){
            state = fn(state, action);
        });
        return state;
    }
}

function str() {
    return "".concat.apply("",arguments);
}

function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
}


/*
 * Selfcheck - wrap callback function for check if it already called in stack above
 */

function Selfcheck(){
    var me = false;
    return function(callback){
        return function(){
            if(me) return; 
            me = true;
            try{var res = callback.apply(this, arguments); } finally {me = false;}
            return res;
        } 
    }
}

function initComponents()
{

    Vue.component('folding', {
        props: ['title', 'open'],

        template: str('<div style="cursor: pointer;">',
                    '<span @click="on_click" style="margin-left: -1.2em" class="w3-text-grey">',
                    '<i  style="margin-right: 0.4em" class="material-icons">{{icon}}</i>',
                    '{{title}}</span>',
                    '<div v-show="is_open"><slot></slot></div>',
                  '</div>'),

        data: function(){
            return {
                is_open: this.open !== 'false'
            }
        },
        computed: {
            icon: function(){
                return ['chevron_right', 'expand_more'][+this.is_open];
            }
        },
        methods: {
            on_click: function(){
                this.is_open = !this.is_open;
            }
        }
    });

}

/**
 * Init state
 */
var initState = {
    pavilions: {

    },
    map: {
        drawingMode: undefined,
    },
    selectedPavilion: undefined,
    selectedBaseLayer: undefined,
    selectedOverlayLayer: undefined,
    selectedOverlayFeat: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
        stand_categories: {},
        equipments: {} 
    },
    ui: {
        error: ''
    }
};

function entity(type, store, id)
{
    var e = store.state.entities[type];
    return e && e[id] || {};
}

var baseById = _.partial(entity, 'bases');
var overlayById = _.partial(entity, 'overlays');

function selectedPavilion(store){
    return store.state.selectedPavilion;
}

function baseLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && pavi.base &&  baseById(store, pavi.base) || {};
}




function selectedBaseLayer(store) {
    return store.state.selectedBaseLayer  || {};
}

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
function Either(left, right){
    return {
        fold: function(left_fn, right_fn) {
            left === void 0 ? right_fn(right) : left_fn(left);
        }
    }
}

Either.right = function(value){
    return Either(undefined, value)
};

Either.left = function(value){
    return Either(value)
};


/***
 * Immutable 
 */
var Immutable = (function(){
    var i = {};

    function update(obj, path, value, opt){
        if(!_.isArray(path))
            path = path.split('.');
        if(_.isUndefined(obj))
            obj = {};
        if(path.length == 1){
           obj = _.clone(obj);
           if(opt == 'extend')
                obj[path[0]] = _.extend({}, obj[path[0]], value);
           else if(opt == 'set')
                obj[path[0]]  = value;
           else 
                delete obj[path[0]];
        }
        else {
            var prop = path[0];
            var prop_val = obj[prop];
            prop_val = update(prop_val, path.slice(1), value, opt);
            obj = _.clone(obj);
            obj[prop] = prop_val;
        }
        return obj;        
    }

    i.set = function(obj, path, value){
        return update(obj, path, value, 'set');
    };

    i.extend = function(obj, path, value){
        return update(obj, path, value, 'extend');
    };

    i.remove = function(obj, path){
        return update(obj, path, null, 'remove');
    };

    i.get = function(obj, path){
        if(!_.isArray(path))
            path = path.split('.');
        if(_.isUndefined(obj))
            return obj;

        if(path.length == 1){
            return obj[path[0]];
        }
        else {
            var prop = path[0];
            var prop_val = obj[prop];
            return i.get(prop_val, path.slice(1));
        }

    };
    return i;
})();

var INIT = 'INIT';

var PAVILION_ADD = 'PAVILION_ADD';
var PAVILION_DELETE = 'PAVILION_DELETE';
var PAVILION_DELETED = 'PAVILION_DELETED';
var PAVILION_ADDED = 'PAVILION_ADDED';
var PAVILION_SELECT = 'PAVILION_SELECT';
var PAVILIONS_LOADED = 'PAVILIONS_LOADED';


var BASE_LAYER_SET = 'BASE_LAYER_SET';
var BASE_LAYER_SAVE = 'BASE_LAYER_SAVE';
var BASE_LAYER_SAVED = 'BASE_LAYER_SAVED';
var BASES_LOADED = 'BASES_LOADED';
var BASE_DISTANCE_SET = 'BASE_DISTANCE_SET';
var BASE_DISTANCE_LENGTH_SET = 'BASE_DISTANCE_LENGTH_SET';


var DRAWING_MODE_SET = 'DRAWING_MODE_SET';

var OVERLAY_FEAT_ADD = 'OVERLAY_FEAT_ADD';
var OVERLAY_FEAT_UPDATE = 'OVERLAY_FEAT_UPDATE';
var OVERLAY_FEAT_DELETE = 'OVERLAY_FEAT_DELETE';
var OVERLAY_FEAT_SELECT = 'OVERLAY_FEAT_SELECT';
var OVERLAY_SAVE = 'OVERLAY_SAVE';


var ERROR_SET = 'ERROR_SET';

var pavilionReducer = function(state, action)
{
    switch(action.type)
    {
        case PAVILIONS_LOADED:
            return Immutable.set(state, 'pavilions', action.payload);

        case PAVILION_DELETED:
            var pavi_id = action.payload;
            var pavi = state.pavilions[pavi_id];
            if(pavi) {
                state = Immutable.remove(state, 'pavilions.'+pavi.id);
                state = Immutable.remove(state, 'entities.bases.'+pavi.id);
            }
            if(state.selectedPavilion && state.selectedPavilion.id == pavi_id) {
                state = Immutable.set(state, 'selectedPavilion');
                state = Immutable.set(state, 'selectedBaseLayer');
            }
            return state;

        case PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            state = Immutable.set(state, 'selectedBaseLayer', {id:pavi.id});
            return state;

        case PAVILION_SELECT:
            var pavi = action.payload;
            state = Immutable.set(state, 'selectedPavilion', pavi);
            if(pavi) {
                var base = state.entities.bases[pavi.id] || {id: pavi.id};
                state = Immutable.set(state, 'selectedBaseLayer', base);
            }
            return state;
            

    }
    return state;
};


var baseReducer = function(state, action)
{
    switch(action.type)
    {
        case BASES_LOADED:
            return Immutable.set(state, 'entities.bases', action.payload);

        case BASE_LAYER_SET: 
            var base = action.payload;
            return Immutable.extend(state, 'selectedBaseLayer', base);
        
        case BASE_DISTANCE_LENGTH_SET:
            var length_m = action.payload;
            var ratio =  length_m / state.selectedBaseLayer.distance.length_m;
            var size_m = state.selectedBaseLayer.size_m;
            size_m = {
                x: size_m.x * ratio,
                y: size_m.y * ratio
            };
            state = Immutable.set(state, 'selectedBaseLayer.size_m', size_m );
            return Immutable.set(state, 'selectedBaseLayer.distance.length_m', length_m);             
        
        case BASE_DISTANCE_SET: 
            var distance = action.payload;
            return Immutable.set(state, 'selectedBaseLayer.distance', distance);

        case BASE_LAYER_SAVED:
            var base = action.payload;
            if(state.pavilions[base.id]) {
                state = Immutable.set(state, 'entities.bases.'+base.id, base);
                if(state.selectedPavilion && base.id == state.selectedPavilion.id)
                    state = Immutable.extend(state, 'selectedBaseLayer', base);
            }
            else {
                state = Immutable.remove(state, 'entities.bases.'+base.id);
            }
            return state;
    }
    return state;
};

var overlayReducer = function(state, action){
    switch(action.type){
        case OVERLAY_FEAT_ADD: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            feat = Immutable.set(feat, 'id', generateId(state, 'selectedOverlayLayer.'+type));
            state = Immutable.set(state, 'selectedOverlayFeat', feat);
            return Immutable.set(state, 'selectedOverlayLayer.'+type+'.'+feat.id, feat);

        case OVERLAY_FEAT_UPDATE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.set(state, 'selectedOverlayLayer.'+type+'.'+feat.id, feat);

        case OVERLAY_FEAT_DELETE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.remove(state, 'selectedOverlayLayer.'+type+'.'+feat.id);

        case OVERLAY_FEAT_SELECT:
            return Immutable.set(state, 'selectedOverlayFeat', action.payload);

                    
        case OVERLAY_SAVE:
            var overlay = state.selectedOverlayLayer;
            var pavi_id = state.selectedPavilion.id;
            if(!overlay.id) {
                overlay = Immutable.set(overlay, 'id', pavi_id);
            }
            state = Immutable.set(state, 'selectedOverlayLayer', overlay);
            return Immutable.extend(state, 'entities.overlays', {id: overlay} );
    }
    return state;
};


var mapReducer = function(state, action)
{
    switch(action.type){
        case DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawingMode', mode);

    }
    return state;
};
var reducers = reduceReducers([pavilionReducer, baseReducer, overlayReducer, mapReducer]);


function generateId(state, path){
    var ids = _.keys( Immutable.get(state, path) || {} );
    return ids.length ? _.max(ids) + 1 : 1;
}

function RequestsMiddleware(store){
    return function(next){
        return function(action)
        {
            switch(action.type)
            {
                case INIT:
                    d3.json('/pavilions/')
                      .get(function(pavilions){
                            store(PAVILIONS_LOADED, pavilions);
                      }); 

                    d3.json('/bases/')
                      .get(function(bases){
                            store(BASES_LOADED, bases);
                      });

                    break;

                case PAVILION_ADD:
                    var pavi = action.payload;
                    d3.request('/pavilions/0')
                           .mimeType("application/json")
                           .on("error", function(error) { store(ERROR_SET, error); })
                           .on("load", function(xhr) { 
                               var res = JSON.parse(xhr.responseText);
                               pavi = _.extend({}, pavi, res);
                               store(PAVILION_ADDED, pavi);
                            })
                           .send('POST', JSON.stringify(pavi));
                    break;

                case PAVILION_DELETE:
                    var id = action.payload.id;
                    d3.request('/pavilions/'+id+'|delete')
                      .post(function(er, xhr){
                            if(er) store(ERROR_SET, er);
                            else store(PAVILION_DELETED, id);
                      });
                    break;

                case BASE_LAYER_SAVE:
                    var base_layer = _.clone(action.payload.base);
                    delete base_layer['distance'];
                    delete base_layer['raw_svg'];
                    d3.request('/pavilions/'+base_layer.id+'/base/')
                        .mimeType("application/json")
                        .send('POST', JSON.stringify(base_layer), function(er, xhr){
                            if(er) store(ERROR_SET, er);
                            else {
                                var res = JSON.parse(xhr.responseText);
                                base_layer = _.extend({}, base_layer, res);
                                store(BASE_LAYER_SAVED, base_layer);
                            }
                        });

                    
            }
            next(action);
        }
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

L.Browser.touch = false;

var Map = function(el, store)
{
    map$1 = L.map(el, 
    {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        editable: true
    });

    gridPanel = GridPanel(map$1);

    // State changes
    store.on('selectedBaseLayer', function(e) { updateBaseLayer(e.new_val); });
    store.on('selectedBaseLayer.size_m', function(e) { updateBaseLayerSize(e.new_val); });
    return map$1;
};


var map$1  = null;
var baseLayer$1 = null;
var gridPanel = null;

function updateBaseLayer(img)
{
    if(baseLayer$1) {
        map$1.removeLayer(baseLayer$1);
        baseLayer$1 = null;
    }
    if(img && img.url) {
        var bounds = updateBaseLayerSize(img.size_m);
        baseLayer$1 = L.imageOverlay(img.url, bounds).addTo(map$1);
        map$1.fitBounds(bounds);
    }
}

function updateBaseLayerSize(size_m)
{
    if(!size_m) return;
    var map_size = {x: map$1._container.offsetWidth, y: map$1._container.offsetHeight};
    var trans =  transformation(map_size, size_m);
    map$1.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map$1.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map$1.setMaxZoom( maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map$1.getZoom()))
        map$1.fitBounds(bounds);
    gridPanel(size_m);
    if(baseLayer$1)
        baseLayer$1.setBounds(bounds);
    return bounds;
}

var PavilionModule = function (store) 
{
    var vm = new Vue({
        el: "#pavilion",
        template: '#pavilion-template',
        data: {
            pavilions: _.values(store.state.pavilions),
            selectedPavilion: _.clone(store.state.selectedPavilion || {})
        },
        methods: {
            addPavilion: function(){
                var name = prompt("Название:").trim();
                if(name.length) 
                    store(PAVILION_ADD, {name: name, id:0});
            },
            deletePavilion: function(pavi){
                if(confirm('Удалить павильон "'+pavi.name+'"?'))
                    store(PAVILION_DELETE, pavi);
            },
            selectPavilion: function(pavi){
                store(PAVILION_SELECT, pavi);
            },
            isSelected: function(pavi){
                return _.isEqual(pavi,  this.selectedPavilion);
            }

        }        
    });

    store.on('pavilions', function(e){
        vm.pavilions = _.values(e.new_val);
    });

    store.on('selectedPavilion', function(e){
        vm.selectedPavilion = e.new_val;
    });


    var vm2 = new Vue({
        el: '#pavilion-layers',
        data: { selectedPavilion: store.state.selectedPavilion}
    });

    store.on('selectedPavilion', function(e){
        vm2.selectedPavilion = e.new_val;
    });
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

var DRAW_DISTANCE = 'draw-distance';
var DRAW_WALL = 'draw-wall';
var DRAW_RECT = 'draw-rect';
var DRAW_NOTE = 'draw-note';

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
    var raw_svg =   new XMLSerializer().serializeToString(svg_document); 
    var data_uri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(raw_svg)));
    
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
        raw_svg: raw_svg,
        width: width,
        height: height,
        data_uri: data_uri
    })    
}

var uiMap = function(store, map){

    var line = null;
    var tooltip = null; 
    store.on('map.drawingMode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            L.setOptions(map.editTools, {skipMiddleMarkers: true});
            line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'});   
            line.on('editable:editing', on_edit);
        }
        else {
            L.setOptions(map.editTools, {skipMiddleMarkers: false});            
        }
    });

    store.on('selectedBaseLayer.distance', function(e){
        if(!e.new_val || !e.new_val.points) {
            if(line) {
                map.removeLayer(line);
                line = null;
            }
        }
    });

    store.on('selectedBaseLayer.size_m', function(e){
        if(!line || !e.new_val) return
        var points = selectedBaseLayer(store).distance.points;
        var latLngs = points.map(function(it){
            return map.unproject(it,1);
        });
        line.disableEdit();
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(selectedBaseLayer(store).distance.length_m);
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
            store(BASE_DISTANCE_SET, {length_px: length_px, length_m:length_m, points: points});
            store(DRAWING_MODE_SET, null);
        }
    }

    function updateTooltip(length_m){
        var content = length_m + ' m';
        if(line.getTooltip())
            line.getTooltip().setLatLng(line.getCenter()).setContent(content);
        else
            line.bindTooltip(content, {permanent:true, interactive:true}); 
                
    }

    
};

function uiView(store) {
    var vm = new Vue({
        el: '#base-layer',
        template: '#base-layer-template',
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
                                store(BASE_LAYER_SET, {
                                    raw_svg: e.raw_svg,
                                    url: e.data_uri,
                                    size_m: {x: e.width, y: e.height},
                                    size_px: {x: e.width, y: e.height}
                                });
                            }
                        );
                    };
                    reader.readAsText(file);
                }
            },
            draw_line: function(){
                store(DRAWING_MODE_SET, DRAW_DISTANCE);
            },
            recalculateScale: function(){
                if(this.lineLength <= 0) return;
                store(BASE_DISTANCE_LENGTH_SET, this.lineLength);
            },
            needDrawLine: function(){
                return this.width && !this.lineLength;
            },
            needRecalculate: function(){
                var bl = selectedBaseLayer(store);
                return this.lineLength > 0 && this.lineLength != Math.round(bl.distance.length_m);
            },
            needSave: function(){
                var bl = baseLayer(store),
                    el = selectedBaseLayer(store);
                return !bl || !_.isEqual(bl.size_m, el.size_m) || !_.isEqual(bl.url, el.url);

            },
            save: function(){
                var el = selectedBaseLayer(store);
                var pavi = selectedPavilion(store);
                store(BASE_LAYER_SAVE, {base: el, pavi_id: pavi.id});
            }
        }, 
        computed: {
            widthHeight: function(){
                return this.width ? this.width + ' m / ' + this.height + ' m' : ''
            }
        }
    });

    function updateWidthHeight(e){
        var base = e.new_val;
        if(base) { 
            vm.width = Math.round(base.size_m.x);
            vm.height = Math.round(base.size_m.y);
        }
        else {
            vm.width = vm.height = null;
        }
    }

    function updateLength_m(e){
        vm.lineLength = e.new_val;
    }

    store.on('selectedBaseLayer', updateWidthHeight);
    store.on('selectedBaseLayer.distance.length_m', updateLength_m);    

    return vm;
} 

var BaseModule = function(store, map)
{
    uiView(store);
    uiMap(store, map);
};

/**
 * Function for conversions feature and types into styles and objects of leaflets
 */

/**
 * 
 */

var latLng = L.latLng;
var polyline = L.polyline;
var polygon = L.polygon;

function toPolyline(line)
{
    var poly = polyline(toLatLngs(line.points), lineStyle(line));
    poly.id = line.id;
    poly.style = line.style;
    return poly;
}

function toLine(polyline){
    return {
        points: toPoints(polyline.getLatLngs()),
        id: polyline.id,
        style: polyline.style
    }
}

function toRect(carpet){
    var poly = polygon(toLatLngs(carpet.points), rectStyle(carpet));
    poly.id = line.id;
    poly.style = line.style;
    return poly;
}

function toCarpet(polygon){
    return toLine(polygon);
}


function toLatLngs(points) {
    return points.map(function(p){ return  latLng(p[1], p[0])});
}

function toPoints(latLngs){
    return latLngs.map(function(ll){ return [ll.lng, ll.lat] });
}


function lineStyle(line){
    return {weight:2, color: 'red'}
}

function rectStyle(rect){
    return {weight:2, color: 'red'}
}

var Evented = L.Evented;
var extend = L.extend;

function editFeat(type) 
{
    var feat = null;
    var map = null;
    function enter(m) {
        map = m;
        feat = (type == 'lines') ? map.editTools.startPolyline(undefined) : map.editTools.startRectangle(undefined);
        feat.once('editable:drawing:commit', onCommit);
    }

    function exit(){
        if(feat) {
            feat.disableEdit();
            map.removeLayer(feat);
            feat = null;
        }
    }

    var e = extend( new Evented(), {enter:enter, exit:exit} );

    function onCommit(){
        var f = feat;
        exit();
        e.fire("new-feat", {feat:f, cat:type});
    }

    return e;
}

function editNote() {
    function enter() {

    }

    function exit(){

    }
    return extend( new Evented(), {enter:enter, exit:exit} );
}

var m2e = {};
m2e[DRAW_WALL] = editFeat('lines');
m2e[DRAW_RECT] = editFeat('rects');
m2e[DRAW_NOTE] = editNote();

var mode2editor = m2e;

/**
 * 
 *  overlay state 
 * {
 *      lines: {
 *          "id1": { points: [], style: {} },
 *          "id2": { points: [], style: {} },
 *      },
 *      rects: {
 *          "id1": { points: [], style: {} },
 *          "id2": { points: [], style: {} },
 *      },
 *      notes: {
 *          "id1": { topleft: [], rotate: number, text: string, style: {} },
 *          "id2": { topleft: [], rotate: number, text: string, style: {} }
 *      }
 * }
 * 
 *  
 */

var selfcheck = Selfcheck();

function uiMap$1(store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);
    var selectedFeature = null;
    var editor = null;


    lineGroup.on('click', _.partial(onFeatureClick, 'lines'));
    rectGroup.on('click', _.partial(onFeatureClick, 'rects'));
    noteGroup.on('click', _.partial(onFeatureClick, 'notes'));

    function onSelectOverlay(e){
        lineGroup.clearLayers();
        rectGroup.clearLayers();
        noteGroup.clearLayers();
        if(e.new_val) {
            var overlay = e.new_val;
            _.each(overlay.lines || {}, function(line){
                lineGroup.addLayers( toPolyline(line) );
            });
            _.each(overlay.rects || {}, function(rect){
                lineGroup.addLayers( toRect(rect) );
            });
        }
    }

    function onNewFeature(e){
        var obj = null;
        switch(e.cat){
            case 'lines':
                obj = toLine(e.feat);
                lineGroup.addLayer(e.feat);
                break;
            case 'rects':
                obj = toCarpet(e.feat);
                rectGroup.addLayer(e.feat);
                break;
            case 'notes':
                noteGroup.addLayer(e.feat);
                break;
        }
        store(OVERLAY_FEAT_ADD, {type: e.cat, feat: obj});
        store(DRAWING_MODE_SET,null);
    }

    function onFeatureClick(cat, e)
    {
        if(selectedFeature == e.layer)
            return;
        if(selectedFeature) 
            selectedFeature.disableEdit();
        selectedFeature = e.layer;
        selectedFeature.enableEdit(map);
    }

    _.values(mode2editor).forEach(function(it) { it.on('new-feat', selfcheck(onNewFeature)); });
    store.on('selectedOverlayLayer', selfcheck(onSelectOverlay));
    store.on('map.drawingMode', function(e){
        if(editor) editor.exit();
        editor = mode2editor[e.new_val];
        if(editor) editor.enter(map);
    });
}

function uiView$1(store)
{
    var SEL = {
        "line": DRAW_WALL,
        "rect": DRAW_RECT,
        "note": DRAW_NOTE
    };


    var vm = new Vue({
        el:"#overlays-layer",
        template: '#overlays-layer-template',
        data: {
            sel: null,
        },
        methods: {
            select: function(sel){ 
                store(DRAWING_MODE_SET, SEL[sel]);
            },
            cssClass: function(p){
                return p == this.sel ? 'w3-text-red'  : 'w3-text-grey';
            }
        }
    });

    store.on('map.drawingMode', function(e){
        vm.sel = _.findKey(SEL, function(it) { return it == e.new_val});
    });
}

var OverlaysModule = function(store, map){
    uiView$1(store);
    uiMap$1(store, map);
};

initComponents();


var store = Store(reducers, [RequestsMiddleware]);
store.state = initState;
window.store = store;


var map = Map('map', store);
PavilionModule(store);
BaseModule(store, map);
OverlaysModule(store, map);

store("INIT");

}());
