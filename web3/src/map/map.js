import * as math from './math.js'
import * as a from '../actions.js'
import {GridPanel} from './grid-panel.js'
import {handle} from '../utils/redux.js'

L.Browser.touch = false;

export default function(el, store)
{
    map = L.map(el, 
    {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        editable: true
    });
    window.map = map;

    gridPanel = GridPanel(map);

    // we sore on server as array [lng, lat]
    map.toPoints = function(latLngs){
        latLngs = _.flatten(latLngs);
        return latLngs.map(map.snap).map(function(ll){ return [ll.lng, ll.lat] });
    }


    map.on('click', function(){
        store(a.UNSELECT_ALL);
    })
    // State changes
    store.on('map.size_m', function(e) { updateMapSize(e.new_val); });
    return map;
}

var map  = null;
var gridPanel = null;

function updateMapSize(size_m)
{
    if(!size_m) return;
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  math.transformation(map_size, size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( math.maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map.getZoom()))
        map.fitBounds(bounds);
    gridPanel(size_m);
    return bounds;
}

