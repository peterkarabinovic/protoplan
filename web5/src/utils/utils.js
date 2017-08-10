import {toLatLng} from 'leaflet/src/geo/LatLng.js'
import * as Util from 'leaflet/src/core/Util.js';


export function str() {
    return "".concat.apply("",arguments);
}

export function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
};

export function toLatLngs(points) {
    return points.map(function(p){ 
        if(Util.isArray(p))
            return toLatLng(p[1], p[0])
        return toLatLng(p.y, p.x);
    });
}



/*
 * Selfcheck - wrap callback function for check if it already called in stack above
 */

export function Selfcheck(){
    var me = false;
    return function(callback){
        return function(){
            if(me) return; 
            me = true;
            try{var res = callback.apply(this, arguments); } finally {me = false;}
            return res;
        } 
    }
}

