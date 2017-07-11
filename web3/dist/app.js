(function () {
'use strict';

var config = {
    "overlay": {
        "types": {
            "lines": {
                "1": {
                    "name": "Тонкая стена",
                    "style": {"weight":5, "color": "green"}
                },
                "2": {
                    "name": "Толстая стена",
                    "style": {"weight":10, "color": "green"}
                }
            },
            "rects": {
                "1": {
                    "name": "Ковер персидский",
                    "style": {"stroke":false, "fillOpacity": "0.5", "fillColor": "#a25203" }
                },
                "2": {
                    "name": "Ковер модерн",
                    "style": {"stroke":false, "fillOpacity": "0.5", "fillColor": "grey  " }
                }
            },
            "notes": {
                "1": {
                    "name": "Стиль текста #1",
                    "style": {"fill": "grey", "font-family":"Times", "font-size": "medium"}
                },
                "2": {
                    "name": "Стиль текста #2",
                    "style": {"fill": "red", "font-family":"Verdana", "font-size": "large", "font-style":"italic"}
                }
            }
        }
    }
};

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
            find_and_fire([], s.state, old_state, listeners);
        return s.state;
    };

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    });


    return s;
}


function find_and_fire(path, new_obj, old_obj, listeners)
{
    var visits = [ [path, new_obj, old_obj] ];
    var listeners_copy = null;

    while(visits.length) 
    {
        var v = visits.shift(),
            path = v[0],
            new_obj = v[1] || {},
            old_obj = v[2] || {};

        var props = diffs(new_obj, old_obj);
        if(props.length) { 
            listeners_copy = listeners_copy || _.clone(listeners);   
            var max_level = +_.max(_.keys(listeners_copy));
            props.forEach(function(prop){
                var o1 = new_obj[prop];
                var o2 = old_obj[prop];
                var p = path.concat([prop]);
                listeners_copy = reject_array_prop(listeners_copy, p.length, function(it){
                    if(_match(p, it.path)) {
                        it.fn({new_val: o1, old_val: o2, path: p});
                        return !_.contains(it.path, '*');
                    }
                    return false;
                });
                if(max_level > p.length)
                    visits.push([p, o1, o2]);
            });
        }
        if(_.isEmpty(listeners_copy))
            return;
    }
       
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
        },
        right: right
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
            
        for(var i in path){
            var p = path[i];
            if(_.isUndefined(obj))
                break;
            obj = obj[p];    
        }    
        return obj;
    };
    return i;
})();

function bindProp(store)
{
    var props = {};

    function listener(prop) {
        return function(e){
            prop.$val = e.new_val;
        }
    }

    store.prop = function(path){
        if(props[path])
            return props[path];

        var prop = { $val: Immutable.get(store.state, path) };
        props[path] = prop;
        store.on(path, listener(prop));
        return prop;
    };
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
                is_open: this.open == 'true'
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
        drawMode: undefined,
        size_m: undefined
    },
    selectedPavilion: undefined,
    selectedBase: undefined,
    selectedOverlay: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
        stand_categories: {},
        equipments: {} 
    },
    ui: {
        error: '',
        overlay: {
            types: {
                lines: 1,
                rects: 1,
                notes: 1
            },
            feat: undefined,
            text: 'Text label'
        }
    }
};

function drawMode(store) {
    return store.state.map.drawMode;
}

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
    return  pavi && baseById(store, pavi.id) || {};
}

function overlayLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && overlayById(store, pavi.id) || {};
}


function selectedBase(store) {
    return store.state.selectedBase  || {};
}

function selectedOverlay(store) {
    return store.state.selectedOverlay  || {};
}

function selectedOverlayId(store) {
    return (selectedOverlay(store).id || -1).toString();
}

function selectedOverlayFeat(store) {
    var feat = store.state.ui.overlay.feat;
    if(feat){
        var p = feat.split('.');
        return {cat: p[0], id: p[1]};
    }
    return null; 
}

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
var OVERLAYS_LOADED = 'OVERLAYS_LOADED';
var OVERLAY_FEAT_UPDATE = 'OVERLAY_FEAT_UPDATE';
var OVERLAY_FEAT_DELETE = 'OVERLAY_FEAT_DELETE';
var OVERLAY_FEAT_SELECT = 'OVERLAY_FEAT_SELECT';
var OVERLAY_TYPE_SELECT = 'OVERLAY_TYPE_SELECT';
var OVERLAY_SAVE = 'OVERLAY_SAVE';
var OVERLAY_SAVED = 'OVERLAY_SAVED';


