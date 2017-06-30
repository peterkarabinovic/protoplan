import {handler} from '../../redux.js'

export default handle( {
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
});