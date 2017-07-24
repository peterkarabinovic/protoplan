

export function Snapper(map){
    var gradation = 0.5;
    var gradations = {
        0: 0.5,
        1: 1,
        2: 1,
        3: 5,
        4: 5,
        5: 5,
        6: 5,
        7: 10,
        8: 10,
        9: 10,
        10: 10
    }

    map.on("zoomend", function(){
        var dz = map.getMaxZoom() - map.getZoom();
        // gradation = dz * 0.5 + 0.5;
        gradation = gradations[dz] || gradations[10];
        console.log('dz', dz)
        console.log('gradation', gradation)
    });

    map.snap = function(latlng){
        // var lp = map.latLngToLayerPoint(latlng)
        // lp.x = Math.round(lp.x / gradation) * gradation; 
        // lp.y = Math.round(lp.y / gradation) * gradation; 
        // return map.layerPointToLatLng(lp);
        latlng.lat = Math.round(latlng.lat / gradation) * gradation; 
        latlng.lng = Math.round(latlng.lng / gradation) * gradation; 
        return latlng;
    }
}