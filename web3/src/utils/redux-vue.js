import {Immutable} from './fp.js'

/**
 * Add method `prop` for store instance to track changes of properties and store in changable object {$val: <value>} 
 * need for work with Vue.js
 * @param {*} store of redux.js 
 */

export function bindProp(store)
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
        store.on(path, listener(prop))
        return prop;
    }
}