/**
 * Extention for Leaflet.Editable editor for edit uiniform Rectangle
 */


export var UniformRectEditor = L.Editable.RectangleEditor.extend({

    lp: function(gp){
        return this.map.latLngToLayerPoint(gp);
    },
    gp: function(lp){
        return this.map.layerPointToLatLng(lp);
    },

    onVertexMarkerDragStart: function(e){
            var index = e.vertex.getIndex(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex];
        this.oppositePoint = this.lp(opposite);
        this.originPoint = this.lp(e.vertex.latlng);
        this.initDist = this.oppositePoint.distanceTo(this.originPoint);
    },

    extendBounds: function(e){

            var index = e.vertex.getIndex(),
                current = e.vertex.latlngs[index],
                next = e.vertex.getNext(),
                previous = e.vertex.getPrevious(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex];

                
            var ratio = this.oppositePoint.distanceTo(this.lp(e.latlng)) / this.initDist || 1;
            var scale = L.point(ratio, ratio);

            var newLatLng = this.gp(this.originPoint.subtract(this.oppositePoint).scaleBy(scale).add(this.oppositePoint));     
            var bounds = new L.LatLngBounds(newLatLng, opposite)
            // Update latlngs by hand to preserve order.
            e.vertex.latlng.update(newLatLng)
            e.vertex._latlng.update(newLatLng)
            previous.latlng.update([newLatLng.lat, opposite.lng]);
            next.latlng.update([opposite.lat, newLatLng.lng]);
            this.updateBounds(bounds);
            this.refreshVertexMarkers();
    }
});