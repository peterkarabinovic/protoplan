/**
 * Function for conversions feature and types into styles and objects of leaflets
 */

/**
 * 
 */

var latLng = L.latLng;
var polyline = L.polyline;
var polygon = L.polygon;

export function toPolyline(line)
{
    var poly = polyline(toLatLngs(line.points), lineStyle(line));
    poly.id = line.id;
    poly.style = line.style;
    return poly;
}

export function toLine(polyline){
    return {
        points: toPoints(polyline.getLatLngs()),
        id: polyline.id,
        style: polyline.style
    }
}

export function toRect(carpet){
    var poly = polygon(toLatLngs(carpet.points), rectStyle(carpet));
    poly.id = line.id;
    poly.style = line.style;
    return poly;
}

export function toCarpet(polygon){
    return toLine(polygon);
}


function toLatLngs(points) {
    return points.map(function(p){ return  latLng(p[1], p[0])});
}

function toPoints(latLngs){
    return latLngs.map(function(ll){ return [ll.lng, ll.lat] });
}


function lineStyle(line){
    return {weight:2, color: 'red'}
}

function rectStyle(rect){
    return {weight:2, color: 'red'}
}
