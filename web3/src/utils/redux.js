
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

    var listeners = {};
    
    s.on = function(path, fn){
        var paths = path.split(' ');
        paths.forEach(function(p){
            p = p.trim().split('.');
            listeners[p.length] = listeners[p.length] || []
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
            find_and_fire([], s.state, old_state, listeners)
        return s.state;
    }

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    })


    return s;
}

/**
 * Recursive run by properties search diff and fire events 
 * @param {*} new_obj 
 * @param {*} old_obj 
 * @param {*} listeners 
 * @param {*} path 
 */
// function find_and_fire(path, new_obj, old_obj, listeners)
// {
//     if( _.isEmpty(listeners) )
//         return

//     new_obj = new_obj || {};
//     old_obj = old_obj || {};
       
//     var props = diffs(new_obj, old_obj);    
//     var max_level = +_.max(_.keys(listeners));
//     props.forEach(function(prop){
//         var o1 = new_obj[prop];
//         var o2 = old_obj[prop];
//         var p = path.concat([prop]);
//         listeners = reject_array_prop(listeners, p.length, function(it){
//             if(_match(p, it.path)) {
//                 it.fn({new_val: o1, old_val: o2, path: p});
//                 return !_.contains(it.path, '*');
//             }
//             return false;
//         });
//         if(max_level > p.length)
//             find_and_fire(p, o1, o2, listeners);
//     });
// }


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
    path = _.clone(path)
    for(var i in mask_path) {
        if(mask_path[i] === '*')
            path[i] = '*';
    }
    return _.isEqual(path, mask_path);
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