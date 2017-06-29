var _ = require('../libs/underscore')
var Immutable = (function(){
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

var obj1 = { p1: { p2: { p3: 123 } } };
var obj2 = Immutable.update(obj1, 'p1.p2.p4', 1);

console.log(obj1);
console.log(obj2);
