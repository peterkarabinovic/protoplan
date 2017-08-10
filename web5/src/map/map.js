import _  from '../es6/underscore.js'
import {Editable} from '../es6/Leaflet.Editable.js'
import * as math from './math.js'
import * as a from '../actions.js'
// import {GridPanel} from './grid-panel.js'
import {EventHandlerStack} from '../utils/leaflet-handler-stack.js'
import {Map} from 'leaflet/src/map/index.js'
import {Simple as CRSSimple} from "leaflet/src/geo/crs/CRS.Simple.js"
import {toLatLngBounds} from 'leaflet/src/geo/LatLngBounds.js'


export default function(el, store)
{
    map = new Map(el, 
    {
        crs: CRSSimple,
        zoomControl: false,
        attributionControl: false,
        editable: true,
        // zoomAnimation: false
    });
    window.map = map;

    map.ll2cp = map.latLngToContainerPoint;
    map.ll2lp = map.latLngToLayerPoint;

    map = EventHandlerStack(map);
    // gridPanel = GridPanel(map);

    // we store on server as array [lng, lat]
    map.toPoints = function(latLngs){
        latLngs = _.flatten(latLngs);
        return latLngs.map(map.snap).map(function(ll){ return [ll.lng, ll.lat] });
    }


    map.inqueue_on('click', function(){
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
    map.options.crs = _.extend({}, CRSSimple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( math.maxZoom(size_m) );
    var bounds =  toLatLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map.getZoom()))
        map.fitBounds(bounds);
    // gridPanel(size_m);
    return bounds;
}

