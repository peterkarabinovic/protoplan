export function str() {
    return "".concat.apply("",arguments);
}

export function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
};


export var Maybe = (function () {
  var Some = function (x) { this.x = x; };
  Some.prototype.fmap = function (fn) { return Maybe.of(fn(this.x)); };
  Some.prototype.bind = function (fn) { return fn(this.x); };
  Some.prototype.toString = function () { return `Some(${this.x})`; };

  var None = function () {};
  None.fmap = function() { return None };
  None.bind = function() { return None };
  None.toString = function() { return 'None' }; 

  return {
    //of: (x) => x === null || x === undefined ? None : new Some(x),
    // lift: (fn) => (...args) => Maybe.of(fn(...args)),
    Some,
    None
  };
})();


/***
 *  Either monad
 */
export var Either = function(left, right){
    var has_left = function() { return left ? true : false }; 
    var has_right = function() { return right ? true : false };

    return {
        has_left: has_left,
        has_right: has_right,
        fold: function(left_fn, right_fn) {
            has_left() ? left_fn(left) : right_fn(right)
        }
    }
};

Either.right = function(value){
    return Either(null, value)
}

Either.left = function(value){
    return Either(value)
}
