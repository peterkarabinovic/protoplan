import {combine, handle} from '../redux.js'


var mapReducers = handle(
    {
        drawMode: null,    // distance_line, polyline, carpet ... 
        baseImage: null,   // Layer
        distanceLine: null, // <Number>
        envLayer: null
    },
    {
        
        BASE_IMAGE_SET: function(state, action){
            return _.extend({}, state, {baseImage: action.payload});
        },
        BASE_IMAGE_SIZE_UPDATE: function(state, action){
            var size_m = action.payload;
            return _.extend({}, state, {baseImage: _.extend(state.baseImage, {size_m: size_m})});
        },
        DRAW_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawMode: mode});
        },
        DISTANCE_SET: function(state, action){
            var dist_m = action.payload;
            return _.extend({}, state, {distanceLine: dist_m});
        },
        
    }
);


export default combine({
    map: mapReducers
});


// SELECTORS
export function getBaseLayer(store) { return store.state.map && store.state.map.baseImage; }
export function getDistanceLine(store) { return store.state.map && store.state.map.distanceLine; }



