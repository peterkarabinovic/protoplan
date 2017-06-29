import {combine, handle} from '../redux.js'
import {Immutable} from '../utils.js'

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
        drawing_mode: null,
    },
    {
        DRAWING_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawing_mode: mode});
        }
    }
);


var modules = combine(
{
    base: handle(
        {
            points: [],
            length_px: null,
            length_m: null,
        },
        {
            DISTANCE_LINE_SET: function(state, action){
                return _.extend({}, state, {points: action.payload.points,
                                            length_m: action.payload.length_m,
                                            length_px: action.payload.length_px});
            }
    })
})

var root = handle({},
{
    DISTANCE_SET: function(state, action){
        var length_m = action.payload;
        var ratio =  length_m / state.modules.base.length_m;
        var size_m = state.layers.base.size_m;
        size_m = {
            x: size_m.x * ratio,
            y: size_m.y * ratio
        };
        state = Immutable.update(state, 'layers.base.size_m', size_m);
        state = Immutable.update(state, 'modules.base.length_m', length_m);
        return state;
    }
});


export default combine({
    layers: layers,
    map: map,
    modules: modules
}, root);


// SELECTORS
export function getBaseLayer(store) { return store.state.layers && store.state.layers.base; }
export function getModuleBase(store) { return store.state.modules.base; }



