
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

    initialize: function (topLeft, bottomRight, text, rotate, options) {
        L.setOptions(this, options);
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
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
        this._updateStyle(this.options);
        if(!this.bottomRight) {
            var xy = this._calculateBounds(this._map, this.topLeft, path);
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
        this._renderer._layers[L.stamp(this)] = this;
    },

    onRemove: function(){
        this._renderer._removePath(this);
    },

    _updateStyle: function(style){
        this._path.setAttribute('fill', style.fill);
        this._path.setAttribute('font-family', style.fontFamily);
        this._path.setAttribute('font-size', style.fontSize);
        this._path.setAttribute('font-style', style.fontStyle);        
    },

    _update: function(){
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        var br = this._map.latLngToLayerPoint(this.bottomRight);
        this._path.setAttribute('x', tl.x);
        this._path.setAttribute('y', br.y);
        this._path.setAttribute('transform', '');
        var bb = this._path.getBBox();
        var wTransf = (br.x - tl.x) / (bb.width);
        var hTransf = (br.y - tl.y) / (bb.height);
        var dx = -(wTransf-1) * tl.x;
        var dy = -(hTransf-1) * br.y;
        this._path.setAttribute('transform', 'translate('+dx+','+dy+') scale('+wTransf+ ','+ hTransf +')');        
        // this._path.setAttribute('transform', 'matrix('+wTransf+ ', 0, 0, '+ hTransf +',0 ,0)');        
    },

    _calculateBounds: function(map, clickPoint, path){
        path.setAttribute('y', '16px');
        path.setAttribute('x', '0px');
        var node = document.importNode(path, true);
        node = invSvg().appendChild(path);
        var bbox = node.getBBox();
        path.setAttribute('y', 0); 
        invSvg().removeChild(node);
        var cp = map.latLngToLayerPoint(clickPoint); 
        var tl = cp.add({x: 0, y: -bbox.height/2});
        var br = cp.add({x: bbox.width, y: bbox.height/2});
        return [map.layerPointToLatLng(tl), map.layerPointToLatLng(br)]        
    }

});


export var Text = L.Text;