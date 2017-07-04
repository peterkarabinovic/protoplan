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
                state = Immutable.remove(state, 'entities.bases.'+pavi.id);
            }
            if(state.selectedPavilion && state.selectedPavilion.id == pavi_id) {
                state = Immutable.set(state, 'selectedPavilion');
                state = Immutable.set(state, 'selectedBaseLayer');
            }
            return state;

        case a.PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            state = Immutable.set(state, 'selectedBaseLayer', {id:pavi.id});
            return state;

        case a.PAVILION_SELECT:
            var pavi = action.payload;
            state = Immutable.set(state, 'selectedPavilion', pavi);
            if(pavi) {
                var base = state.entities.bases[pavi.id] || {id: pavi.id}
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
            return Immutable.extend(state, 'selectedBaseLayer', base);
        
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
            var base = action.payload;
            if(state.pavilions[base.id]) {
                state = Immutable.set(state, 'entities.bases.'+base.id, base);
                if(state.selectedPavilion && base.id == state.selectedPavilion.id)
                    state = Immutable.extend(state, 'selectedBaseLayer', base)
            }
            else {
                state = Immutable.remove(state, 'entities.bases.'+base.id);
            }
            return state;
    }
    return state;
}

var overlayReducer = function(state, action){
    switch(action.type){
        case a.OVERLAY_FEAT_ADD: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            feat = Immutable.set(feat, 'id', generateId(state, 'selectedOverlayLayer.'+type))
            state = Immutable.set(state, 'selectedOverlayFeat', feat);
            return Immutable.set(state, 'selectedOverlayLayer.'+type+'.'+feat.id, feat);

        case a.OVERLAY_FEAT_UPDATE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.set(state, 'selectedOverlayLayer.'+type+'.'+feat.id, feat);

        case a.OVERLAY_FEAT_DELETE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.remove(state, 'selectedOverlayLayer.'+type+'.'+feat.id);

        case a.OVERLAY_FEAT_SELECT:
            return Immutable.set(state, 'selectedOverlayFeat', action.payload);

                    
        case a.OVERLAY_SAVE:
            var overlay = state.selectedOverlayLayer;
            var pavi_id = state.selectedPavilion.id;
            if(!overlay.id) {
                overlay = Immutable.set(overlay, 'id', pavi_id)
            }
            state = Immutable.set(state, 'selectedOverlayLayer', overlay);
            return Immutable.extend(state, 'entities.overlays', {id: overlay} );
    }
    return state;
}


var mapReducer = function(state, action)
{
    switch(action.type){
        case a.DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawingMode', mode);

    }
    return state;
}
export default reduceReducers([pavilionReducer, baseReducer, overlayReducer, mapReducer])


function generateId(state, path){
    var ids = _.keys( Immutable.get(state, path) || {} );
    return ids.length ? _.max(ids) + 1 : 1;
}

