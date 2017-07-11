
/**
 * 
 * @param {function} reducers - reduce state function 
 * @param {Array} middleware - optional array of middleware
 * @param {Object} initState - optional init state
 */
export default function(reducers, middleware, initState)
{
    middleware = middleware || []

    var s = function(action) {
        return s.dispatch(action)
    }
    s.state = initState;

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
    }

    middleware.forEach(function(m){
        s.dispatch = m(s)(s.dispatch);
    })


    return s;
}

/**
 * find all diff paths in two objects
 * @param {Object} obj1 
 * @param {Object} obj2 
 */
export function diff_paths(new_obj, old_obj){
    var props = diffs(new_obj, old_obj);
    var paths = {};
    props.forEach(function(prop){
        var o1 = new_obj[prop];
        var o2 = old_obj[prop];
        paths[prop] = {new_val:o1, old_val:o2};
        paths[prop].paths = L.extend({}, diff_paths(o1, o2));
    })
    return paths;
}

/**
 * find the properties that is not equals
 * @param {Object} obj1  
 * @param {Object} obj2 
 */
export function diffs(new_obj, old_obj)
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
    listeners[path.length] = listeners[path.length] || []
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
        })
    });
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
        var p = path.concat([prop])
        events.push({ path: p, old_val: diff.old_val, new_val: diff.new_val, terminal: _.isEmpty(diff.paths) });
        events = events.concat( _collect_diff_event(p, diff.paths) );
        return events;
    },[]);
};