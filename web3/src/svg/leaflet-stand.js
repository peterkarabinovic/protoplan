
export var Stand = L.Rectangle.extend({
    options: {
        fillColor: 'green',
        color: 'green',
        stroke: false,
        fillOpacity: 0.7,
    },
    

    initialize: function (latlngs, options, openWalls){
        openWalls = openWalls || 1;
        L.Rectangle.prototype.initialize.call(this, latlngs, options);
        var ll = this.getLatLngs();
        ll = _.rest(_.flatten(ll), openWalls-1);
        if(ll.length > 1)
            this.line = new DoubleLine(ll, {color: this.options.fillColor});
    },

    onAdd: function (map) {
        L.Rectangle.prototype.onAdd.call(this,map);
        if(this.line) map.addLayer(this.line);     
    },

    onRemove: function (map) {
        L.Rectangle.prototype.onRemove.call(this, map); 
        if(this.line) map.removeLayer(this.line);       
    },

    redraw: function(){
        L.Rectangle.prototype.redraw.call(this); 
        if(this.line) this.line.redraw();
    },

    update: function(latlngs, options, openWalls){
        this.setStyle(options);
        this.setLatLngs(latlngs);
        var ll = this.getLatLngs();
        ll = _.rest(_.flatten(ll), openWalls-1);
        if(this.line && this._map) 
            this._map.removeLayer(this.line);       
        if(ll.length > 1) {
            this.line = new DoubleLine(ll, {color: this.options.fillColor});
            if(this._map)
                this._map.addLayer(this.line);     
        }
        
    }

});

export var DoubleLine = L.Polyline.extend({
    options2: {color: 'white', weight: 7, lineCap: "square", lineJoin: "miter", opacity: 1},
    options1: {color: 'green', lineCap: "square", lineJoin: "miter", opacity: 0.7},
    // options1: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    // options2: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    
    initialize: function (latlngs, options1, options2){
        this.options1 = L.extend(this.options1, options1);
        this.options2 = L.extend(this.options2, options2);
        this.line2 = new L.Polyline([], this.options2);
        L.Polyline.prototype.initialize.call(this, latlngs, this.options1);
    },

    onAdd: function (map) {
        this.line2._map = map;
        this.line2._path = L.SVG.create('path');
        this._renderer._updateStyle.call(this._renderer, this.line2);
        this._renderer._addPath.call(this._renderer, this.line2);
        L.Polyline.prototype.onAdd.call(this, map);
        // this.line2._path.setAttribute('transform', 'translate(1,1)');
        // this._path.setAttribute('transform', 'translate(1,1)');
        
    },

    onRemove: function (map) {
        this._renderer._removePath.call(this._renderer, this.line2);
        L.Polyline.prototype.onRemove.call(this, map);
    },

    _updatePath: function(){
        this.line2._parts = this._parts;
        this._renderer._updatePoly.call(this._renderer, this.line2);
        L.Polyline.prototype._updatePath.call(this);
    },

    _project: function(){
        var w = {
            0: [3,1],
            1: [7,3],
            2: [9,5],
            3: [11,7],
            4: [15,11],
        }
        var z = this._map.getZoom();
        var weights = w[z] || w[4];
        this.line2._path.setAttribute('stroke-width', weights[0]);
        this._path.setAttribute('stroke-width', weights[1]);
        L.Polyline.prototype._project.call(this);
    }
});

 