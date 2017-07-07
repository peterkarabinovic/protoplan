import {Immutable} from './utils/fp.js'
import {reduceReducers} from './utils/redux.js'
import {str} from './utils/utils.js'
import * as a from './actions.js'


var mapReducer = function(state, action)
{
    switch(action.type){
        case a.DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawingMode', mode);

    }
    return state;
}

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
                state = Immutable.set(state, 'selectedBase');
            }
            return state;

        case a.PAVILION_ADDED:
            var pavi = action.payload;
            state = Immutable.set(state, 'pavilions.'+pavi.id, pavi);
            state = Immutable.set(state, 'selectedPavilion', pavi);
            state = Immutable.set(state, 'selectedBase', {id:pavi.id});
            return state;

        case a.PAVILION_SELECT:
            var pavi = action.payload;
            state = Immutable.set(state, 'selectedPavilion', pavi);
            if(pavi) {
                var base = state.entities.bases[pavi.id] || {id: pavi.id}
                state = Immutable.set(state, 'selectedBase', base);
                state = Immutable.set(state, 'map.size_m', base.size_m);
                var overlay = state.entities.overlays[pavi.id] || {id:pavi.id};
                state = Immutable.set(state, 'selectedOverlay', base);
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
            state = Immutable.extend(state, 'selectedBase', base);
            return Immutable.set(state, 'map.size_m', base.size_m);
        
        case a.BASE_DISTANCE_LENGTH_SET:
            var length_m = action.payload;
            var ratio =  length_m / state.selectedBase.distance.length_m;
            var size_m = state.selectedBase.size_m;
            size_m = {
                x: size_m.x * ratio,
                y: size_m.y * ratio
            };
            state = Immutable.set(state, 'map.size_m', size_m);
            state = Immutable.set(state, 'selectedBase.size_m', size_m );
            return Immutable.set(state, 'selectedBase.distance.length_m', length_m);             
        
        case a.BASE_DISTANCE_SET: 
            var distance = action.payload;
            return Immutable.set(state, 'selectedBase.distance', distance);

        case a.BASE_LAYER_SAVED:
            var base = action.payload;
            if(state.pavilions[base.id]) {
                state = Immutable.set(state, 'entities.bases.'+base.id, base);
                if(state.selectedPavilion && base.id == state.selectedPavilion.id)
                    state = Immutable.extend(state, 'selectedBase', base)
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
            var cat = action.payload.cat;
            var feat = action.payload.feat;
            feat = _.extend({}, feat, {
                id: generateId(state, 'selectedOverlay.'+cat),
                type: state.ui.overlay.types[cat]
            })
            state = Immutable.set(state, 'ui.overlay.feat', str(cat,'.',feat.id));
            return Immutable.set(state, 'selectedOverlay.'+cat+'.'+feat.id, feat);

        case a.OVERLAY_FEAT_UPDATE: 
            var type = action.payload.type;
            var feat = action.payload.feat;
            return Immutable.set(state, 'selectedOverlay.'+type+'.'+feat.id, feat);

        case a.OVERLAY_FEAT_DELETE: 
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            state = Immutable.remove(state, 'selectedOverlay.'+cat+'.'+id);
            return Immutable.remove(state, 'ui.overlay.feat');

        case a.OVERLAY_FEAT_SELECT:
            return Immutable.set(state, 'ui.overlay.feat', action.payload);

                    
        case a.OVERLAY_SAVE:
            var overlay = state.selectedOverlay;
            var pavi_id = state.selectedPavilion.id;
            if(!overlay.id) {
                overlay = Immutable.set(overlay, 'id', pavi_id)
            }
            state = Immutable.set(state, 'selectedOverlay', overlay);
            return Immutable.extend(state, 'entities.overlays', {id: overlay} );
    }
    return state;
}



export default reduceReducers([mapReducer, pavilionReducer, baseReducer, overlayReducer])


function generateId(state, path){
    var ids = _.keys( Immutable.get(state, path) || {} );
    return ids.length ? _.max(ids) + 1 : 1;
}

