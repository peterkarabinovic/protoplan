import {svgToBase64} from '../svg/svg-utils.js'
import * as math from '../svg/math.js' 
import {GridPanel} from '../svg/grid-panel.js'
import {t} from '../locale.js'


L.Browser.touch = false;


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
        on_change: function(e)
        {
            var file = e.target.files[0] 
            if(!file) return;
            if(file.type !== 'image/svg+xml') {
                this.error = t('invalid_svg_type', {type: file.type});
            }
            else {
                var reader = new FileReader();
                reader.onloadend = function(e){
                    var res = svgToBase64(reader.result)
                    res.fold(function(e) { vm.error = e},
                             function(e){
                                vm.width_px = vm.width_m = Math.round(e.width);
                                vm.height_px = vm.height_m = Math.round(e.height);
                                var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
                                var img_size_m = {x: e.width, y: e.height}               
                                var bounds = update_image_scale(map_size, img_size_m);
                                map.fitBounds(bounds);
                                gridPanel(img_size_m);
                                
                                new_svg(e, bounds);
                                new_canvas(e, bounds);
                             });
                }
                reader.readAsText(file)
            }
            
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
function update_image_scale(map_size, img_size_m){
    var trans =  math.transformation(map_size, img_size_m)
    map.options.crs = _.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]])    
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);

    map.setMaxZoom( math.maxZoom(img_size_m) );
        
    if(image) {
        image.setBounds(bounds);
        map.fitBounds(bounds);
        gridPanel(img_size_m);
    }
    return bounds
}

function new_svg(e, bounds) 
{
    if(image){
        map.removeLayer(image)
    }
    image = L.imageOverlay(e.data_uri, bounds).addTo(map);
 
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

    
};


function new_canvas(e, bounds)
{

    // points
    var env = math.Envelope(bounds); 
    var randomX = d3.randomUniform(env.min_x, env.max_x);
    var randomY = d3.randomUniform(env.min_y, env.max_y) 
    var points = [];
    for (var i = 0; i < 10000; i++) {
        points.push({x:randomX(), y:randomY() })
    }

    var memoryImages = new Image()
    memoryImages.src = e.data_uri;
    memoryImages.onload = function(){
        L.canvasLayer()
         .delegate(ca)    
         .addTo(map);
    }

    var ca = {}
    ca.onDrawLayer = function(info) 
    {
        var ctx = info.canvas.getContext('2d');
        ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
        var env = math.Envelope(info.bounds); 
        var layer_env = math.toLayerEnvelope(env, info.layer._map)
        var container_env = math.toContainerEnvelope(env, info.layer._map)
        console.log('map.getPixelOrigin()',info.layer._map.getPixelOrigin())
        console.log('env',env)
        console.log('layer_env',layer_env)
        console.log('container_env',container_env)



        {
        // ctx.fillStyle = "rgba(255,116,0, 1)";
        // points.forEach( p => {
        //     if(!info.bounds.contains([p.y, p.x])) {
        //         return;
        //     }
        //     var dot = info.layer._map.latLngToContainerPoint([p.y, p.x]);
        //     ctx.beginPath();
        //     ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        //     ctx.fill();
        //     ctx.closePath();
        // })
        }
    }
    

}