var ERROR_SET = 'ERROR_SET';

var errorReducer = function(state, action){
    switch(action.type){
        case ERROR_SET:
            return Immutable.set(state, 'ui.error', action.payload);
    }
    state = Immutable.set(state, 'ui.error');
    return state;
};

var mapReducer = function(state, action)
{
    switch(action.type){
        case DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawMode', mode);

    }
    return state;
};

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
                state = Immutable.set(state, 'selectedBase');
                state = Immutable.set(state, 'selectedOverlay');
                state = Immutable.set(state, 'ui.overlay.feat');
            }
            return state;

        case PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            state = Immutable.set(state, 'selectedBase', {id:pavi.id});
            return state;

        case PAVILION_SELECT:
            var pavi = action.payload;
            state = Immutable.set(state, 'selectedPavilion', pavi);
            if(pavi) {
                var base = state.entities.bases[pavi.id] || {id: pavi.id};
                state = Immutable.set(state, 'selectedBase', base);
                state = Immutable.set(state, str('entities.bases.',pavi.id), base);                
                state = Immutable.set(state, 'map.size_m', base.size_m);
                var overlay = state.entities.overlays[pavi.id] || {id:pavi.id};
                state = Immutable.set(state, 'selectedOverlay', overlay);
                state = Immutable.set(state, str('entities.overlays.',pavi.id), overlay);
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
            state = Immutable.extend(state, 'selectedBase', base);
            return Immutable.set(state, 'map.size_m', base.size_m);
        
        case BASE_DISTANCE_LENGTH_SET:
            var length_m = action.payload;
            var ratio =  length_m / state.selectedBase.distance.length_m;
            var size_m = state.selectedBase.size_m;
            size_m = {
                x: size_m.x * ratio,
                y: size_m.y * ratio
            };
            state = Immutable.set(state, 'map.size_m', size_m);
            state = Immutable.set(state, 'selectedBase.size_m', size_m );
            return Immutable.set(state, 'selectedBase.distance.length_m', length_m);             
        
        case BASE_DISTANCE_SET: 
            var distance = action.payload;
            return Immutable.set(state, 'selectedBase.distance', distance);

        case BASE_LAYER_SAVED:
            var base = action.payload;
            if(state.pavilions[base.id]) {
                state = Immutable.set(state, 'entities.bases.'+base.id, base);
                if(state.selectedPavilion && base.id == state.selectedPavilion.id)
                    state = Immutable.set(state, 'selectedBase', base);
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
        case OVERLAYS_LOADED:
            return Immutable.set(state, 'entities.overlays', action.payload);

        case OVERLAY_FEAT_ADD: 
            var cat = action.payload.cat;
            var feat = action.payload.feat;
            feat = _.extend({}, feat, {
                id: generateId(state, 'selectedOverlay.'+cat),
                type: state.ui.overlay.types[cat]
            });
            if(cat == 'notes'){
                feat = _.extend({}, feat, {text: state.ui.overlay.text});
            }
            state = Immutable.set(state, 'ui.overlay.feat', str(cat,'.',feat.id));
            return Immutable.set(state, str('selectedOverlay.',cat,'.',feat.id), feat);

        case OVERLAY_FEAT_UPDATE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.set(state, 'selectedOverlay.'+type+'.'+feat.id, feat);

        case OVERLAY_FEAT_DELETE: 
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            state = Immutable.remove(state, 'selectedOverlay.'+cat+'.'+id);
            return Immutable.remove(state, 'ui.overlay.feat');

        case OVERLAY_FEAT_SELECT:
            var feat_id = action.payload;
            if(feat_id) {
               var p = feat_id.split('.'),
                   cat = p[0],
                   id = +p[1];
                var feat = state.selectedOverlay[cat][id];
                state = Immutable.set(state, str('ui.overlay.types.',cat), feat.type);
            }
            return Immutable.set(state, 'ui.overlay.feat', feat_id);
        
        case OVERLAY_TYPE_SELECT:
            var p = action.payload;
            state = Immutable.set(state, str('ui.overlay.types.',p.feat.cat), p.type_id);
            return Immutable.set(state, str('selectedOverlay.',p.feat.cat,'.',p.feat.id, '.type'),  p.type_id)

        case OVERLAY_SAVED:
            var overlay = action.payload;
            if(state.pavilions[overlay.id]) {
                state = Immutable.set(state, 'entities.overlays.'+overlay.id, overlay);
                if(state.selectedPavilion && overlay.id == state.selectedPavilion.id)
                    state = Immutable.extend(state, 'selectedOverlay', overlay);
            }
            else {
                state = Immutable.remove(state, 'entities.overlays.'+overlay.id);
            }
            return state;
    }
    return state;
};



