import SvgFileReader from '../svg/svg-file-reader.js'
import {transformation} from '../svg/transformation.js'
import {AxisWidget} from '../svg/svg-scale-axis.js'

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
    // vm.height_m = newVal; 
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

function update_image_scale(img_size_m){
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};

    var trans =  transformation(map_size, img_size_m)
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]])    
    var bounds =  [[0,0], [img_size_m.y, img_size_m.x]];      

    // set max zoom
    var maxZoom = Math.floor(Math.sqrt(Math.max(img_size_m.y, img_size_m.x) / 10 ))
    map.setMaxZoom(maxZoom);
        
    if(image) {
        image.setBounds(bounds);
        map.fitBounds(bounds);
    }
    return bounds


}

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

    var img_size_m = {x: e.width*0.5, 
                    y: e.height*0.5}               
    var bounds = update_image_scale( img_size_m)     
    // map.options.crs = _.extend({}, L.CRS.Simple, {transformation: transformation(map_size,img_size) });

    // var bounds = [[0,0], [img_size_m.y, img_size_m.x]];
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);
    

    axis(img_size_m)

})

// var vm2 = new Vue({
//     el: '#coords',
//     data:{
//         x:0,
//         y:0
//     }
// })

// map.on('mousemove', function( e) {
//     vm2.x = e.latlng.lng
//     vm2.y = e.latlng.lat
// })