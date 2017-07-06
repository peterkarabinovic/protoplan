


/**
 * Init state
 */
export default {
    pavilions: {

    },
    map: {
        drawingMode: undefined,
        size_m: undefined
    },
    selectedPavilion: undefined,
    selectedBaseLayer: undefined,
    selectedOverlayLayer: undefined,
    selectedOverlayFeat: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
        stand_categories: {},
        equipments: {} 
    },
    ui: {
        error: ''
    }
}

function entity(type, store, id)
{
    var e = store.state.entities[type];
    return e && e[id] || {};
}

export var baseById = _.partial(entity, 'bases');
export var overlayById = _.partial(entity, 'overlays');

export function selectedPavilion(store){
    return store.state.selectedPavilion;
}

export function baseLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && pavi.base &&  baseById(store, pavi.base) || {};
}

export function overlayLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && pavi.overlay &&  overlayById(store, pavi.overlay) || {};
}


export function selectedBaseLayer(store) {
    return store.state.selectedBaseLayer  || {};
}