var reducers = reduceReducers([errorReducer, mapReducer, pavilionReducer, baseReducer, overlayReducer]);


function generateId(state, path){
    var ids = _.keys( Immutable.get(state, path) || {} );
    return ids.length ? +_.max(ids) + 1 : 1;
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

                    d3.json('/overlays/')
                      .get(function(bases){
                            store(OVERLAYS_LOADED, bases);
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
                            if(er) store(ERROR_SET, er.target.responseText);
                            else {
                                var res = JSON.parse(xhr.responseText);
                                base_layer = _.extend({}, base_layer, res);
                                store(BASE_LAYER_SAVED, base_layer);
                            }
                        });
                    break;

                case OVERLAY_SAVE:
                    var overlay = action.payload;
                    d3.request('/pavilions/'+overlay.id+'/overlay/')
                        .mimeType("application/json")
                        .send('POST', JSON.stringify(overlay), function(er, xhr){
                            if(er) store(ERROR_SET, er.target.responseText || 'Connection error');
                            else {
                                var res = JSON.parse(xhr.responseText);
                                overlay = _.extend({}, overlay, res);
                                store(OVERLAY_SAVED, overlay);
                            }
                        });
                    break;


                    
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
    store.on('map.size_m', function(e) { updateMapSize(e.new_val); });
    return map$1;
};

var map$1  = null;
var gridPanel = null;

function updateMapSize(size_m)
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
    return bounds;
}

