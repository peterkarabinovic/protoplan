

export function Snapper(map){
    var gradation = 0.5;

    map.on("zoomend", function(){
        var dz = map.getMaxZoom() - map.getZoom();
        gradation = dz * 0.5 + 0.5;
    });

    map.snap = function(latlng){
        latlng.lat = Math.round(latlng.lat / gradation) * gradation; 
        latlng.lng = Math.round(latlng.lng / gradation) * gradation; 
        return latlng;
    }
}