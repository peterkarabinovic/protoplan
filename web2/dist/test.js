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
    s.off = _.partial(_off, listeners);
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
        var ll = listeners[p.length];
        if(ll) 
        {
            var event = {new_val: o1, old_val: o2, path: p};
            ll = _.reject(ll, function(it){
                if(_match(p, it.path)) {
                    it.fn(event);
                    return true;
                }
                return false;
            });
            if(!ll.length) {
                delete listeners[p.length];
            }
            else {
                listeners[p.length] = ll;
            }
        }
        if(max_level > p.length)
            find_and_fire(o1, o2, listeners, p);
    });
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
        if(ll.length)
            listeners[ln] = ll;
        else
            delete listeners[ln];
    }
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

var old_state = {
    p1: 1
};

var new_state = {
    p1: 1,
    p2: {
        p3: 4,
        p4: {
            p5: 5
        }
    }
};

var store = Store(function(){ return new_state});
store.state = old_state;

var fn = e => console.log("*.*.p5", e);
store.on("*.*.p5",  fn);
store.on("p2.p3", e => console.log("p2.p3", e) );
store.on("p2.*", e => console.log("p2.*", e) );
store.on("p2", e => console.log("p2", e) );

store.off("*.*.p5",  fn);

store('kino');

}());
