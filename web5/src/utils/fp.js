/**
 *  Small functional programming stuff 
 */
import _  from '../es6/underscore.js'


export function memorize(f) {
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
export function Either(left, right){
    return {
        fold: function(left_fn, right_fn) {
            left === void 0 ? right_fn(right) : left_fn(left)
        },
        right: right
    }
};

Either.right = function(value){
    return Either(undefined, value)
}

Either.left = function(value){
    return Either(value)
}


/***
 * Immutable 
 */
export var Immutable = (function(){
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
    }

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
    }
    return i;
})();