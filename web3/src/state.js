


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
    selectedStandsId: undefined,
    entities: {
        bases: {}, // base layers,
        overlays: {}, // additinal layers
        stands: {},
        stand_types: {},
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
            feat: undefined,
            text: 'Text label'
        },
        stands: {
            type: 1,
            sel: undefined
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
export var standsById = _.partial(entity, 'stands');

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
        var f = {cat: p[0], id: p[1]};
        feat = store.state.selectedOverlay[f.cat][f.id];
        return _.extend(f, feat);
    }
    return null; 
}

export function selectedOverlayText(store){
    return store.state.ui.overlay.text;
}
export function overlayNoteType(store){
    return store.state.ui.overlay.types.notes;
}

export function selectedStandsId(store) {
    return store.state.selectedStandsId;
}

export function selectedStands(store){
    var id = store.state.selectedStandsId;
    return standsById(store, id); 
}

export function selectedStand(store){
    var stands_id = store.state.selectedStandsId;
    var id = store.state.ui.stands.sel;
    return standsById(store, stands_id)[id]; 
}