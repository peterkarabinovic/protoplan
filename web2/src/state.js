


/**
 * Init state
 */
export default {
    pavilions: {

    },
    map: {
        drawing_mode: undefined,
    },
    selectedPavilion: undefined,
    selectedBaseLayer: undefined,
    edit_feature: undefined,
    entities: {
        base: {}, // base layers,
        overlays: {}, // additinal lauers
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

export var baseById = _.partial('base');

export function selectedPavilion(store){
    return store.state.selectedPavilion;
}

export function baseLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && pavi.base &&  baseById(store, pavi.base) || {};
}

export function selectedBaseLayer(store) {
    return store.state.selectedBaseLayer  || {};
}