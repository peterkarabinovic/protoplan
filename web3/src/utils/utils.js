
export function str() {
    return "".concat.apply("",arguments);
}

export function startswith(str, substr) { 
    return str && str.indexOf(str) === 0;
};

export function toLatLngs(points) {
    return points.map(function(p){ return  L.latLng(p[1], p[0])});
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

