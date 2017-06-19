import SvgFileReader from '../svg/svg-file-reader.js'
import {transformation} from '../svg/transformation.js'
import {GridPanel} from '../svg/grid-panel.js'

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
    },
    computed: {
        width: {
            get: function(){ return this.width_m;},
            set: function(val) {
                if(+val <= 1) return;
                this.width_m = +val;
                this.height_m = Math.round((this.height_px / this.width_px) * this.width_m);
                update_image_scale({x:this.width_m, y: this.height_m});
            }
        },
        height: {
            get: function(){ return this.height_m;},
            set: function(val) {
                if(+val <= 1) return;
                this.height_m = +val;
                this.width_m = Math.round((this.width_px / this.height_px) * this.height_m);
                update_image_scale({x:this.width_m, y: this.height_m});
            }
        }
        
    }
});


var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false
});

var gridPanel = GridPanel(map);

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
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);

    // set max zoom
    var max_dimension = Math.max(img_size_m.y, img_size_m.x)
    // var maxZoom = Math.log2( max_dimension / (1 * 10) )   -- IE 11 not supported log2
    var maxZoom = Math.log( max_dimension / (1 * 10) )  / Math.log(2)
    maxZoom =  Math.round(maxZoom)
    map.setMaxZoom(maxZoom);
        
    if(image) {
        image.setBounds(bounds);
        map.fitBounds(bounds);
        gridPanel(img_size_m);
    }
    return bounds


}

svg_file_reader.on('new_svg', function(e){
    if(image){
        map.removeLayer(image)
    }
    vm.width_px = vm.width_m = Math.round(e.width);
    vm.height_px = vm.height_m = Math.round(e.height);
    var map_div = document.getElementById('map');
    var map_size = {x: map_div.offsetWidth,
                    y: map_div.offsetHeight};
    var img_size = {x: e.width, 
                    y: e.height};

    var img_size_m = {x: e.width, 
                    y: e.height}               
    var bounds = update_image_scale( img_size_m)     

    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
    map.fitBounds(bounds);

    // {
    //     var randomX = d3.randomUniform(bounds[0][1], bounds[1][1]) 
    //     var randomY = d3.randomUniform(bounds[0][0], bounds[1][0]) 
    //     for(var i=0; i<100; i++) {
    //         var x = randomX();
    //         var y = randomY();
    //         var b = [[y,x],[y+20,x+20]];
    //         var image2 = L.imageOverlay('svg/examples/atm.svg', 
    //                         b, 
    //                         {interactive: true}).addTo(map);

    //         // image2.on('mousedown click mousemove mouseover mouseout contextmenu', function(e){
    //         //     console.log('mousedown')
    //         //     L.DomEvent.preventDefault(e)
    //         //     L.DomEvent.stop(e)
    //         // })

    //         var draggable = new L.Draggable(image2._image);
    //         draggable.enable();
    //         draggable.on('dragend', function(e){
    //             console.log(e);
    //         })
    //     }

    // }

    gridPanel(img_size_m)
})

var vm2 = new Vue({
    el: '#coords',
    data:{
        x:0,
        y:0
    }
})

map.on('mousemove', function( e) {
    vm2.x = e.latlng.lng
    vm2.y = e.latlng.lat
})