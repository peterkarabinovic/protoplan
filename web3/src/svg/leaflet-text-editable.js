import {Text} from './leaflet-text.js'

export var EditableText = Text.extend({

    _rediectEditorEvents: function(e){
        e.target = this;
        this.fire(e.type, e, true);
    },

    onRemove: function(){
        Text.prototype.onRemove.call(this);
        this._map.off('zoomend', this._update, this);        
        if(this.polygon) {
            this.disableEdit();
        }
    },


    setText: function(text, noupdate){
        Text.prototype.setText.call(this, text, noupdate);
        if(this.polygon) {
            var ll = this.getLatLngs();
            var latLngs = [ll[0], L.latLng(ll[0].lat, ll[1].lng),ll[1], L.latLng(ll[1].lat, ll[0].lng),ll[0] ];
            this.polygon.setLatLngs(latLngs);
            this.polygon.editor.reset();
        }
    },

    enableEdit: function(map){
        var ll = this.getLatLngs();
        var latLngs = [ll[0], L.latLng(ll[0].lat, ll[1].lng),ll[1], L.latLng(ll[1].lat, ll[0].lng),ll[0] ];
        var style = {fill: true, weight:1, color: 'grey', fillOpacity: 0.1, opacity:0.1, editorClass: UniformRectEditor}
        
        this.polygon = L.polygon(latLngs, style).addTo(map);
        this.polygon.enableEdit(map);
        this.polygon.on('editable:dragend editable:vertex:dragend contextmenu', this._rediectEditorEvents, this);
        this.polygon.on('editable:vertex:drag editable:drag', this._dragVertex, this);
        this.editor = this.polygon.editor;
    },

    disableEdit: function(){
        if(!this.polygon) return;
        this.polygon.disableEdit();
        this.polygon.off('editable:dragend editable:vertex:dragend contextmenu', this._rediectEditorEvents, this);
        this.polygon.off('editable:vertex:drag editable:drag', this._dragVertex, this);
        this._map.removeLayer(this.polygon);
        this.editor = null;
        this.polygon = null;
    },

    _dragVertex: function(e){
        var ll = this.polygon.getLatLngs()[0];        
        this.setLatLngs([ll[0], ll[2]]);
    }

});


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