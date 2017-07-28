import {toLatLngBounds} from 'leaflet/src/geo/LatLngBounds.js'
import {imageOverlay} from 'leaflet/src/layer/ImageOverlay.js'
import {selectedBase} from '../../state.js'


export default function (store, map)
{
    var baseLayer = null;

    store.on('selectedBase.url', function(e){
        var url = e.new_val;        
        if(baseLayer) {
            map.removeLayer(baseLayer);
            baseLayer = null;
        }
        if(url) {
            var size_m = selectedBase(store).size_m
            var bounds =  toLatLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer = imageOverlay(url, bounds, {crossOrigin: true}).addTo(map);
            map.fitBounds(bounds);
        }
    });

    store.on('selectedBase.size_m', function(e){
        var size_m = e.new_val;
        if(baseLayer && size_m) {
            var bounds =  toLatLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer.setBounds(bounds);    
        }
    });
}