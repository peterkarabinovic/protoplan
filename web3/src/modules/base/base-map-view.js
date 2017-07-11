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
            var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer = L.imageOverlay(url, bounds, {crossOrigin: true}).addTo(map);
            map.fitBounds(bounds);
        }
    });

    store.on('selectedBase.size_m', function(e){
        var size_m = e.new_val;
        if(baseLayer && size_m) {
            var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
            baseLayer.setBounds(bounds);    
        }
    });
}