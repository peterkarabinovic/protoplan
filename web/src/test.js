import * as math from './svg/math.js' 
import {GridPanel} from './svg/grid-panel.js'


var img_size_m = {x: 1000, y: 500}

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

var gridPanel = GridPanel(map);

var vm = new Vue({
    el: "#form",
    data: {
        m_px: 0
    },
    methods: {
        update: function(){
            update(this.m_px)
        }
    }
});

function update(m_px) 
{
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    if(m_px)
    {
        img_size_m.x = map_size.x * m_px;
        img_size_m.y = map_size.y * m_px;
    }
    else {
        m_px = img_size_m.x / map_size.x;
        vm.m_px = m_px;
    }
    var trans =  math.transformation(map_size, img_size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]])    
    map.setMaxZoom( math.maxZoom(img_size_m) );
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);
    map.fitBounds(bounds);

    gridPanel(img_size_m);
}

update()


