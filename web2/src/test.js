import {Store} from './redux.1.js'


var old_state = {
    p1: 1
}

var new_state = {
    p1: 1,
    p2: {
        p3: 4,
        p4: {
            p5: 5
        }
    }
}

var store = Store(function(){ return new_state})
store.state = old_state;

var fn = e => console.log("*.*.p5", e);
store.on("*.*.p5",  fn);
store.on("p2.p3", e => console.log("p2.p3", e) );
store.on("p2.*", e => console.log("p2.*", e) );
store.on("p2", e => console.log("p2", e) );

store.off("*.*.p5",  fn);

store('kino')