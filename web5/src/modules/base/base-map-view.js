import {toLatLngBounds} from 'leaflet/src/geo/LatLngBounds.js'
import {imageOverlay} from 'leaflet/src/layer/ImageOverlay.js'
import {toLatLngs} from '../../utils/utils.js'
import {selectedBase} from '../../state.js'
import {Grid} from '../../svg/leaflet-grid.js'


export default function (store, map)
{
    var m ={
        baseLayer: null,
        grid: null
    }

    store.on('selectedBase.url', function(e){
        var url = e.new_val;        
        if(m.baseLayer) {
            map.removeLayer(m.baseLayer);
            m.baseLayer = null;
            map.removeLayer(m.grid);
            m.grid = null;
        }
        if(url) {
            var size_m = selectedBase(store).size_m
            var b =  toLatLngBounds([[0,0], [size_m.y, size_m.x]]);
            m.baseLayer = imageOverlay(url, b, {crossOrigin: true}).addTo(map);
            map.fitBounds(b);
        }
    });

    store.on('selectedBase.size_m', function(e){
        var size_m = e.new_val;
        if(m.baseLayer && size_m) {
            var b =  toLatLngBounds([[0,0], [size_m.y, size_m.x]]);
            m.baseLayer.setBounds(b);  
        }
    });

    store.on('selectedBase.grid', function(e){
        if(e.new_val) {
            var d = e.new_val;
            var b = toLatLngBounds(toLatLngs([d.topLeft, d.bottomRight]));
            var latlngs = [b.getSouthWest(), b.getNorthWest(),b.getNorthEast(),b.getSouthEast()];
            if(m.grid) {
                if(!m.grid.editor || !m.grid.editor.enabled())
                    m.grid.setLatLngs(latlngs);
            }
            else 
                m.grid = new Grid(latlngs).addTo(map)
        }
    });

    return m;
}