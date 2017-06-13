import SvgFileReader from '../svg/svg-file-reader.js'
import {transformation} from '../svg/svg-scale.js'

var svg_file_reader = SvgFileReader()


var vm = new Vue({
    el: '#svg-file',
    data: {
        error: ''
    },
    methods: {
        on_change: function(e){
            svg_file_reader(e)            
        }
    }
});

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

svg_file_reader.on('error', function(er){
    vm.error = er
})

var image = null;
svg_file_reader.on('new_svg', function(e){
    if(image){
        map.removeLayer(image)
    }
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};
    var img_size = {x: e.width, 
                    y: e.height};
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: transformation(map_size,img_size) });
    var bounds = [[0,0], [e.height, e.width]];
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);
})

var coord_vm = new Vue({
    el: '#coords',
    data: { x:0, y:0}
});

map.on('mousemove', function(e){
    var latlng = e.latlng;
    coord_vm.x = L.Util.formatNum(latlng.lng, 2);
    coord_vm.y = L.Util.formatNum(latlng.lat, 2);
})