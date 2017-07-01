import {Immutable} from './utils/fp.js'
import {reduceReducers} from './utils/redux.js'
import * as a from './actions.js'


var pavilionReducer = function(state, action)
{
    switch(action.type)
    {
        case a.PAVILIONS_LOADED:
            return Immutable.set(state, 'pavilions', action.payload);

        case a.PAVILION_DELETED:
            var pavi_id = action.payload;
            var pavi = state.pavilions[pavi_id];
            if(pavi) {
                state = Immutable.remove(state, 'pavilions.'+pavi.id);
                if(pavi.base)
                    state = Immutable.remove(state, 'entities.bases.'+pavi.base);
            }
            if(state.selectedPavilion && state.selectedPavilion.id == pavi_id)
                state = Immutable.set(state, 'selectedPavilion');
            return state;

        case a.PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            return state;

        case a.PAVILION_SELECT:
            var pavi = action.payload;
            state = Immutable.set(state, 'selectedPavilion', pavi);
            if(pavi) {
                var base = state.entities.bases[pavi.base]
                state = Immutable.set(state, 'selectedBaseLayer', base);
            }
            return state;
            

    }
    return state;
}


var baseReducer = function(state, action)
{
    switch(action.type)
    {
        case a.BASES_LOADED:
            return Immutable.set(state, 'entities.bases', action.payload);

        case a.BASE_LAYER_SET: 
            var base = action.payload;
            if(state.selectedBaseLayer)
                base = _.extend({}, state.selectedBaseLayer, base)
            else
                base = _.extend({}, base, {id:0});            
            return Immutable.set(state, 'selectedBaseLayer', base);
        
        case a.BASE_DISTANCE_LENGTH_SET:
            var length_m = action.payload;
            var ratio =  length_m / state.selectedBaseLayer.distance.length_m;
            var size_m = state.selectedBaseLayer.size_m;
            size_m = {
                x: size_m.x * ratio,
                y: size_m.y * ratio
            };
            state = Immutable.set(state, 'selectedBaseLayer.size_m', size_m );
            return Immutable.set(state, 'selectedBaseLayer.distance.length_m', length_m);             
        
        case a.BASE_DISTANCE_SET: 
            var distance = action.payload;
            return Immutable.set(state, 'selectedBaseLayer.distance', distance);

        case a.BASE_LAYER_SAVED:
            var pavi_id = action.payload.pavi_id;
            var base = action.payload.base;
            var pavi = state.pavilions[pavi_id];
            if(pavi){
                state = Immutable.set(state, 'pavilions.'+pavi_id+'.base', base.id)
                state = Immutable.set(state, 'entities.bases.'+base.id, base);
                if(state.selectedPavilion && pavi_id == state.selectedPavilion.id){
                    state = Immutable.extend(state, 'selectedBaseLayer', base)
                }
            }
            else {
                state = Immutable.remove(state, 'entities.bases.'+base.id);
            }
            
            return state;

    }
    return state;
}


var mapReducer = function(state, action)
{
    switch(action.type){
        case a.DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawing_mode', mode);

    }
    return state;
}
export default reduceReducers([pavilionReducer, baseReducer, mapReducer])

