import {combine, handle} from '../redux.js'


var layers = handle(
    {
        base: null,
        additional: null,
        stands: null,
        equipment: null
    },
    {
        BASE_IMAGE_SET: function(state, action){
            return _.extend({}, state, {base: action.payload});
        },
        BASE_IMAGE_SIZE_UPDATE: function(state, action){
            var size_m = action.payload;
            return _.extend({}, state, {base: _.extend(state.base, {size_m: size_m})});
        },
    }
);

var map = handle(
    {
        drawMode: null,
        distance: null // { points:Array<Point>, }
    },
    {
        DRAW_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawMode: mode});
        },
        DISTANCE_SET: function(state, action){
            var dist_m = action.payload;
            return _.extend({}, state, {distance: dist_m});
        },
    }
);

var root = handle({},{

});


export default combine({
    map: map,
    layers: layers
}, root);


// SELECTORS
export function getBaseLayer(store) { return store.state.layers && store.state.layers.base; }
export function getDistanceLine(store) { return store.state.map && store.state.map.distance; }



