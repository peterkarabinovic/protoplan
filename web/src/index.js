import {svgToBase64} from './svg/svg-utils.js'
import * as math from './svg/math.js' 
import {GridPanel} from './svg/grid-panel.js'
import {t} from './locale.js'


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
                                var img_size_m = {x: e.width, y: e.height}               
                                var bounds = update_image_scale(img_size_m);
                                map.fitBounds(bounds);
                                gridPanel(img_size_m);
                                
                                 new_svg(e, bounds);
                                //new_canvas2(e, bounds);
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
            
            var points = this.line.getLatLngs()
                             .map( function(ll) { return map.latLngToContainerPoint(ll); });
            var length_px = points[0].distanceTo(points[1]);

            var ratio = this.lineLength / length_px;
            var img_size_m = {
                x: this.width_px * ratio,
                y: this.height_px * ratio
            };
            update_image_scale(img_size_m);
            // var latLngs = points.map(function(p) { return map.latLngToContainerPoint(p);});
            // this.line.setLatLngs(latLngs);


            this.line.bindTooltip(this.lineLength + ' м', {permanent:true, interactive:true});
        }
    },
    computed: {
        widthHeight: function(){
            return  this.width_m ? (this.width_m + " м / " + this.height_m + " м") : "";
        }
    }
});

window.vm = vm;

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
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  math.transformation(map_size, img_size_m)
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-img_size_m.y, -img_size_m.x], [img_size_m.y*2, img_size_m.x*2]])    
    var bounds =  L.latLngBounds([[0,0], [img_size_m.y, img_size_m.x]]);

    map.setMaxZoom( math.maxZoom(img_size_m) );
        
    if(image) {
        image.setBounds(bounds);
        // map.fitBounds(bounds);
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
};

map.on('moveend', function(){
    console.log('moveend');
})

function new_canvas2(e, img_bounds) {
    var img_size = {x: e.width, y: e.height};
    var map_size = map.getSize();
    var img_env = math.Envelope(img_bounds);
    var ppm = L.point(img_size.x / img_env.max_x, img_size.y / img_env.max_y) ; // pixels per meter


    var img = new Image();
    img.src = e.data_uri;
    img.onload = function()
    {
        L.canvasLayer2(drawImage).addTo(map)
    }

    function drawImage(canvas)
    {
        var container_img_env = math.toContainerEnvelope(img_env, map);
        var canvas_place = { 
            x: Math.max(0, container_img_env.min_x),
            y: Math.max(0, container_img_env.min_y)
        } 
        var canvas_img_size = {
            width: Math.min(container_img_env.max_x, map_size.x) - canvas_place.x,
            height: Math.min(container_img_env.max_y, map_size.y) - canvas_place.y,
        }
        var zoom = map.getZoom()
        var visible_env = math.Envelope(map.getBounds()).intersection(img_env);
        var img_clip_place = visible_env.min().scaleBy(ppm).round();
        var img_clip_size = visible_env.max().scaleBy(ppm).round().subtract(img_clip_place);


        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.clearRect(canvas_place.x, canvas_place.y, canvas_img_size.width, canvas_img_size.height);
        ctx.drawImage(img, img_clip_place.x, 
                           img_clip_place.y, 
                           img_clip_size.x, 
                           img_clip_size.y, 
                           canvas_place.x, 
                           canvas_place.y, 
                           canvas_img_size.width, canvas_img_size.height );

        // var visible_min = visible_env.min().scaleBy(ppm).round();
        // var visible_max = visible_env.max().scaleBy(ppm).round();
        // console.log('visible_min',visible_min);
        // console.log('visible_max',visible_max);
        // console.log( 'drawImage', img_clip_place.x, img_clip_place.y, img_clip_size.x, img_clip_size.y, canvas_place.x, canvas_place.y, canvas_img_size.width, canvas_img_size.height )

        // console.log(canvas.width, canvas.height);
        // console.log('map.env', math.Envelope(map.getBounds()));
        // console.log('img.env', img_env);
        // console.log('visible_env',visible_env)
        // console.log('img.size',img_size);
        // console.log('map size', map.getSize());
        // console.log('container map.env', math.toContainerEnvelope(math.Envelope(map.getBounds()), map));
        // console.log('container img.env', math.toContainerEnvelope(math.Envelope(img_bounds), map));
        // console.log('layer img.env', math.toLayerEnvelope(math.Envelope(img_bounds), map));
        // console.log('map. getPixelOrigin', map.getPixelOrigin());
    }


}
