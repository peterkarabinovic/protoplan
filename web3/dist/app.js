(function () {
'use strict';

var config = {
    "overlay": {
        "types": {
            "lines": {
                "1": {
                    "name": "Тонкая стена",
                    "style": {"weight":5, "color": "red"}
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
                    "style": {"stroke":false, "fillOpacity": "1", "fillColor": "blue" }
                }
            },
            "notes": {
                "1": {
                    "name": "Стиль текста #1",
                    "style": {"fill": "grey", "fontFamily":"Times", "fontSize": "medium"}
                },
                "2": {
                    "name": "Стиль текста #2",
                    "style": {"fill": "red", "fontFamily":"Verdana", "fontSize": "large", "fontStyle":"italic"}
                }
            }
        }
    },
    "stands": {
        "types":{
            "1": {
                "name": "Стенд категории 1",
                "style": {"fillColor": "green", "color": "green", "fillOpacity": 1 }
            },
            "2": {
                "name": "Стенд категории 2",
                "style": {"fillColor": "lightblue", "color": "darkblue", "fillOpacity": 1}
            },
            "3": {
                "name": "Стенд категории 3",
                "style": {"fillColor": "red", "color": "red", "fillOpacity": 1 }
            },
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

    var listeners = [];
    var listener_table = {};
    var lastId = 0;
    function stamp(fn){ 
        fn._redux_id = fn._redux_id || ++lastId;
        return fn._redux_id;
    }

    s.on = function(path, fn){
        var paths = path.split(' ');
        paths.forEach(function(p){
            var pp = p.trim().split('.');
            var listener_id = p + '.' + stamp(fn);
            listeners.push(listener_id);
            listener_table[listener_id] = {path:pp, fn:fn} ;
        });
    };

    s.off = function(path, fn){
        var paths = path.split(' ');
        var ids = paths.map(function(p){
            var listener_id = p.trim() + '.' + stamp(fn);
            delete listener_table[listener_id];
            return listener_id;
        });
        listeners = _.difference(listeners, ids);
        
    };

    s.dispatch = function(action){
        var old_state = s.state;
        s.state = reducers(s.state, action);
        if(s.state !== old_state) {
            var ef = events_finder(s.state, old_state);
            listeners.forEach(function(id){
                var li = listener_table[id];
                if(li) // the listener may be 'off' in handler function
                    ef(li.path).forEach(function(e){
                        li.fn(e);
                    });
            });
        }
        return s.state;
    };

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    });


    return s;
}

function events_finder(new_obj, old_obj)
{
    if(new_obj === old_obj)
        return function() {return [];}
    var _changes = diff_props(new_obj, old_obj);
    function events(changes, nobj, oobj, path)
    {
        if(_.isEmpty(oobj) && _.isEmpty(nobj))
            return [];
        nobj = nobj || {};
        oobj = oobj || {};
        if(_.isEmpty(changes))
            _.extend(changes, diff_props(nobj, oobj));

        var prop = path[0];
        var rect = path.slice(1);        
        if(prop === '*')
        {
            var _events = [];
            for(var key in changes){
                var ch = changes[key];
                if(ch) {
                    ch.nobj = ch.nobj || nobj[key];
                    ch.oobj = ch.oobj || oobj[key];
                    ch.changes = ch.changes || {};
                    if(path.length === 1)
                        _events.push({
                            path: [key],
                            new_val: ch.nobj,
                            old_val: ch.oobj
                        });
                    else 
                    {
                        events(ch.changes, ch.nobj, ch.oobj, rect).forEach(function(e){
                            e.path.unshift(key);
                            _events.push(e);
                        });
                    }
                }
            }
            return _events;
        }
        else if(changes[prop]){
            var ch = changes[prop];
            ch.nobj = ch.nobj || nobj[prop];
            ch.oobj = ch.oobj || oobj[prop];
            ch.changes = ch.changes || {};
            if(path.length == 1)
                return [{path: [prop], new_val: ch.nobj, old_val: ch.oobj}]
            else
                return events(ch.changes, ch.nobj, ch.oobj, rect).map(function(e){
                    e.path.unshift(prop);
                    return e;
                })
        }
        else 
            return [];
    }

    return function(path)
    {
        return events(_changes, new_obj, old_obj, path)

    }
}

function diffs(new_obj, old_obj, keys)
{
    return keys.reduce(function(diffs, key){
        return _.isEqual(new_obj[key], old_obj[key]) ? diffs : diffs.concat(key);
    },[]);
}


function diff_props(nobj, oobj){
    if(!_.isObject(nobj))
        nobj = {};
    if(!_.isObject(oobj))
        oobj = {};
    var props = _.uniq( Object.keys(nobj).concat( Object.keys(oobj) ) );
    var diff_props = diffs(nobj, oobj, props).sort();
    return _.reduce(props, function(memo, prop){
        var i = _.indexOf(diff_props, prop, true);
        if(i !== -1) {
            diff_props.splice(i,1);
            memo[prop] = {};
        }
        else {
            memo[prop] = null;
        }
        return memo;
    }, {})
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

function toLatLngs(points) {
    return points.map(function(p){ return  L.latLng(p[1], p[0])});
}

function toPoints(latLngs){
    var f = L.Util.formatNum;
    latLngs = _.flatten(latLngs);
    return latLngs.map(function(ll){ return [f(ll.lng,2), f(ll.lat,2)] });
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
    selectedStandsId: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
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
            text: 'Text label',
            edit: false
        },
        stands: {
            type: 1,
            sel: undefined,
            edit: false
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
var standsById = _.partial(entity, 'stands');

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
        var f = {cat: p[0], id: p[1]};
        feat = store.state.selectedOverlay[f.cat][f.id];
        return _.extend(f, feat);
    }
    return null; 
}

function selectedOverlayText(store){
    return store.state.ui.overlay.text;
}
function overlayNoteType(store){
    return store.state.ui.overlay.types.notes;
}

function selectedStandsId(store) {
    return store.state.selectedStandsId;
}

function selectedStands(store){
    var id = store.state.selectedStandsId;
    return standsById(store, id); 
}

function selectedStand(store){
    var stands_id = store.state.selectedStandsId;
    var id = store.state.ui.stands.sel;
    return standsById(store, stands_id)[id]; 
}

var INIT = 'INIT';

var UNSELECT_ALL = 'UNSELECT_ALL';

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
var OVERLAY_FEAT_ROTATE = 'OVERLAY_FEAT_ROTATE';
var OVERLAY_FEAT_TEXT = 'OVERLAY_FEAT_TEXT';
var OVERLAY_ROLLBACK = 'OVERLAY_ROLLBACK';
var OVERLAY_SAVE = 'OVERLAY_SAVE';
var OVERLAY_SAVED = 'OVERLAY_SAVED';
var OVERLAY_FEAT_SELECT = 'OVERLAY_FEAT_SELECT';
var OVERLAY_EDIT = 'OVERLAY_EDIT';
var OVERLAY_TYPE_SELECT = 'OVERLAY_TYPE_SELECT';

var STANDS_LOADED = 'STANDS_LOADED';
var STAND_ADD = 'STAND_ADD';
var STAND_ADDED = 'STAND_ADDED';

var STAND_UPDATED = 'STAND_UPDATED';
var STAND_DELETE = 'STAND_DELETE';
var STAND_DELETED = 'STAND_DELETED';
var STAND_SELECT = 'STAND_SELECT';
var STAND_EDIT = 'STAND_EDIT';
var STAND_TYPE_UPDATE = 'STAND_TYPE_UPDATE';
var STAND_POINTS_UPDATE = 'STAND_POINTS_UPDATE';


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
        
        case UNSELECT_ALL:
            state = Immutable.remove(state, 'ui.overlay.feat');
            state = Immutable.remove(state, 'ui.stands.sel');
            return state;

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
                state = Immutable.remove(state, 'entities.overlays.'+pavi.id);
                state = Immutable.remove(state, 'entities.stands.'+pavi.id);
            }
            if(state.selectedPavilion && state.selectedPavilion.id == pavi_id) {
                state = Immutable.set(state, 'selectedPavilion');
                state = Immutable.set(state, 'selectedBase');
                state = Immutable.set(state, 'selectedOverlay');
                state = Immutable.set(state, 'selectedStandsId');
                state = Immutable.set(state, 'ui.overlay.feat');
                state = Immutable.set(state, 'ui.stands.feat');
            }
            return state;

        case PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            state = Immutable.set(state, 'selectedBase', {id:pavi.id});
            state = Immutable.set(state, 'selectedStandsId', pavi.id);
            // state = Immutable.extend(state, 'entities.stands.'+pavi.id, {id: pavi.id});
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
                state = Immutable.set(state, 'selectedStandsId', pavi.id);
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
            state = Immutable.remove(state, 'ui.stands.sel');
            state = Immutable.set(state, 'ui.overlay.feat', str(cat,'.',feat.id));
            return Immutable.set(state, str('selectedOverlay.',cat,'.',feat.id), feat);

        case OVERLAY_FEAT_UPDATE: 
            var cat = action.payload.cat;
            var feat = action.payload.feat;
            return Immutable.extend(state, 'selectedOverlay.'+cat+'.'+feat.id, feat);

        case OVERLAY_FEAT_DELETE: 
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            state = Immutable.remove(state, 'selectedOverlay.'+cat+'.'+id);
            return Immutable.remove(state, 'ui.overlay.feat');

        case OVERLAY_FEAT_ROTATE:
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            var angle = state.selectedOverlay[cat][id].rotate;
            var da = Math.PI / 4;
            return Immutable.set(state, str('selectedOverlay.',cat,'.',id,'.rotate'), (angle-da) % (2*Math.PI));

        case OVERLAY_FEAT_TEXT:
            var feat = action.payload;
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            return Immutable.extend(state, str('selectedOverlay.',cat,'.',id), feat);

        case OVERLAY_FEAT_SELECT:
            var feat_id = action.payload;
            if(feat_id) {
               var p = feat_id.split('.'),
                   cat = p[0],
                   id = +p[1];
                var feat = state.selectedOverlay[cat][id];
                state = Immutable.remove(state, 'ui.stands.sel');
                state = Immutable.set(state, str('ui.overlay.types.',cat), feat.type);
            }
            else
                return Immutable.set(state, 'ui.overlay.edit')    
            return Immutable.set(state, 'ui.overlay.feat', feat_id);

        case OVERLAY_EDIT:
            var edit = action.payload;
            return Immutable.set(state, 'ui.overlay.edit', edit)
        
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
                state = Immutable.remove(state, 'ui.overlay.feat');
            }
            else {
                state = Immutable.remove(state, 'entities.overlays.'+overlay.id);
            }
            return state;

        case OVERLAY_ROLLBACK:
            var overlay = state.selectedOverlay;
            overlay = state.entities.overlays[overlay.id];
            state = Immutable.set(state, 'selectedOverlay', overlay);
            return Immutable.remove(state, 'ui.overlay.feat');

    }
    return state;
};

