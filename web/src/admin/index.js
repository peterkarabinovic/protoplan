import SvgFileReader from '../svg/svg-file-reader.js'
import {transformation} from '../svg/transformation.js'
import {GridPanel} from '../svg/grid-panel.js'


L.Browser.touch = false;

var svg_file_reader = SvgFileReader()

var vm = new Vue({
    el: '#app',
    data: {
        error: '',
        width_m: null,
        height_m: null,
        width_px: null,
        height_px: null,
        line: null,
        lineLength: null
    },
    methods: {
        on_change: function(e){
            svg_file_reader(e)            
        },
        on_line: function(e){
            this.line = map.editTools.startPolyline(undefined, {weight:1, color: 'red'});
        },
        needLine: function(){
            return this.width_m && !this.line;
        },
        isLine: function(){
            return this.line && this.line.getLatLngs().length == 2;
        },
        recalculateScale: function(){
            var bounds = this.line.getBounds();
            this.line.bindTooltip('dsdsds');
        }
    },
    computed: {
        widthHeight: function(){
            return  this.width_m ? (this.width_m + " м / " + this.height_m + " м") : "";
        }
    }
});

var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false,
    editable: true,
    editOptions: {
        skipMiddleMarkers: true
    }
});

map.on('editable:editing', function(event){
    var line = event.layer;
    if(line.getLatLngs().length == 2)
        map.editTools.stopDrawing();
});



var gridPanel = GridPanel(map);

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

svg_file_reader.on('error', function(er){
    vm.error = er
})

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
