
var _invSvg = null;

function invSvg(){
    if(_invSvg) return _invSvg;
    _invSvg = L.SVG.create("svg");    
    _invSvg.style = 'visibility: hidden; position: absolute; top:0; left:0;'
    _invSvg = document.body.appendChild(_invSvg);
    return _invSvg;
}



L.Text = L.Layer.extend({
    options:  {
        fill: 'black',
        fontFamily: 'Times',
        fontSize: 'medium',
        fontStyle: 'normal'
    },

    initialize: function (latLngs, text, rotate, style) {
        this.style = L.extend({}, this.options, style);
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        this.rotate = rotate;
        this.text = text;
    },

    _project: function(){
        console.log('Text _project');
    },

    beforeAdd: function (map) {
        // Renderer is set here because we need to call renderer.getEvents
        // before this.getEvents.
        this._renderer = map.getRenderer(this);
    },

    onAdd: function () {
        var path = this._path = L.SVG.create('text');
        path.textContent = this.text;
        this._updateStyle();
        this.bbox = this._getBBox(this._map, path);
        if(!this.bottomRight) {
            var xy = this._calculateBounds(this._map,this.bbox, this.topLeft);
            this.topLeft = xy[0];
            this.bottomRight = xy[1];
            // this.bottomRight = this._calculateBottomRight(this._map, this.topLeft, path);
        }

        // var b = L.latLngBounds(this.topLeft, this.bottomRight);
        // this.poly = L.polygon([this.topLeft, L.latLng(this.topLeft.lat, this.bottomRight.lng), 
        //                        this.bottomRight, L.latLng(this.bottomRight.lat, this.topLeft.lng),this.topLeft ]).addTo(this._map)


        if (this.options.interactive) {
            L.DomUtil.addClass(path, 'leaflet-interactive');
        }
        this._renderer._addPath(this);
        this._update();
        this._map.on('zoomend', this._update, this);
        // this._renderer._layers[L.stamp(this)] = this;
    },

    onRemove: function(){
        this._map.off('zoomend', this._update, this);        
        this._renderer._removePath(this);
    },

    setStyle: function(style, notupdate){
        this.style = L.extend({}, this.options, style);
        if(!this._map) return;
        this._updateStyle();
        this.bbox = this._getBBox(this._map, this._path);
        if(notupdate) return;
        this._update();
    },

    setText: function(text, notupdate){
        this.text = text;
        if(!this._map) return;
        this._path.textContent = this.text;
        this.bbox = this._getBBox(this._map, this._path);
        if(notupdate) return;
        this._update();
    },

    setLatLngs: function(latLngs){
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        this._update();
    },
    getLatLngs: function(){
        return [this.topLeft, this.bottomRight];
    },
    setRotate: function(rotate, notupdate){
        this.rotate = rotate;
        if(!this._map) return;
        this.bbox = this._getBBox(this._map, this._path);        
        if(notupdate) return;
        this._update();
    },

    _updateStyle: function(){
        this._path.setAttribute('fill', this.style.fill);
        this._path.setAttribute('font-family', this.style.fontFamily);
        this._path.setAttribute('font-size', this.style.fontSize);
        this._path.setAttribute('font-style', this.style.fontStyle);        
    },

    _update: function(){
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        var br = this._map.latLngToLayerPoint(this.bottomRight);
        this._path.setAttribute('x', tl.x);
        this._path.setAttribute('y', br.y);
        var bb = this.bbox;
        var wTransf = (br.x - tl.x) / (bb.width);
        var hTransf = (br.y - tl.y) / (bb.height);
        var dx = -(wTransf-1) * tl.x;
        var dy = -(hTransf-1) * br.y;
        this._path.setAttribute('transform', 'translate('+dx+','+dy+') scale('+wTransf+ ','+ hTransf +')');        
        // this._path.setAttribute('transform', 'matrix('+wTransf+ ', 0, 0, '+ hTransf +',0 ,0)');        
    },

    _calculateBounds: function(map, bbox, clickPoint){
        var cp = map.latLngToLayerPoint(clickPoint); 
        var tl = cp.add({x: 0, y: -bbox.height/2});
        var br = cp.add({x: bbox.width, y: bbox.height/2});
        return [map.layerPointToLatLng(tl), map.layerPointToLatLng(br)]        
    },

    _getBBox: function(map, path){
        var prev_y = path.getAttribute('y') || 0;
        var prev_x = path.getAttribute('x') || 0;
        var noParent = !path.parent;
        path.setAttribute('y', '16px');
        path.setAttribute('x', '0px');
        if(noParent)
            path = invSvg().appendChild(path);
        var bbox = path.getBBox();
        path.setAttribute('y', prev_y);
        path.setAttribute('x', prev_x);
        if(noParent)
            invSvg().removeChild(path);    
        return bbox;    
    }

});


export var Text = L.Text;