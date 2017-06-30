export function str() {
    return "".concat.apply("",arguments);
}

export function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
};

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
    var has_left = function() { return left ? true : false }; 
    var has_right = function() { return right ? true : false };

    return {
        has_left: has_left,
        has_right: has_right,
        fold: function(left_fn, right_fn) {
            has_left() ? left_fn(left) : right_fn(right)
        },
        right: function() { return right}
    }
};

Either.right = function(value){
    return Either(null, value)
}

Either.left = function(value){
    return Either(value)
}


/*
 * Selfcheck - wrap callback function for check if it already called in stack above
 */

export function Selfcheck(){
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

/***
 * Immutable helper
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