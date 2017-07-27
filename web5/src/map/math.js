import {Transformation} from 'leaflet/src/geometry/Transformation.js'
import {toPoint} from 'leaflet/src/geometry/Point.js'
import {toLatLng} from 'leaflet/src/geo/LatLng.js'

/**
 * Calculate map transformation 
 * @param {Size} map_size  - size of map's div
 * @param {Size} img_size  - size of images in custom unit (meters)
 */
export function transformation(map_size, img_size){
   
    var x_ratio = map_size.x / img_size.x;
    var y_ratio = map_size.y / img_size.y;
    if(x_ratio <= y_ratio){
        var a = x_ratio;
        var b = 0;
        var c = x_ratio;
        var d = (map_size.y - (x_ratio * img_size.y)) / 2;
    }
    else { 
        var a = y_ratio;
        var b = (map_size.x - (y_ratio * img_size.x)) / 2;
        var c = y_ratio;
        var d = 0;
    }
    return new Transformation(a,b,c,d);        
}

/**
 * Calculate max zoom
 * @param {Size} img_size - size of images in custom unit (meters)
 * @param {int} min_width - length of min visible width (default 10)
 */
export function maxZoom(img_size, min_width){
    min_width = min_width || 10;
    var max_width = Math.max(img_size.y, img_size.x)
    // var maxZoom = Math.log2( max_width / (1 * min_width) )   -- IE 11 not supported log2
    var maxZoom = Math.log( max_width / (1 * min_width) )  / Math.log(2)
    return Math.round(maxZoom);
}

/**
 * Constructor of Envelope
 * @param {*} min_x 
 * @param {*} min_y 
 * @param {*} max_x 
 * @param {*} max_y 
 */
function Env(min_x, min_y,max_x, max_y){
    return {
        min_x: min_x,
        min_y: min_y,
        max_x: max_x,
        max_y: max_y,
        intersection: function(env){
            return Env(
                Math.max(this.min_x, env.min_x),
                Math.max(this.min_y, env.min_y),
                Math.min(this.max_x, env.max_x),
                Math.min(this.max_y, env.max_y)
            )            
        },
        min: function(){ return toPoint(this.min_x, this.min_y); },
        max: function(){ return toPoint(this.max_x, this.max_y); },
        minLatLng: function(){ return toLatLng(this.min_y, this.min_x); },
        maxLatLng: function(){ return toLatLng(this.max_y, this.max_x); }
        
    }
}

/**
 * As LatLngBounds with its SouthNorthWestEast stuff mislead with planar metric space
 * Envelope seems more convenient 
 * @param {LatLngBounds} bounds 
 */
export function Envelope(bounds)
{
    return Env(
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
    )
}

export function toContainerEnvelope(env, map)
{
    var min = map.latLngToContainerPoint({lat: env.min_y, lng: env.min_x});
    var max = map.latLngToContainerPoint({lat: env.max_y, lng: env.max_x});
    return Env(min.x, min.y, max.x, max.y);
}

export function toLayerEnvelope(env, map)
{
    var min = map.latLngToLayerPoint({lat: env.min_y, lng: env.min_x});
    var max = map.latLngToLayerPoint({lat: env.max_y, lng: env.max_x});
    return Env(min.x, min.y, max.x, max.y);
}