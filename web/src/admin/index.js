import SvgFileReader from '../svg/svg-file-reader.js'
import {transformation} from '../svg/svg-scale.js'
import {AxisWidget} from '../svg/svg-axis.js'

var svg_file_reader = SvgFileReader()


var vm = new Vue({
    el: '#svg-file',
    data: {
        error: '',
        width_m: null,
        height_m: null,
        width_px: null,
        height_px: null
    },
    methods: {
        on_change: function(e){
            svg_file_reader(e)            
        }
    }
});

vm.$watch('width_m', function(newVal){
    vm.height_m = newVal; 
});

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

var axis = AxisWidget(map._container, map)

svg_file_reader.on('error', function(er){
    vm.error = er
})

var image = null;
svg_file_reader.on('new_svg', function(e){
    if(image){
        map.removeLayer(image)
    }
    vm.width_px = vm.width_m = e.width;
    vm.height_px = vm.height_m = e.height;
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};
    var img_size = {x: e.width, 
                    y: e.height};
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: transformation(map_size,img_size) });
    var bounds = [[0,0], [e.height, e.width]];
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);
    map.setMaxBounds([[-e.height, -e.width], [e.height*2, e.width*2]])

    // set max zoom
    var maxZoom = Math.floor(Math.sqrt(Math.max(e.height, e.width) / 10 ))
    map.setMaxZoom(maxZoom);
    axis()

})

