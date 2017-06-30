import * as math from './math.js'
import {GridPanel} from './grid-panel.js'

import {handle} from '../utils/redux.js'

L.Browser.touch = false;

var reducer = handle(
    {
        drawing_mode: null,
    },
    {
        DRAWING_MODE_SET: function(state, action){
            var mode = action.payload;
            return _.extend({}, state, {drawing_mode: mode});
        }
    }
);

var Map = function(el, store)
{
    map = L.map(el, 
    {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        editable: true,
            editOptions: {
                skipMiddleMarkers: true
            }
    });

    gridPanel = GridPanel(map);

    // State changes
    store.on('layers.base', function(e) { updateBaseLayer(e.new_val); });
    store.on('layers.base.size_m', function(e) { updateBaseLayerSize(e.new_val); });
    return map;
}

Map.reducer = reducer;

export default Map;


var map  = null;
var baseLayer = null;
var gridPanel = null;

function updateBaseLayer(img)
{
    if(baseLayer) {
        map.removeLayer(baseLayer);
    }
    var bounds = updateBaseLayerSize(img.size_m);
    baseLayer = L.imageOverlay(img.url, bounds).addTo(map);
}

function updateBaseLayerSize(size_m)
{
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  math.transformation(map_size, size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( math.maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map.getZoom()))
        map.fitBounds(bounds);
    gridPanel(size_m);
    if(baseLayer)
        baseLayer.setBounds(bounds);
    return bounds;
}