import {matrix} from './matrix.js'

export var Stand = L.Polygon.extend({
    options: {
        fillColor: 'green',
        color: 'green',
        stroke: false,
        fillOpacity: 0.7,
    },
    

    initialize: function (latlngs, options, openWalls, label){
        options = _.extend(options, {editorClass: StandEditor});
        this.openWalls = openWalls || 1;
        L.Polygon.prototype.initialize.call(this, latlngs, options);
        this._createDecorations();
    },

    _createDecorations: function(){
        var ll = this.getLatLngs();
        ll = _.rest(_.flatten(ll), this.openWalls-1);
        if(ll.length > 1)
            this.line = new DoubleLine(ll, {color: this.options.fillColor});
    },

    onAdd: function (map) {
        L.Polygon.prototype.onAdd.call(this,map);
        if(this.line) map.addLayer(this.line); 
        this.on('editable:shape:dragstart', this._onDragStart, this)    
        this.on('editable:shape:dragend', this._onDragEnd, this)    
    },

    onRemove: function (map) {
        L.Polygon.prototype.onRemove.call(this, map); 
        if(this.line) map.removeLayer(this.line);       
        this.off('editable:shape:dragstart', this._onDragStart, this)    
        this.off('editable:shape:dragend', this._onDragEnd, this)    
    },

    _onDragStart: function(){
        if(this.line) {
            this._map.removeLayer(this.line);
            this.line = null;
        }
    },

    _onDragEnd: function(){
        if(!this.line) {
            this._createDecorations();
            this._map.addLayer(this.line);
        }
    },
    
    rotate: function(radians){
        radians = radians || (Math.PI / 2);
        var m = matrix(1,0,0,1,0,0);
        var ce = this.getBounds().getCenter();  
        ce = L.point(ce.lng, ce.lat);
        m.rotate(radians);
        _.each(this.getLatLngs()[0], function(ll){
            var p = L.point(ll.lng, ll.lat)
            var tll = m.transform(p.subtract(ce)).add(ce);
            ll.lng = tll.x;
            ll.lat = tll.y;
        });
        this.redraw();
    },

    flip: function(){
        var m = matrix(1,0,0,1,0,0);
        var ce = this.getBounds().getCenter();  
        ce = L.point(ce.lng, ce.lat);
        m.flip();
        _.each(this.getLatLngs()[0], function(ll){
            var p = L.point(ll.lng, ll.lat)
            var tll = m.transform(p.subtract(ce)).add(ce);
            ll.lng = tll.x;
            ll.lat = tll.y;
        });
        this.redraw();
    },


    redraw: function(){
        L.Polygon.prototype.redraw.call(this); 
        if(this.line) {
            this.line.redraw();}
    },

    update: function(latlngs, options, openWalls){
        this.setStyle(options);
        // if it's edit mode
        this.openWalls = openWalls || this.openWalls;
        var ll = this.getLatLngs();
        if(ll[0][0].update) {
            _.each(latlngs, function(new_latlng, i){
                ll[0][i].update(new_latlng);
            })
        }
        else { 
            this.setLatLngs(latlngs);
            ll = this.getLatLngs();
        }
        ll = _.rest(_.flatten(ll), this.openWalls-1);
        if(this.line && this._map && ll.length > 1) {
            this.line.setLatLngs(ll);
            this.line.setStyle({color: this.options.fillColor});
        } 
    }
});

/**
 * Editor that preserver order of point in rectangle
 */
var StandEditor = L.Editable.RectangleEditor.extend({
        extendBounds: function (e) {
            var index = e.vertex.getIndex(),
                next = e.vertex.getNext(),
                previous = e.vertex.getPrevious(),
                oppositeIndex = (index + 2) % 4,
                opposite = e.vertex.latlngs[oppositeIndex],
                bounds = new L.LatLngBounds(e.latlng, opposite);

            e.latlng = this.map.snap(e.latlng);
            // Update latlngs by hand to preserve order.
            var fact = next.latlng.lat >  previous.latlng.lat;
            var nnext = [opposite.lat, e.latlng.lng];
            var nprevious = [e.latlng.lat, opposite.lng]
            if( (nnext[0] > nprevious[0]) !== fact )
                previous = [next, next=previous][0];
            previous.latlng.update(nprevious);
            next.latlng.update(nnext);

            e.vertex.latlng.update(e.latlng)
            e.vertex._latlng.update(e.latlng)
            
            this.updateBounds(bounds);
            this.refreshVertexMarkers();
        },
})

export var DoubleLine = L.Polyline.extend({
    options2: {color: 'lightgrey', weight: 7, lineCap: "butt", lineJoin: "miter", opacity: 1},
    options1: {color: 'green', lineCap: "butt", lineJoin: "miter", opacity: 0.7},
    // options1: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    // options2: {color: 'white', lineCap: "square", lineJoin: "miter",  weight: 1, opacity:1},
    
    initialize: function (latlngs, options1, options2){
        this.options1 = L.extend(this.options1, options1);
        this.options2 = L.extend(this.options2, options2);
        this.line2 = new L.Polyline([], this.options2);
        L.Polyline.prototype.initialize.call(this, latlngs, this.options1);
    },

    setStyle: function(options1, options2) {
        this.options1 = L.extend(this.options1, options1);
        this.options2 = L.extend(this.options2, options2);
        this.line2.setStyle(this.options2)
        L.Polyline.prototype.setStyle.call(this, this.options1);
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
        // var w = {
        //     0: [6,2],
        //     1: [7,3],
        //     2: [10,6],
        //     3: [14,10],
        //     4: [18,14],
        // }
        // var z = this._map.getZoom();
        var weights = [7,3];//w[z] || w[4];
        this.line2._path.setAttribute('stroke-width', weights[0]);
        this._path.setAttribute('stroke-width', weights[1]);
        L.Polyline.prototype._project.call(this);
    },
    _transform: function(matrix){
        L.Path.prototype._transform.call(this, matrix);
        this.line2._transform(matrix);
    }
    
});

 