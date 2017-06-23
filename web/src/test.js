import Store from './redux/store.js'
import {diff_paths, diffs} from './redux/store.js'

// console.log(Store)

var obj1 = { "p1": [1, 2, 3, 4], 
 "p2": {
     "p3": [1, "4"]
    }
}
var obj2 = L.extend({}, obj1, { p1: 123})
var obj3 = L.extend({}, obj1, { p2: { "p3": [1, 4]}})

console.log(diff_paths(obj1, obj2))
console.log(diff_paths(obj1, obj3))
console.log(diff_paths(obj1, { p3: 12 }))


var old_state = obj1;
var new_state = L.extend({}, obj1, { p2: { p3: [1,4]}, p1: 5 })
var store = Store(function(s, action) {
    return new_state;
}, [], old_state)

store.on('*', e=>{
    console.log('on *', e)
})


store.on_exactly('*.p3', e=> { 
    console.log('on_exactly *.p3', e)
})


store(123);



