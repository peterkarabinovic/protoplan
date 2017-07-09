


/**
 * Init state
 */
export default {
    pavilions: {

    },
    map: {
        drawMode: undefined,
        size_m: undefined
    },
    selectedPavilion: undefined,
    selectedBase: undefined,
    selectedOverlay: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
        stand_categories: {},
        equipments: {} 
    },
    ui: {
        error: '',
        overlay: {
            types: {
                lines: 1,
                rects: 1,
                notes: 1
            },
            feat: undefined
        }
    }
}

export function drawMode(store) {
    return store.state.map.drawMode;
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
    return  pavi && baseById(store, pavi.id) || {};
}

export function overlayLayer(store) {
    var pavi = selectedPavilion(store);
    return  pavi && overlayById(store, pavi.id) || {};
}


export function selectedBase(store) {
    return store.state.selectedBase  || {};
}

export function selectedOverlay(store) {
    return store.state.selectedOverlay  || {};
}

export function selectedOverlayId(store) {
    return (selectedOverlay(store).id || -1).toString();
}

export function selectedOverlayFeat(store) {
    var feat = store.state.ui.overlay.feat;
    if(feat){
        var p = feat.split('.');
        return {cat: p[0], id: p[1]};
    }
    return null; 
}

export function lineType(store) {
    return store.state.ui.overlay.types.lines;
}
export function rectType(store) {
    return store.state.ui.overlay.types.rects;
}
export function noteType(store) {
    return store.state.ui.overlay.types.notes;
}