var standsReducer = function(state, action){
    switch(action.type){
        case STANDS_LOADED:
            var stands = action.payload;
            return Immutable.set(state,'entities.stands', stands);

        case STAND_ADDED:
            var stand = action.payload.stand;
            var stands_id = action.payload.stands_id;
            return Immutable.set(state,str('entities.stands.',stands_id,'.',stand.id), stand);
            // return Immutable.set(state, 'ui.stands.sel', stand.id)

        case STAND_UPDATED:
            var stand = action.payload.stand;
            var stands_id = action.payload.stands_id;
            if(state.entities.stands[stands_id]) {
                state = Immutable.set(state,str('entities.stands.',stands_id,'.',stand.id), stand);
                state = Immutable.set(state, 'ui.stands.sel', stand.id);
            }
            console.log('STAND_UPDATED');
            return state;
        
        case STAND_DELETED:
            var stand_id = action.payload.stand_id;
            var stands_id = action.payload.stands_id;
            if(stand_id == state.ui.stands.sel)
                state = Immutable.remove(state, 'ui.stands.sel');
            return Immutable.remove(state,str('entities.stands.',stands_id,'.',stand_id));

        case STAND_SELECT:
            var stand_id = action.payload;
            if(stand_id) {
                var stands_id = state.selectedStandsId;
                var stand = state.entities.stands[stands_id][stand_id];
                state = Immutable.set(state, 'ui.stands.type', stand.type);
            }
            state = Immutable.remove(state, 'ui.overlay.feat');
            return Immutable.set(state, 'ui.stands.sel', stand_id);
        
        case STAND_EDIT:
            var edit = action.payload;
            return Immutable.set(state, 'ui.stands.edit', edit);

        case STAND_TYPE_UPDATE:
            var type = action.payload.type;
            return Immutable.set(state, 'state.ui.stands.type', type);
        
            

        
            
    }
    return state;
};

