
import {handle} from '../../utils/redux.js'
import uiView from './ui-view.js'
import uiMap from './ui-map.js'

var BaseModule = function(store, map)
{
    uiView(store);
    uiMap(store, map);
}

BaseModule.reducer = handle( 
    {
        size_m: null,
        size_px: null,
        url: null,
        raw_svg: null,
        distance: {
            points: [],
            length_px: null,
            length_m: null
        }
    },
    {
        DISTANCE_SET: function(state, action){
            return _.extend({}, state, 
                { distance : {
                    points: action.payload.points,
                    length_m: action.payload.length_m,
                    length_px: action.payload.length_px
                }
            });
        },

        BASE_LAYER_SET: function(state, action){
            return _.extend({}, state, action.payload);
        },

        DISTANCE_LENGTH_SET: function(state, action){
            var length_m = action.payload;
            var ratio =  length_m / state.distance.length_m;
            var size_m = state.size_m;
            size_m = {
                x: size_m.x * ratio,
                y: size_m.y * ratio
            };
            return _.extend({}, state, {
                size_m: size_m,
                distance: _.extend({}, state.distance, {length_m:length_m})
            })
        }

    }
);
 
export default BaseModule;