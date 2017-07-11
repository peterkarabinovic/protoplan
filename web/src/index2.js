import {svgToBase64} from './svg/svg-utils.js'
import * as math from './svg/math.js'


d3.text('svg/schema.svg', function(error, svg){
    if (error) return;
    var e = svgToBase64(svg).right();
    var map1 = map('map1', e), 
        map2 = map('map2', e);

    var image = L.imageOverlay(e.data_uri, map1[1]).addTo(map1[0]);
    canvasDraw(e, map2[1], map2[0])

});

function map(el, e)
{
    var map = L.map(el, {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
    });

    var img_size = {x: e.width, y: e.height};
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  math.transformation(map_size, img_size);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans }); 
    map.setMaxBounds([[-img_size.y, -img_size.x], [img_size.y*2, img_size.x*2]]);
    var bounds =  L.latLngBounds([[0,0], [img_size.y, img_size.x]]);
    map.setMaxZoom( math.maxZoom(img_size) );
    map.fitBounds(bounds);
    return [map, bounds];
}

function canvasDraw(e, img_bounds, map){
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
        ctx.drawImage(img, img_clip_place.x, 
                           img_clip_place.y, 
                           img_clip_size.x, 
                           img_clip_size.y, 
                           canvas_place.x, 
                           canvas_place.y, 
                           canvas_img_size.width, canvas_img_size.height );
    }
   
}