var PavilionModule = function (store) 
{
    var vm = new Vue({
        el: "#pavilion",
        template: '#pavilion-template',
        data: {
            pavilions: store.prop('pavilions'),
            selectedPavilion: store.prop('selectedPavilion')
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
                return _.isEqual(pavi,  this.selectedPavilion.$val);
            }

        }        
    });

    var vm2 = new Vue({
        el: '#pavilion-layers',
        data: { 
            selectedPavilion: store.prop('selectedPavilion'),
            hasBase: store.prop('selectedBase.url')
        }
    });

    var vm3 = new Vue({
        el: '#error',
        data: { error: store.prop('ui.error') }
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

var hidenElement = null;

function getHidenEl(){
    if(hidenElement)
        return hidenElement;
    hidenElement = document.createElement("div");    
    hidenElement.style = 'visibility: hidden; position: absolute; top:0; left:0;';
    hidenElement = document.body.appendChild(hidenElement);
    return hidenElement;
}

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

var BaseMapView = function (store, map)
{
    var baseLayer$$1 = null;

    store.on('selectedBase.url', function(e){
        var url = e.new_val;        
        if(baseLayer$$1) {
            map.removeLayer(baseLayer$$1);
            baseLayer$$1 = null;
        }
        if(url) {
            var size_m = selectedBase(store).size_m;
            var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer$$1 = L.imageOverlay(url, bounds, {crossOrigin: true}).addTo(map);
            map.fitBounds(bounds);
        }
    });

    store.on('selectedBase.size_m', function(e){
        var size_m = e.new_val;
        if(baseLayer$$1 && size_m) {
            var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer$$1.setBounds(bounds);    
        }
    });
};

var BaseMapDistance = function(store, map){

    var line = null;
    var tooltip = null; 
    store.on('map.drawMode', function(e)
    {
        if(e.new_val == DRAW_DISTANCE)
        {
            L.setOptions(map.editTools, {skipMiddleMarkers: true});
            line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'});   
            line.on('editable:editing', on_edit);
        }
        else if(e.old_val == DRAW_DISTANCE) {
            L.setOptions(map.editTools, {skipMiddleMarkers: false});            
        }
    });

    store.on('selectedBase.distance', function(e){
        if(!e.new_val || !e.new_val.points) {
            if(line) {
                line.disableEdit();
                map.removeLayer(line);
                line = null;
            }
        }
    });

    store.on('selectedBase.size_m', function(e){
        if(!line || !e.new_val || !selectedBase(store).distance) return
        var points = selectedBase(store).distance.points;
        var latLngs = points.map(function(it){
            return map.unproject(it,1);
        });
        line.disableEdit();
        line.setLatLngs(latLngs);
        line.enableEdit(map);
        updateTooltip(selectedBase(store).distance.length_m);
    });

    function on_edit(event)
    {
        var line = event.layer;
        if(line.getLatLngs().length == 2) 
        {
            var latLngs = line.getLatLngs();
            map.editTools.commitDrawing();
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

function BaseView(store) {
    var vm = new Vue({
        el: '#base-layer',
        template: '#base-layer-template',
        data: {
            width: null, height: null,
            lineLength: null,
            error: '',
            selectedBase: store.prop('selectedBase')
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
                return this.selectedBase.$val && !this.selectedBase.$val.distance;
            },
            needRecalculate: function(){
                var sb = this.selectedBase.$val;
                return sb && this.lineLength > 0 && this.lineLength != Math.round(sb.distance.length_m);
            },
            needSave: function(){
                var bl = baseLayer(store),
                    sb = this.selectedBase.$val;
                return sb &&  (!_.isEqual(bl.size_m, sb.size_m) || !_.isEqual(bl.url, sb.url));

            },
            save: function(){
                store(BASE_LAYER_SAVE, {base: this.selectedBase.$val});
            }
        }, 
        computed: {
            widthHeight: function(){
                var sb = this.selectedBase.$val;
                return sb && sb.size_m ? Math.round(sb.size_m.x) + ' m / ' + Math.round(sb.size_m.y) + ' m' : ''
            }
        }
    });

    // function updateWidthHeight(e){
    //     var base = e.new_val;
    //     if(base && base.size_m) { 
    //         vm.width = Math.round(base.size_m.x);
    //         vm.height = Math.round(base.size_m.y);
    //     }
    //     else {
    //         vm.width = vm.height = null;
    //     }
    // }

    function updateLength_m(e){
        vm.lineLength = e.new_val;
    }

    // store.on('selectedBase', updateWidthHeight);
    store.on('selectedBase.distance.length_m', updateLength_m);    

    return vm;
} 

var BaseModule = function(store, map)
{
    BaseView(store);
    BaseMapView(store, map);
    BaseMapDistance(store, map);
};

// A quick extension to allow image layer rotation.
var RotateImageOverlay = L.ImageOverlay.extend({
    options: {rotation: 0},
    _animateZoom: function(e){
        L.ImageOverlay.prototype._animateZoom.call(this, e);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    },
    _reset: function(){
        L.ImageOverlay.prototype._reset.call(this);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    }
});

function rotateImageOverlay(url, bounds, options) {
    return new RotateImageOverlay(url, bounds, options);
}

function isRotateImage(obj){
    return obj instanceof RotateImageOverlay;
}

function textDocument(text, style)
{
    style = style || {};
    'Times, serif';
    return str('<?xml version="1.0" encoding="utf-8"?>',
               '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
               '<text x="0" y="20" fill="{fill}" font-family="{font-family}" ',
               'font-style="{font-style}" font-size="{font-size}">{text}</text>',
                '</svg>').replace('{fill}', style.fill || 'grey')
                         .replace('{font-family}', style['font-family'] || 'Times')
                         .replace('{font-size}', style['font-size'] || '1pt')
                         .replace('{font-style}', style['font-style'] || 'normal')
                         .replace('{text}', text);
}

var OverlayMapView = function(config, store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var cat2group = {
        lines: {group: lineGroup, toLayer: toPolyline},
        rects: {group: rectGroup, toLayer: toLeafletRect},
        notes: {group: noteGroup, toLayer: _.partial(toNote, map)}
    };

    var cat2layers = {
        lines: {},
        rects: {},
        notes: {},
    };

    function updateGroup(cat, e){
        var features = e.new_val || [];
        var group = cat2group[cat].group;
        var toLayer = cat2group[cat].toLayer; 
        var overlay_id = selectedOverlayId(store);
        var the_layers = _.clone(cat2layers[cat]);
        _.mapObject(features, function(feat, id){
            var layer_id = str(overlay_id, '.', id);
            if(the_layers[layer_id]) {
                delete the_layers[layer_id];
            }
            else {
                var style = config.overlay.types[cat][feat.type].style;
                var layer = toLayer(layer_id, feat, style); 
                group.addLayer(layer);
                cat2layers[cat][layer_id] = layer;
            }
        });
        _.mapObject(the_layers, function(layer, id){
            group.removeLayer(layer);
            delete cat2layers[cat][id];
        });
    }

    store.on('selectedOverlay.lines', _.partial(updateGroup, 'lines') );
    store.on('selectedOverlay.rects', _.partial(updateGroup, 'rects') );

    function updateStyles(cat, e)
    {
        var id = e.path[2],
            type = e.new_val;
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', id);
        var layes = cat2layers[cat];
        if(layes[layer_id]){
            var style = config.overlay.types[cat][type].style;
            layes[layer_id].setStyle(style);
        }
    }

    function updateNotes(e)
    {
        var id = e.path[2];
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', id);
        var layers = cat2layers.notes;
        if(e.old_val && layers[layer_id]) {
            cat2group.notes.group.removeLayer(layes[layer_id]);
            delete layers[layer_id];
        } 
        if(e.new_val) {
            var note = e.new_val;
            var style = config.overlay.types.notes[note.type].style;
            var layer = toNote(map, layer_id, note, style);
            cat2group.notes.group.addLayer(layer);            
            layers[layer_id] = layer;
        }
    }

    store.on('selectedOverlay.lines.*.type', _.partial(updateStyles, 'lines') );
    store.on('selectedOverlay.rects.*.type', _.partial(updateStyles, 'rects') );
    store.on('selectedOverlay.notes.*.*', updateNotes );

    return {cat2group: cat2group, cat2layers:cat2layers};
};

function toPolyline(id, line, style)
{
    var poly = L.polyline(toLatLngs(line.points), style);
    poly.id = id;
    return poly;
}

function toLeafletRect(id, rect, style){
    var poly = L.rectangle(toLatLngs(rect.points), style);
    poly.id = id;
    return poly;
}

function toNote(map, id, note, style)
{
    var svg_text = textDocument(note.text, style);
    var d = svgToBase64(svg_text).right;
    var rb = map.latLngToContainerPoint(note.topLeft).add({x: d.width, y: d.height});
    var rightBottom = map.containerPointToLatLng(rb); 
    var layer = rotateImageOverlay(d.data_uri, [note.topLeft, rightBottom], {rotate: note.rotate});
    layer.id = id;
    return layer;
}


function toLatLngs(points) {
    return points.map(function(p){ return  L.latLng(p[1], p[0])});
}

var OverlaySelectTools = function(config, store, map, overlayMapView)
{
    var tooltipContent = document.getElementById('overlay-tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; };

    var cat2group = overlayMapView.cat2group;
    var cat2layers = overlayMapView.cat2layers;

    function onDeleteFeat(){
        store(OVERLAY_FEAT_DELETE);
    }

    function onFeatClick(cat, e){
        var layer_id = e.layer.id.split('.'),
            feat_id = str(cat,'.',layer_id[1]);
        store(OVERLAY_FEAT_SELECT, feat_id);
        closeTooltip(tooltip);         
    }

    function onFeatContext(cat, e){
        onFeatClick(cat, e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        L.DomEvent.on($delete(), 'click', onDeleteFeat);
    }

    function closeTooltip(){
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onDeleteFeat);
        }
    }

    _.mapObject(cat2group, function(val, cat){
        val.group.on('click', _.partial(onFeatClick, cat));
    });

    
    _.mapObject(cat2group, function(val, cat){
        val.group.on('contextmenu', _.partial(onFeatContext, cat));
    });

    store.on('ui.overlay.feat', closeTooltip);
    // map.on('click', closeTooltip);

  
};

var OverlayDrawing = function(store, map, overlayMapView)
{
    var editor = null;
    var selectedLayer = null;
    var cat2layers = overlayMapView.cat2layers;


    var m2e = {};
    m2e[DRAW_WALL] = editFeat('lines', store, map);
    m2e[DRAW_RECT] = editFeat('rects', store, map);
    // m2e[m.DRAW_NOTE] = editNote(store, map)

    function updateSelectedLayer(e){
        if(selectedLayer) {
            if(!isRotateImage(selectedLayer))
                selectedLayer.disableEdit();
            selectedLayer = null;
        }
        var feat_path = e.new_val;
        if(feat_path){
            var feat = selectedOverlayFeat(store);
            var overlay_id = selectedOverlayId(store);
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer) {
                L.setOptions(map.editTools, {skipMiddleMarkers: feat.cat !== 'lines', draggable: true});
                selectedLayer.enableEdit(map);      
            }
        }
    }

    function onDrawMode(e) {
        if(editor) editor.exit();
        editor = m2e[e.new_val];
        if(editor) {
            editor.enter();
            store(OVERLAY_FEAT_SELECT);
        }
    }


    store.on('map.drawMode', onDrawMode);
    store.on('ui.overlay.feat', updateSelectedLayer);
};


function editFeat(cat, store, map) 
{
    var layer = null;
    function enter(m) {
        layer = (cat == 'lines') ? map.editTools.startPolyline(undefined) : map.editTools.startRectangle(undefined);
        layer.once('editable:drawing:commit', onCommit);
    }

    function exit()
    {
        layer.disableEdit();
        map.removeLayer(layer);
    }

    function onCommit(){
        var checkDist = 1;
        _.reduce(_.flatten(layer.getLatLngs()), function(l1,l2){
            var d = l1.distanceTo(l2);
            if(d < checkDist) checkDist = d;
            return l2;
        });
        if(checkDist == 1) {
            var feat =  { points: toPoints(layer.getLatLngs())};
            store(OVERLAY_FEAT_ADD, {feat: feat, cat: cat});
        }
        store(DRAWING_MODE_SET);
    }
    return {enter:enter, exit:exit};
}

function toPoints(latLngs){
    var f = L.Util.formatNum;
    latLngs = _.flatten(latLngs);
    return latLngs.map(function(ll){ return [f(ll.lng,2), f(ll.lat,2)] });
}

function OverlayView(config, store)
{
    var MODES = {
        "lines": DRAW_WALL,
        "rects": DRAW_RECT,
        "notes": DRAW_NOTE
    };


    var vm = new Vue({
        el:"#overlays-layer", 
        template: '#overlays-layer-template',
        data: {
            mode: null,
            selectedOverlay: store.prop('selectedOverlay'),
            types: {
                lines: {
                    sel: store.prop('ui.overlay.types.lines'),
                    list: config.overlay.types.lines 
                },
                rects: {
                    sel: store.prop('ui.overlay.types.rects'),
                    list: config.overlay.types.rects 
                },
                notes: {
                    sel: store.prop('ui.overlay.types.notes'),
                    list: config.overlay.types.notes
                }
            },
            type: null,
        },
        methods: { 
            select: function(mode){ 
                var m = MODES[mode];
                store(DRAWING_MODE_SET, drawMode(store) == m ? undefined : m );
            },
            cssClass: function(p){
                return p == this.mode ? 'w3-border-blue  w3-border'  : '';
            },
            needSave: function(){
                var so = this.selectedOverlay.$val;
                return so && !_.isEqual(overlayLayer(store), so);
            },
            save: function(){
                var o = this.selectedOverlay.$val;
                store(OVERLAY_SAVE, o);
                this.selectedOverlay.$val = null;
            }
        }
    });

    store.on('map.drawMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });

    store.on('ui.overlay.feat', function(){
        var feat = selectedOverlayFeat(store);
        vm.type = feat ? vm.types[feat.cat] : null;
    });

    vm.$watch('type.sel.$val', function(val){
        if(val) {
            var feat = selectedOverlayFeat(store);
            store(OVERLAY_TYPE_SELECT, {feat: feat, type_id: val});
        }
    });
}

var OverlaysModule = function(config, store, map){
    OverlayView(config, store);
    var omv = OverlayMapView(config, store, map);
    OverlaySelectTools(config, store, map, omv);
    OverlayDrawing(store, map, omv);
};

initComponents();


var store = Store(reducers, [RequestsMiddleware]);
bindProp(store);
store.state = initState;
window.store = store;


var map = Map('map', store);
PavilionModule(store);
BaseModule(store, map);
OverlaysModule(config, store, map);

store("INIT");

}());
