/**
 *  Small functional programming stuff 
 */



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
        }
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
    }
    return i;
})();