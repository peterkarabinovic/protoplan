
import {handler} from '../utils/redux.js'

export var Reducer = handle( 
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
            DISTANCE_LINE_SET: function(state, action){
                return _.extend({}, state, {points: action.payload.points,
                                            length_m: action.payload.length_m,
                                            length_px: action.payload.length_px});
        }
});

export default function(store, map)
{

}