var reducers = reduceReducers([errorReducer, mapReducer, pavilionReducer, baseReducer, overlayReducer, standsReducer]);


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
                    d3.json('pavilions/')
                      .get(function(pavilions){
                            store(PAVILIONS_LOADED, pavilions);
                      }); 

                    d3.json('bases/')
                      .get(function(bases){
                            store(BASES_LOADED, bases);
                      });

                    d3.json('overlays/')
                      .get(function(bases){
                            store(OVERLAYS_LOADED, bases);
                      });

                    d3.json('stands/')
                      .get(function(stands){
                            store(STANDS_LOADED, stands);
                      });

                    break;

                case PAVILION_ADD:
                    var pavi = action.payload;
                    d3.request('pavilions/0')
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
                    d3.request('pavilions/'+id+'|delete')
                      .post(function(er, xhr){
                            if(er) store(ERROR_SET, er);
                            else store(PAVILION_DELETED, id);
                      });
                    break;

                case BASE_LAYER_SAVE:
                    var base_layer = _.clone(action.payload.base);
                    delete base_layer['distance'];
                    delete base_layer['raw_svg'];
                    d3.request('pavilions/'+base_layer.id+'/base/')
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
                    d3.request('pavilions/'+overlay.id+'/overlay/')
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

                case STAND_ADD:
                    var stand = action.payload;
                    var stands_id = selectedStandsId(store);
                    d3.request('stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(ERROR_SET, er.target.responseText || 'Connection error');
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(STAND_ADDED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                      });
                    break;

                case STAND_TYPE_UPDATE:
                    var type = action.payload.type;
                    var stand = action.payload.stand;
                    stand = Immutable.set(stand, 'type', type);
                    var stands_id = selectedStandsId(store);
                    d3.request('stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(ERROR_SET, er.target.responseText || 'Connection error');
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(STAND_UPDATED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                    });
                    break;
                
                case STAND_POINTS_UPDATE:
                    var stand = action.payload.stand;
                    var points = action.payload.points;
                    stand = Immutable.set(stand, 'points', points);
                    var stands_id = selectedStandsId(store);
                    d3.request('stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(ERROR_SET, er.target.responseText || 'Connection error');
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(STAND_UPDATED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                    });
                    break;

                case STAND_DELETE:
                    var stand = action.payload;
                    var stands_id = selectedStandsId(store);
                    d3.request('stands/'+stands_id+'/'+stand.id+'|delete')
                      .mimeType("application/json")
                      .get(function(er, xhr){
                            if(er) store(ERROR_SET, er);
                            else {
                                var res = JSON.parse(xhr.responseText);
                                store(STAND_DELETED, {
                                    stands_id: res.stands_id,
                                    stand_id: res.stand_id
                                });
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
            .style('z-index', "399");

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

    var gradation = 0.5;

    map.snap = function(latlng){
        latlng.lat = Math.round(latlng.lat / gradation) * gradation; 
        latlng.lng = Math.round(latlng.lng / gradation) * gradation; 
        return latlng;
    };
    

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
        
        // gradation = d3.tickStep(b.getWest(), b.getEast(), ticks[0]) 
        // console.log('gradation', gradation)
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
    window.map = map$1;

    gridPanel = GridPanel(map$1);

    map$1.on('click', function(){
        store(UNSELECT_ALL);
    });
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
var DRAW_STAND1 = 'draw-stand-1';
var DRAW_STAND2 = 'draw-stand-2';
var DRAW_STAND3 = 'draw-stand-3';
var DRAW_STAND4 = 'draw-stand-4';

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
                                    size_m: {x: Math.round(e.width), y: Math.round(e.height)},
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

/**
 * @class  L.Matrix
 *
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @param {Number} d
 * @param {Number} e
 * @param {Number} f
 */
L.Matrix = function(a, b, c, d, e, f) {

  /**
   * @type {Array.<Number>}
   */
  this._matrix = [a, b, c, d, e, f];
};


L.Matrix.prototype = {


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  transform: function(point) {
    return this._transform(point.clone());
  },


  /**
   * Destructive
   *
   * [ x ] = [ a  b  tx ] [ x ] = [ a * x + b * y + tx ]
   * [ y ] = [ c  d  ty ] [ y ] = [ c * x + d * y + ty ]
   *
   * @param  {L.Point} point
   * @return {L.Point}
   */
  _transform: function(point) {
    var matrix = this._matrix;
    var x = point.x, y = point.y;
    point.x = matrix[0] * x + matrix[1] * y + matrix[4];
    point.y = matrix[2] * x + matrix[3] * y + matrix[5];
    return point;
  },


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  untransform: function (point) {
    var matrix = this._matrix;
    return new L.Point(
      (point.x / matrix[0] - matrix[4]) / matrix[0],
      (point.y / matrix[2] - matrix[5]) / matrix[2]
    );
  },


  /**
   * @return {L.Matrix}
   */
  clone: function() {
    var matrix = this._matrix;
    return new L.Matrix(
      matrix[0], matrix[1], matrix[2],
      matrix[3], matrix[4], matrix[5]
    );
  },


  /**
   * @param {L.Point=|Number=} translate
   * @return {L.Matrix|L.Point}
   */
  translate: function(translate) {
    if (translate === undefined) {
      return new L.Point(this._matrix[4], this._matrix[5]);
    }

    var translateX, translateY;
    if (typeof translate === 'number') {
      translateX = translateY = translate;
    } else {
      translateX = translate.x;
      translateY = translate.y;
    }

    return this._add(1, 0, 0, 1, translateX, translateY);
  },


  /**
   * @param {L.Point=|Number=} scale
   * @return {L.Matrix|L.Point}
   */
  scale: function(scale, origin) {
    if (scale === undefined) {
      return new L.Point(this._matrix[0], this._matrix[3]);
    }

    var scaleX, scaleY;
    origin = origin || L.point(0, 0);
    if (typeof scale === 'number') {
      scaleX = scaleY = scale;
    } else {
      scaleX = scale.x;
      scaleY = scale.y;
    }

    return this
      ._add(scaleX, 0, 0, scaleY, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * m00  m01  x - m00 * x - m01 * y
   * m10  m11  y - m10 * x - m11 * y
   * @param {Number}   angle
   * @param {L.Point=} origin
   * @return {L.Matrix}
   */
  rotate: function(angle, origin) {
    var cos = Math.round(Math.cos(angle) * 100) / 100;
    var sin = Math.round(Math.sin(angle) * 100) / 100;

    origin = origin || new L.Point(0, 0);

    return this
      ._add(cos, sin, -sin, cos, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * Invert rotation
   * @return {L.Matrix}
   */
  flip: function() {
    this._matrix[1] *= -1;
    this._matrix[2] *= -1;
    return this;
  },


  /**
   * @param {Number|L.Matrix} a
   * @param {Number} b
   * @param {Number} c
   * @param {Number} d
   * @param {Number} e
   * @param {Number} f
   */
  _add: function(a, b, c, d, e, f) {
    var result = [[], [], []];
    var src = this._matrix;
    var m = [
      [src[0], src[2], src[4]],
      [src[1], src[3], src[5]],
      [     0,      0,     1]
    ];
    var other = [
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ], val;


    if (a && a instanceof L.Matrix) {
      src = a._matrix;
      other = [
        [src[0], src[2], src[4]],
        [src[1], src[3], src[5]],
        [     0,      0,     1]];
    }

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        val = 0;
        for (var k = 0; k < 3; k++) {
          val += m[i][k] * other[k][j];
        }
        result[i][j] = val;
      }
    }

    this._matrix = [
      result[0][0], result[1][0], result[0][1],
      result[1][1], result[0][2], result[1][2]
    ];
    return this;
  }


};


L.matrix = function(a, b, c, d, e, f) {
  return new L.Matrix(a, b, c, d, e, f);
};

var _invSvg = null;

function invSvg(){
    if(_invSvg) return _invSvg;
    _invSvg = L.SVG.create("svg");    
    _invSvg.style = 'visibility: hidden; position: absolute; top:0; left:0;';
    _invSvg = document.body.appendChild(_invSvg);
    return _invSvg;
}



L.Text = L.Layer.extend({
    options:  {
        fill: 'black',
        fontFamily: 'Times',
        fontSize: 'medium',
        fontStyle: 'normal',
        interactive: true
    },

    initialize: function (latLngs, text, rotate, style) {
        this.style = L.extend({}, this.options, style);
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        this.rotate = rotate;
        this.text = text;
    },

    _project: function(){
        if(!this.matrix)
            this.matrix = L.matrix(1,0,0,1,0,0);
        else {
            this.matrix._matrix[0] = 1;
            this.matrix._matrix[1] = 0;
            this.matrix._matrix[2] = 0;
            this.matrix._matrix[3] = 1;
            this.matrix._matrix[4] = 0;
            this.matrix._matrix[5] = 0;
        }
        if(!this._map) return;
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        var br = this._map.latLngToLayerPoint(this.bottomRight);
        this._path.setAttribute('x', tl.x);
        this._path.setAttribute('y', br.y);
        var bb = this.bbox;
        var wTransf = Math.round((br.x - tl.x) / (bb.width) * 100) / 100;
        var hTransf = Math.round((br.y - tl.y) / (bb.height) * 100) / 100;
        var dx = -(wTransf-1) * tl.x;
        var dy = -(hTransf-1) * br.y;

        var origin = {x:tl.x, y:br.y};
        // var radian = this.rotate * Math.PI / 180
        this.matrix.rotate(this.rotate, L.bounds(tl, br).getCenter(true));
        this.matrix.scale({x:wTransf, y:hTransf}, origin);
        var transform = 'matrix(' + this.matrix._matrix.join(',') + ')';
        this._path.setAttribute('transform', transform); 
    },

    beforeAdd: function (map) {
        // Renderer is set here because we need to call renderer.getEvents
        // before this.getEvents.
        this._renderer = map.getRenderer(this);
    },

    onAdd: function () {
        var path = this._path = L.SVG.create('text');
        path.textContent = this.text;
        this._updateStyle();
        this.bbox = this._getBBox(this._map, path);
        this.setLatLngs([this.topLeft, this.bottomRight], true);

        // var b = L.latLngBounds(this.topLeft, this.bottomRight);
        // this.poly = L.polygon([this.topLeft, L.latLng(this.topLeft.lat, this.bottomRight.lng), 
        //                        this.bottomRight, L.latLng(this.bottomRight.lat, this.topLeft.lng),this.topLeft ]).addTo(this._map)


        if (this.options.interactive) {
            L.DomUtil.addClass(path, 'leaflet-interactive');
        }
        this._renderer._addPath(this);
        this._project();
        this._map.on('zoomend', this._update, this);
        this._renderer._layers[L.stamp(this)] = this;
    },


    onRemove: function(){
        this._map.off('zoomend', this._update, this);        
        this._renderer._removePath(this);
    },

    setStyle: function(style, notupdate){
        this.style = L.extend({}, this.options, style);
        if(!this._map) return;
        this._updateStyle();
        this.bbox = this._getBBox(this._map, this._path);
        if(notupdate) return;
        this._project();
    },

    setText: function(text, notupdate){
        this.text = text;
        if(!this._map) return;
        this._path.textContent = this.text;
        if(notupdate) return;
        var rect = this._path.getBoundingClientRect();
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        this.bottomRight = this._map.layerPointToLatLng(tl.add({x: rect.width, y: rect.height}));        
        this._project();
    },

    getText: function(){
        return this.text;
    },

    setLatLngs: function(latLngs, notupdate){
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        if(!this.bottomRight && this._map) {
            var xy = this._calculateBounds(this._map,this.bbox, this.topLeft);
            this.topLeft = xy[0];
            this.bottomRight = xy[1];
        }
        if(notupdate) return;
        
        this._project();
    },
    getLatLngs: function(){
        return [this.topLeft, this.bottomRight];
    },
    setRotate: function(rotate, notupdate){
        this.rotate = rotate;
        if(!this._map) return;
        if(notupdate) return;
        this._project();
    },

    _updateStyle: function(){
        this._path.setAttribute('fill', this.style.fill);
        this._path.setAttribute('font-family', this.style.fontFamily);
        this._path.setAttribute('font-size', this.style.fontSize);
        this._path.setAttribute('font-style', this.style.fontStyle);        
    },

    _update: function(){
        // var tl = this._map.latLngToLayerPoint(this.topLeft);
        // var br = this._map.latLngToLayerPoint(this.bottomRight);
        // this._path.setAttribute('x', tl.x);
        // this._path.setAttribute('y', br.y);
        // var bb = this.bbox;
        // var wTransf = Math.round((br.x - tl.x) / (bb.width) * 100) / 100;
        // var hTransf = Math.round((br.y - tl.y) / (bb.height) * 100) / 100;
        // var dx = -(wTransf-1) * tl.x;
        // var dy = -(hTransf-1) * br.y;
        // // var transform = 'translate('+dx+' '+dy+') scale('+wTransf+ ' '+ hTransf +')';
        // // this._path.setAttribute('transform', transform);        

        // var z = this._map.getZoom();
        // var matrix = L.matrix(1,0,0,1,0,0);
        // var origin = {x:tl.x, y:br.y}
        // matrix.rotate(this.rotate, L.bounds(tl, br).getCenter(true));
        // matrix.scale({x:wTransf, y:hTransf}, origin);
        // var transform = 'matrix(' + matrix._matrix.join(',') + ')';
        // this._path.setAttribute('transform', transform); 


        // if(this.rotate){
        //     var ce =L.bounds(tl, br).getCenter(true).subtract({x:dx, y:dy})//.scaleBy({x:wTransf, y:hTransf}).add(tl);
        //     transform += ' rotate('+this.rotate+' '+ce.x+' '+ce.y+')';
        // }
        // this._path.setAttribute('transform', transform);        
        // this._path.setAttribute('transform', 'matrix('+wTransf+ ', 0, 0, '+ hTransf +',0 ,0)');        
    },

    _calculateBounds: function(map, bbox, topLeft){
        var tl = map.latLngToLayerPoint(topLeft); 
        // var tl = cp.add({x: 0, y: -bbox.height/2});
        var br = tl.add({x: bbox.width, y: bbox.height});
        return [map.layerPointToLatLng(tl), map.layerPointToLatLng(br)]        
    },

    _getBBox: function(map, path){
        var prev_y = path.getAttribute('y') || 0;
        var prev_x = path.getAttribute('x') || 0;
        var noParent = !path.parentNode;
        path.setAttribute('y', '16px');
        path.setAttribute('x', '0px');
        if(noParent)
            path = invSvg().appendChild(path);
        var bbox = path.getBBox();
        path.setAttribute('y', prev_y);
        path.setAttribute('x', prev_x);
        if(noParent)
            invSvg().removeChild(path);    
        return bbox;    
    }


});


var Text = L.Text;

var EditableText = Text.extend({

    _rediectEditorEvents: function(e){
        e.target = this;
        this.fire(e.type, e, true);
    },

    onRemove: function(){
        Text.prototype.onRemove.call(this);
        this._map.off('zoomend', this._update, this);        
        if(this.polygon) {
            this.disableEdit();
        }
    },


    setText: function(text, noupdate){
        Text.prototype.setText.call(this, text, noupdate);
        if(this.polygon) {
            var ll = this.getLatLngs();
            var latLngs = [ll[0], L.latLng(ll[0].lat, ll[1].lng),ll[1], L.latLng(ll[1].lat, ll[0].lng),ll[0] ];
            this.polygon.setLatLngs(latLngs);
            this.polygon.editor.reset();
        }
    },

    enableEdit: function(map){
        var ll = this.getLatLngs();
        var latLngs = [ll[0], L.latLng(ll[0].lat, ll[1].lng),ll[1], L.latLng(ll[1].lat, ll[0].lng),ll[0] ];
        var style = {fill: true, weight:1, color: 'grey', fillOpacity: 0.1, opacity:0.1, editorClass: UniformRectEditor};
        
        this.polygon = L.polygon(latLngs, style).addTo(map);
        this.polygon.enableEdit(map);
        this.polygon.on('editable:dragend editable:vertex:dragend contextmenu', this._rediectEditorEvents, this);
        this.polygon.on('editable:vertex:drag editable:drag', this._dragVertex, this);
        this.editor = this.polygon.editor;
    },

    disableEdit: function(){
        if(!this.polygon) return;
        this.polygon.disableEdit();
        this.polygon.off('editable:dragend editable:vertex:dragend contextmenu', this._rediectEditorEvents, this);
        this.polygon.off('editable:vertex:drag editable:drag', this._dragVertex, this);
        this._map.removeLayer(this.polygon);
        this.editor = null;
        this.polygon = null;
    },

    _dragVertex: function(e){
        var ll = this.polygon.getLatLngs()[0];        
        this.setLatLngs([ll[0], ll[2]]);
    }

});


var UniformRectEditor = L.Editable.RectangleEditor.extend({

    lp: function(gp){
        return this.map.latLngToLayerPoint(gp);
    },
    gp: function(lp){
        return this.map.layerPointToLatLng(lp);
    },

    onVertexMarkerDragStart: function(e){
            var index = e.vertex.getIndex(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex];
        this.oppositePoint = this.lp(opposite);
        this.originPoint = this.lp(e.vertex.latlng);
        this.initDist = this.oppositePoint.distanceTo(this.originPoint);
    },

    extendBounds: function(e){

            var index = e.vertex.getIndex(),
                current = e.vertex.latlngs[index],
                next = e.vertex.getNext(),
                previous = e.vertex.getPrevious(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex];

                
            var ratio = this.oppositePoint.distanceTo(this.lp(e.latlng)) / this.initDist || 1;
            var scale = L.point(ratio, ratio);

            var newLatLng = this.gp(this.originPoint.subtract(this.oppositePoint).scaleBy(scale).add(this.oppositePoint));     
            var bounds = new L.LatLngBounds(newLatLng, opposite);
            // Update latlngs by hand to preserve order.
            e.vertex.latlng.update(newLatLng);
            e.vertex._latlng.update(newLatLng);
            previous.latlng.update([newLatLng.lat, opposite.lng]);
            next.latlng.update([opposite.lat, newLatLng.lng]);
            this.updateBounds(bounds);
            this.refreshVertexMarkers();
    }
});

var OverlayMapView = function(config, store, map)
{
    var lineGroup = L.featureGroup().addTo(map);
    var rectGroup = L.featureGroup().addTo(map);
    var noteGroup = L.featureGroup().addTo(map);

    var cat2group = {
        lines: {group: lineGroup, toLayer: toPolyline},
        rects: {group: rectGroup, toLayer: toLeafletRect},
        notes: {group: noteGroup, toLayer: toText}
    };

    var cat2layers = {
        lines: {},
        rects: {},
        notes: {},
    };

    function updateLayers(cat, e){
        var layers = cat2layers[cat];
        var group = cat2group[cat].group;
        var toLayer = cat2group[cat].toLayer; 
        var overlay_id = selectedOverlayId(store);
        var layer_id = str(overlay_id, '.', _.last(e.path));
        if(e.new_val && !e.old_val) {
            var feat = e.new_val;
            var style = config.overlay.types[cat][feat.type].style;
            var layer = toLayer(layer_id, feat, style);
            group.addLayer(layer);
            layers[layer_id] = layer;
        }
        else if(!e.new_val && e.old_val){
            var layer = layers[layer_id];
            map.removeLayer(layer);
            delete layers[layer_id];
        }
        else {
            var feat = e.new_val;
            var layer = layers[layer_id];
            var style = config.overlay.types[cat][feat.type].style;
            layer.setStyle(style, true);  
            if(cat === 'notes'){
                layer.setText(feat.text, true);
                layer.setRotate(feat.rotate, true);
            }    
            layer.setLatLngs(toLatLngs(feat.points));    
        }
    }


    store.on('selectedOverlay.lines.*', _.partial(updateLayers, 'lines') );
    store.on('selectedOverlay.rects.*', _.partial(updateLayers, 'rects') );
    store.on('selectedOverlay.notes.*', _.partial(updateLayers, 'notes') );

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

function toText(id, note, style)
{
    var layer = new EditableText(toLatLngs(note.points), note.text, note.rotate, style);
    layer.id = id;
    return layer;
}

var OverlaySelectTools = function(config, store, map, overlayMapView)
{
    var tooltipContent = document.getElementById('tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; };
    var $roate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; };
    var $edit = function() { return tooltip.getElement().getElementsByTagName('i')[2]; };

    var cat2group = overlayMapView.cat2group;
    var cat2layers = overlayMapView.cat2layers;

    function onDeleteFeat(){
        store(OVERLAY_FEAT_DELETE);
    }

    function onEditFeat(e){
        store(OVERLAY_EDIT, true);
        closeTooltip(tooltip);
        L.DomEvent.stopPropagation(e);
    }

    function onRotateFeat(){
        store(OVERLAY_FEAT_ROTATE);   
        closeTooltip(tooltip);
    }

    function onFeatClick(cat, e){
        var layer_id = e.layer.id.split('.'),
            feat_id = str(cat,'.',layer_id[1]);
        store(OVERLAY_FEAT_SELECT, feat_id);        
        closeTooltip(tooltip);         
        L.DomEvent.stopPropagation(e);
    }


    function onFeatContext(cat, e){
        onFeatClick(cat, e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        var cl = cat === 'notes' ? L.DomUtil.removeClass : L.DomUtil.addClass; 
        cl($roate(), 'w3-hide');
        L.DomUtil.removeClass($edit(), 'w3-hide');
        L.DomEvent.on($delete(), 'click', onDeleteFeat);
        L.DomEvent.on($roate(), 'click', onRotateFeat);
        L.DomEvent.on($edit(), 'click', onEditFeat);
        // 
    }

    function closeTooltip(){        
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onDeleteFeat);
            L.DomEvent.off($roate(), 'click', onRotateFeat);
            L.DomEvent.off($edit(), 'click', onEditFeat);
        }
    }


    _.mapObject(cat2group, function(val, cat){
        val.group.on('click', _.partial(onFeatClick, cat));
    });

    
    _.mapObject(cat2group, function(val, cat){
        val.group.on('contextmenu', _.partial(onFeatContext, cat));
    });

    store.on('ui.overlay.feat', closeTooltip);
    // store.on('ui.overlay.feat', onSelectFeat);
    // map.on('click', closeTooltip);

  
};

var OverlayEditing = function(config, store, map, overlayMapView)
{
    var editor = null;
    var selectedLayer = null;
    var cat2layers = overlayMapView.cat2layers;


    var m2e = {};
    m2e[DRAW_WALL] = editFeat('lines', store, map);
    m2e[DRAW_RECT] = editRect(store, map);
    m2e[DRAW_NOTE] = editNote(config, store, map);

    function onSelectedGeometryChanges(e){
        if(checkGeom(selectedLayer)){
            var selFeat = selectedOverlayFeat(store);
            var feat =  {points: toPoints(selectedLayer.getLatLngs()), id: selFeat.id};
            store(OVERLAY_FEAT_UPDATE, {feat: feat, cat: selFeat.cat});
        }
        selectedLayer.editor.reset();
        // selectedLayer.enableEdit(map); 

    }

    function updateSelectedLayer(e){
        if(selectedLayer) {
            selectedLayer.off('editable:dragend', onSelectedGeometryChanges);
            selectedLayer.off('editable:vertex:dragend', onSelectedGeometryChanges);
            selectedLayer.disableEdit();
            selectedLayer = null;
        }
        var feat = selectedOverlayFeat(store);
        if(feat){
            var overlay_id = selectedOverlayId(store);
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer) {
                L.setOptions(map.editTools, {skipMiddleMarkers: feat.cat !== 'lines', draggable: true});
                selectedLayer.enableEdit(map);   
                selectedLayer.on('editable:dragend', onSelectedGeometryChanges);
                selectedLayer.on('editable:vertex:dragend', onSelectedGeometryChanges);
            }
            else 
                selectedLayer = null;
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
    // store.on('selectedOverlay', onSelectedOverlayChange);

    return {
        onTextChange: function(text){
            var feat = selectedOverlayFeat(store);
            var overlay_id = selectedOverlayId(store);
            var layer_id = str(overlay_id, '.', feat.id);
            selectedLayer = cat2layers[feat.cat][layer_id];
            if(selectedLayer.getText() !== text){
                selectedLayer.setText(text);
                store(OVERLAY_FEAT_TEXT, {
                    text: text,
                    points: toPoints(selectedLayer.getLatLngs())
                });
            }
        }
    }
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
        if(checkGeom(layer))
        {
            var feat =  { points: toPoints(layer.getLatLngs())};
            store(OVERLAY_FEAT_ADD, {feat: feat, cat: cat});
            store(OVERLAY_EDIT, true);
        }
        store(DRAWING_MODE_SET);
    }
    return {enter:enter, exit:exit};
}

function editRect(store, map){
    var outline = L.polygon([], {color: 'black', fill: false, opacity: 1, weight: 2, dashArray: "5,5"});
    function move(e){
        var ce = e.latlng;
        var ll = [[-20,-20],[20,-20], [20,20], [-20,20], [-20,-20] ].map(function(it){
            return L.latLng(ce.lat+it[0], ce.lng+it[1]);
        });
        outline.setLatLngs(ll);
    }

    function onClick(e) {
        move(e);
        var feat =  { points: toPoints(outline.getLatLngs())};
        store(OVERLAY_FEAT_ADD, {feat: feat, cat: 'rects'});
        store(OVERLAY_EDIT, true);
        store(DRAWING_MODE_SET);    
        L.DomEvent.stopPropagation(e);    
    }

    function enter(w){
        L.DomUtil.addClass(map._container,'move-cursor');
        outline.setLatLngs([]);
        map.addLayer(outline);
        map.on('mousemove', move);      
        map.on('click', onClick);      
    }

    function exit(){
        L.DomUtil.removeClass(map._container,'move-cursor');
        map.removeLayer(outline);
        map.off('mousemove', move);
        map.off('click', onClick);      
        
    }
    return {enter: enter, exit: exit}    
}

function editNote(config, store, map) 
{
    function onClick(e){
        var text = selectedOverlayText(store);
        var type = overlayNoteType(store);
        var style = config.overlay.types.notes[type].style;
        var $text = new Text([e.latlng],  text, 0, style).addTo(map);        
        var feat = {
            points: toPoints($text.getLatLngs()),
            rotate: 0,
            text: text,
            type: type         
        };
        map.removeLayer($text);
        store(OVERLAY_FEAT_ADD, {feat: feat, cat: 'notes'});
        store(OVERLAY_EDIT, true);
        store(DRAWING_MODE_SET);
        L.DomEvent.stopPropagation(e);
    }

    function enter() 
    {        
        L.DomUtil.addClass(map._container,'text-cusor');
        map.on('click',onClick);    
    }

    function exit(){
        L.DomUtil.removeClass(map._container,'text-cusor');
        map.off('click',onClick);            
    }

    return {enter:enter, exit:exit};
}



function checkGeom(layer){
    var checkDist = 1;
    _.reduce(_.flatten(layer.getLatLngs()), function(l1,l2){
        var d = l1.distanceTo(l2);
        if(d < checkDist) checkDist = d;
        return l2;
    });
    return checkDist == 1;
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
            },
            rollback: function(){
                store(OVERLAY_ROLLBACK);
            }
        }
    });

    store.on('map.drawMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });

    var editVM = new Vue({
        el: "#overlay-edit",
        data: {
            edit: store.prop('ui.overlay.edit'),
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
            text: null
        },
        methods: {
            close: function(){
                store(OVERLAY_EDIT);
            }
        }
    });


    store.on('ui.overlay.feat', function(){
        var feat = selectedOverlayFeat(store);
        editVM.type = feat ? editVM.types[feat.cat] : null;
        editVM.text = feat && feat.cat === 'notes' ? store.state.selectedOverlay.notes[feat.id].text : null; 
    });

    editVM.$watch('type.sel.$val', function(val){
        if(val) {
            var feat = selectedOverlayFeat(store);
            store(OVERLAY_TYPE_SELECT, {feat: feat, type_id: val});
        }
    });
    return editVM;
}

var OverlaysModule = function(config, store, map){
    var ov = OverlayView(config, store);
    var omv = OverlayMapView(config, store, map);
    OverlaySelectTools(config, store, map, omv);
    var oe = OverlayEditing(config, store, map, omv);

    ov.$watch('text', _.debounce(function(text){
        if(text && text.trim().length > 0) {
            oe.onTextChange(text);  
        }
    },100));

};

var Stand = L.Rectangle.extend({
    options: {
        fillColor: 'green',
        color: 'green',
        stroke: false,
        fillOpacity: 0.7,
    },
    

    initialize: function (latlngs, options, openWalls){
        options = _.extend(options, {editorClass: StandEditor});
        this.openWalls = openWalls || 1;
        L.Rectangle.prototype.initialize.call(this, latlngs, options);
        this._createDecorations();
    },

    _createDecorations: function(){
        var ll = this.getLatLngs();
        ll = _.rest(_.flatten(ll), this.openWalls-1);
        if(ll.length > 1)
            this.line = new DoubleLine(ll, {color: this.options.fillColor});
    },

    onAdd: function (map) {
        L.Rectangle.prototype.onAdd.call(this,map);
        if(this.line) map.addLayer(this.line); 
        this.on('editable:shape:dragstart', this._onDragStart, this);    
        this.on('editable:shape:dragend', this._onDragEnd, this);    
    },

    onRemove: function (map) {
        L.Rectangle.prototype.onRemove.call(this, map); 
        if(this.line) map.removeLayer(this.line);       
        this.off('editable:shape:dragstart', this._onDragStart, this);    
        this.off('editable:shape:dragend', this._onDragEnd, this);    
    },

    _onDragStart: function(){
        if(this.line) {
            this._map.removeLayer(this.line);
            this.line = null;
        }
    },

    _onDragEnd: function(){
        if(!this.line) {
            this._createDecorations();
            this._map.addLayer(this.line);
        }
    },
    


    redraw: function(){
        L.Rectangle.prototype.redraw.call(this); 
        if(this.line) {
            this.line.redraw();}
    },

    update: function(latlngs, options, openWalls){
        this.setStyle(options);
        // if it's edit mode
        this.openWalls = openWalls || this.openWalls;
        var ll = this.getLatLngs();
        if(ll[0][0].update) {
            _.each(latlngs, function(new_latlng, i){
                ll[0][i].update(new_latlng);
            });
        }
        else { 
            this.setLatLngs(latlngs);
            ll = this.getLatLngs();
        }
        ll = _.rest(_.flatten(ll), this.openWalls-1);
        if(this.line && this._map && ll.length > 1) {
            this.line.setLatLngs(ll);
            this.line.setStyle({color: this.options.fillColor});
        } 
    }
});

/**
 * Editor that preserver order of point in rectangle
 */
var StandEditor = L.Editable.RectangleEditor.extend({
        extendBounds: function (e) {
            var index = e.vertex.getIndex(),
                next = e.vertex.getNext(),
                previous = e.vertex.getPrevious(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex],
                bounds = new L.LatLngBounds(e.latlng, opposite);

            e.latlng = this.map.snap(e.latlng);
            // Update latlngs by hand to preserve order.
            var fact = next.latlng.lat >  previous.latlng.lat;
            var nnext = [opposite.lat, e.latlng.lng];
            var nprevious = [e.latlng.lat, opposite.lng];
            if( (nnext[0] > nprevious[0]) !== fact )
                previous = [next, next=previous][0];
            previous.latlng.update(nprevious);
            next.latlng.update(nnext);

            e.vertex.latlng.update(e.latlng);
            e.vertex._latlng.update(e.latlng);
            
            this.updateBounds(bounds);
            this.refreshVertexMarkers();
        },
});

var DoubleLine = L.Polyline.extend({
    options2: {color: 'lightgrey', weight: 7, lineCap: "butt", lineJoin: "miter", opacity: 1},
    options1: {color: 'green', lineCap: "butt", lineJoin: "miter", opacity: 0.7},
    // options1: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    // options2: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    
    initialize: function (latlngs, options1, options2){
        this.options1 = L.extend(this.options1, options1);
        this.options2 = L.extend(this.options2, options2);
        this.line2 = new L.Polyline([], this.options2);
        L.Polyline.prototype.initialize.call(this, latlngs, this.options1);
    },

    setStyle: function(options1, options2) {
        this.options1 = L.extend(this.options1, options1);
        this.options2 = L.extend(this.options2, options2);
        this.line2.setStyle(this.options2);
        L.Polyline.prototype.setStyle.call(this, this.options1);
    },

    onAdd: function (map) {
        this.line2._map = map;
        this.line2._path = L.SVG.create('path');
        this._renderer._updateStyle.call(this._renderer, this.line2);
        this._renderer._addPath.call(this._renderer, this.line2);
        L.Polyline.prototype.onAdd.call(this, map);
        // this.line2._path.setAttribute('transform', 'translate(1,1)');
        // this._path.setAttribute('transform', 'translate(1,1)');
        
    },

    onRemove: function (map) {
        this._renderer._removePath.call(this._renderer, this.line2);
        L.Polyline.prototype.onRemove.call(this, map);
    },

    _updatePath: function(){
        this.line2._parts = this._parts;
        this._renderer._updatePoly.call(this._renderer, this.line2);
        L.Polyline.prototype._updatePath.call(this);
    },

    _project: function(){
        var w = {
            0: [6,2],
            1: [7,3],
            2: [10,6],
            3: [14,10],
            4: [18,14],
        };
        var z = this._map.getZoom();
        var weights = w[z] || w[4];
        this.line2._path.setAttribute('stroke-width', weights[0]);
        this._path.setAttribute('stroke-width', weights[1]);
        L.Polyline.prototype._project.call(this);
    },
    _transform: function(matrix){
        L.Path.prototype._transform.call(this, matrix);
        this.line2._transform(matrix);
    }
    
});

var StandMapView = function(config, store, map){
    var standsGroup = L.featureGroup().addTo(map);
    var stands = {};

    function onStandChanges(e)
    {
        var stands_id = selectedStandsId(store);
        if(e.new_val && !e.old_val) {
            var s = e.new_val;
            var style = config.stands.types[s.type].style;
            var $stand = new Stand(toLatLngs(s.points), style, s.openWalls);
            $stand.id = s.id;
            $stand.stands_id = stands_id;
            standsGroup.addLayer($stand);
            stands[s.id] = $stand;
        }
        else if(!e.new_val && e.old_val) {
            var id = _.last(e.path);
            var stand = stands[id];
            standsGroup.removeLayer(stand);
            delete stands[id];
        }
        else {
            var id = _.last(e.path);
            var $stand = stands[id];
            var s = e.new_val;
            var style = config.stands.types[s.type].style;
            $stand.update(toLatLngs(s.points), style, s.openWalls);
        }
    }
     

    function onSelectedStandsId(e){
        if(e.old_val){
            store.off('entities.stands.'+e.old_val+".*", onStandChanges);
            standsGroup.clearLayers();
            stands = {};
        }
        if(e.new_val){
            store.on('entities.stands.'+e.new_val+".*", onStandChanges);
            _.each(selectedStands(store), function(s){
                onStandChanges({new_val:s});
            });
        }
    }

    store.on('selectedStandsId', onSelectedStandsId );

    return {stands:stands, standsGroup:standsGroup}
 };

var StandEditing = function(config, store, map, standMapView){
    var $stand = null;
    var $stands = standMapView.stands;
    var mymodes = [DRAW_STAND1, DRAW_STAND2, DRAW_STAND3, DRAW_STAND4];
    var editor = edit(store, map);

    function onDrawMode(e){
        editor.exit();
        var i = mymodes.indexOf(e.new_val);
        if(i !== -1){
            editor.enter(i+1);
        }
    }

    function onSelectedGeometryChange(e){
        var stand = selectedStand(store);
        var points = toPoints($stand.getLatLngs());
        store(STAND_POINTS_UPDATE, {stand: stand, points:points});
    }

    function onStandSelect(){
        if($stand) {
            $stand.off('editable:dragend', onSelectedGeometryChange);
            $stand.off('editable:vertex:dragend', onSelectedGeometryChange);
            $stand.disableEdit();
            store.off('entities.stands.'+$stand.stands_id+'.'+$stand.id, onStandSelect);            
            console.log('disableEdit', $stand.id);
            $stand = null;
        }
        var stand = selectedStand(store);
        if(stand){
            $stand = $stands[stand.id];
            if($stand) {
                L.setOptions(map.editTools, {skipMiddleMarkers: true, draggable: true});
                $stand.enableEdit(map);   
                console.log('enableEdit', $stand.id);
                
                $stand.on('editable:dragend', onSelectedGeometryChange);
                $stand.on('editable:vertex:dragend', onSelectedGeometryChange);
                store.on('entities.stands.'+$stand.stands_id+'.'+$stand.id, onStandSelect);
            }
            
        }
    }

    store.on('map.drawMode', onDrawMode);
    store.on('ui.stands.sel', onStandSelect);

};

function edit(store, map){
    var outline = L.polygon([], {color: 'black', fill: false, opacity: 1, weight: 2, dashArray: "5,5"});
    var openWalls = 1;

    function move(e){
        var ce = map.snap(e.latlng);
        var ll = [[-10,-10],[10,-10], [10,10], [-10,10], [-10,-10] ].map(function(it){
            return L.latLng(ce.lat+it[0], ce.lng+it[1]);
        });
        console.log('move', ll.map( it => it.lat).join(','));
        outline.setLatLngs(ll);
    }

    function onClick(e) {
        move(e);
        var type = store.state.ui.stands.type;
        var feat =  { points: toPoints(outline.getLatLngs()), openWalls: openWalls, rotate: 0, type: type};
        store(STAND_ADD, feat);
        store(DRAWING_MODE_SET);  
        L.DomEvent.stopPropagation(e);      
    }

    function enter(w){
        openWalls = w;
        L.DomUtil.addClass(map._container,'move-cursor');
        outline.setLatLngs([]);
        // move({latlng: map.getCenter()});
        map.addLayer(outline);
        map.on('mousemove', move);      
        map.on('click', onClick);      
    }

    function exit(){
        L.DomUtil.removeClass(map._container,'move-cursor');
        map.removeLayer(outline);
        map.off('mousemove', move);
        map.off('click', onClick);      
        
    }
    return {enter: enter, exit: exit}
}

var StandySelectTools = function(config, store, map, standMapView)
{
    var tooltipContent = document.getElementById('tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; };
    var $roate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; };
    var $edit = function() { return tooltip.getElement().getElementsByTagName('i')[2]; };


    function onStandClick(e){
        store(STAND_SELECT, e.layer.id);
        closeTooltip(tooltip);         
        L.DomEvent.stopPropagation(e);
    }

    function onStandContext(e){
        onStandClick(e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        L.DomUtil.removeClass($roate(), 'w3-hide');
        L.DomUtil.removeClass($edit(), 'w3-hide');
        L.DomEvent.on($delete(), 'click', onStandDelete);
        L.DomEvent.on($roate(), 'click', onStandRotate);
        L.DomEvent.on($edit(), 'click', onStandEdit);
        L.DomEvent.stopPropagation(e);
    }

    function onStandDelete(e){
        store(STAND_DELETE, selectedStand(store));
        closeTooltip();
    }

    function onStandRotate(){
        alert('Not implemented yet');
    }

    function onStandEdit(e){
        store(STAND_EDIT, true);
        closeTooltip();
        L.DomEvent.stopPropagation(e);
    }

    function closeTooltip(){
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onStandDelete);
            L.DomEvent.off($roate(), 'click', onStandRotate);
            L.DomEvent.off($edit(), 'click', onStandEdit);
        }
    }


    standMapView.standsGroup.on('click', onStandClick);
    standMapView.standsGroup.on('contextmenu', onStandContext);

    store.on('ui.stands.sel', closeTooltip);
};

function StandView(config, store){

    var MODES = {
        "stand0": DRAW_STAND1,
        "stand1": DRAW_STAND2,
        "stand2": DRAW_STAND3,
        "stand3": DRAW_STAND4
    };


    var vm = new Vue({
        el: "#stands",
        template: "#stands-template",
        data: {
            mode: null,
            selectedStandsId: store.prop('selectedStandsId'),
        },
        methods: {
            select: function(mode){
                var m = MODES[mode];
                store(DRAWING_MODE_SET, drawMode(store) == m ? undefined : m );
            },
            cssClass: function(p){
                return p == this.mode ? 'w3-border-blue  w3-border'  : '';
            },            
        }
    });

    store.on('map.drawMode', function(e){
        vm.mode = _.findKey(MODES, function(it) { return it == e.new_val});
    });

    var editVM = new Vue({
        el: "#stand-edit",
        data: {
            edit: store.prop('ui.stands.edit'),
            type: store.prop('ui.stands.type'),
            list: config.stands.types
        },
        methods: {
            close: function(){
                store(STAND_EDIT);
            }
        }
    });

    editVM.$watch('type.$val', function(val){
        if(val) {
            var stand = selectedStand(store);
            if(stand.type != val)
                store(STAND_TYPE_UPDATE, {stand: stand, type: val});
        }
    });
    
}

var StandView$1 = function(config, store, map){
    StandView(config, store);
    var smv = StandMapView(config, store, map);
    StandEditing(config, store, map, smv);
    StandySelectTools(config, store, map, smv);
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
StandView$1(config, store, map);

store("INIT");

}());
