import {Immutable} from './utils/fp.js'
import {reduceReducers} from './utils/redux.js'
import {str} from './utils/utils.js'
import * as a from './actions.js'


var errorReducer = function(state, action){
    switch(action.type){
        case a.ERROR_SET:
            return Immutable.set(state, 'ui.error', action.payload);
    }
    state = Immutable.set(state, 'ui.error');
    return state;
}

var mapReducer = function(state, action)
{
    switch(action.type){
        case a.DRAWING_MODE_SET:
            var mode = action.payload;
            return Immutable.set(state, 'map.drawMode', mode);

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
                state = Immutable.set(state, 'selectedOverlay');
                state = Immutable.set(state, 'ui.overlay.feat');
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
                state = Immutable.set(state, str('entities.bases.',pavi.id), base);                
                state = Immutable.set(state, 'map.size_m', base.size_m);
                var overlay = state.entities.overlays[pavi.id] || {id:pavi.id};
                state = Immutable.set(state, 'selectedOverlay', overlay);
                state = Immutable.set(state, str('entities.overlays.',pavi.id), overlay);
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
                    state = Immutable.set(state, 'selectedBase', base)
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
        case a.OVERLAYS_LOADED:
            return Immutable.set(state, 'entities.overlays', action.payload);

        case a.OVERLAY_FEAT_ADD: 
            var cat = action.payload.cat;
            var feat = action.payload.feat;
            feat = _.extend({}, feat, {
                id: generateId(state, 'selectedOverlay.'+cat),
                type: state.ui.overlay.types[cat]
            });
            state = Immutable.set(state, 'ui.overlay.feat', str(cat,'.',feat.id));
            return Immutable.set(state, str('selectedOverlay.',cat,'.',feat.id), feat);

        case a.OVERLAY_FEAT_UPDATE: 
            var cat = action.payload.cat;
            var feat = action.payload.feat;
            return Immutable.extend(state, 'selectedOverlay.'+cat+'.'+feat.id, feat);

        case a.OVERLAY_FEAT_DELETE: 
            var feat_id = state.ui.overlay.feat,
                p = feat_id.split('.'),
                cat = p[0],
                id = +p[1];
            state = Immutable.remove(state, 'selectedOverlay.'+cat+'.'+id);
            return Immutable.remove(state, 'ui.overlay.feat');

        case a.OVERLAY_FEAT_SELECT:
            var feat_id = action.payload;
            if(feat_id) {
               var p = feat_id.split('.'),
                   cat = p[0],
                   id = +p[1];
                var feat = state.selectedOverlay[cat][id];
                state = Immutable.set(state, str('ui.overlay.types.',cat), feat.type);
            }
            return Immutable.set(state, 'ui.overlay.feat', feat_id);
        
        case a.OVERLAY_TYPE_SELECT:
            var p = action.payload;
            state = Immutable.set(state, str('ui.overlay.types.',p.feat.cat), p.type_id);
            return Immutable.set(state, str('selectedOverlay.',p.feat.cat,'.',p.feat.id, '.type'),  p.type_id)

        case a.OVERLAY_SAVED:
            var overlay = action.payload;
            if(state.pavilions[overlay.id]) {
                state = Immutable.set(state, 'entities.overlays.'+overlay.id, overlay);
                if(state.selectedPavilion && overlay.id == state.selectedPavilion.id)
                    state = Immutable.extend(state, 'selectedOverlay', overlay)
            }
            else {
                state = Immutable.remove(state, 'entities.overlays.'+overlay.id);
            }
            return state;

        case a.OVERLAY_ROLLBACK:
            var overlay = state.selectedOverlay;
            overlay = state.entities.overlays[overlay.id];
            return Immutable.set(state, 'selectedOverlay', overlay);
    }
    return state;
}



export default reduceReducers([errorReducer, mapReducer, pavilionReducer, baseReducer, overlayReducer])


function generateId(state, path){
    var ids = _.keys( Immutable.get(state, path) || {} );
    return ids.length ? +_.max(ids) + 1 : 1;
}

