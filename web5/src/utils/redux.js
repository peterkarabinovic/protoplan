
import _  from '../es6/underscore.js'
/**
 * 
 * @param {function} reducers - reduce state function 
 * @param {Array} middleware - optional array of middleware
 * @param {Object} initState - optional init state
 */
export function Store(reducers, middleware)
{
    middleware = middleware || []

    var s = function(action_type, payload) {
        return s.dispatch({ type: action_type, payload: payload});
    }
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
            })
        }
        return s.state;
    }

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    })


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
                        })
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
function diffs(new_obj, old_obj, keys)
{
    return keys.reduce(function(diffs, key){
        return _.isEqual(new_obj[key], old_obj[key]) ? diffs : diffs.concat(key);
    },[]);
}


function _match(path, mask_path){
    path = _.clone(path)
    for(var i in mask_path) {
        if(mask_path[i] === '*')
            path[i] = '*';
    }
    return _.isEqual(path, mask_path);
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
            memo[prop] = {}
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

export function combine(reducerMap, rootReducer)
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
};

export function handle(defaultState, handlers)
{
    defaultState = defaultState || {};
    return function(state, action){
        if(_.isEmpty(state))
            state = _.clone(defaultState);
        
        return (handlers[action.type] || _.identity)(state, action);
    }
}

export function reduceReducers(reducers){
    return function(state, action){
        reducers.forEach(function(fn){
            state = fn(state, action)
        })
        return state;
    }
}