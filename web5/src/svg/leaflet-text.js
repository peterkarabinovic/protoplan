import {matrix} from './matrix.js'
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
        fontStyle: 'normal',
        interactive: true
    },

    initialize: function (latLngs, text, rotate, style) {
        this.style = L.extend({}, this.options, style);
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        this.rotate = rotate;
        this.text = text;
    },

    _project: function(){
        if(!this.matrix)
            this.matrix = L.matrix(1,0,0,1,0,0);
        else {
            this.matrix._matrix[0] = 1;
            this.matrix._matrix[1] = 0;
            this.matrix._matrix[2] = 0;
            this.matrix._matrix[3] = 1;
            this.matrix._matrix[4] = 0;
            this.matrix._matrix[5] = 0;
        }
        if(!this._map) return;
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        var br = this._map.latLngToLayerPoint(this.bottomRight);
        this._path.setAttribute('x', tl.x);
        this._path.setAttribute('y', br.y);
        var bb = this.bbox;
        var wTransf = Math.round((br.x - tl.x) / (bb.width) * 100) / 100;
        var hTransf = Math.round((br.y - tl.y) / (bb.height) * 100) / 100;
        var dx = -(wTransf-1) * tl.x;
        var dy = -(hTransf-1) * br.y;

        var origin = {x:tl.x, y:br.y}
        // var radian = this.rotate * Math.PI / 180
        this.matrix.rotate(this.rotate, L.bounds(tl, br).getCenter(true));
        this.matrix.scale({x:wTransf, y:hTransf}, origin);
        var transform = 'matrix(' + this.matrix._matrix.join(',') + ')';
        this._path.setAttribute('transform', transform); 
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
        this.setLatLngs([this.topLeft, this.bottomRight], true);

        // var b = L.latLngBounds(this.topLeft, this.bottomRight);
        // this.poly = L.polygon([this.topLeft, L.latLng(this.topLeft.lat, this.bottomRight.lng), 
        //                        this.bottomRight, L.latLng(this.bottomRight.lat, this.topLeft.lng),this.topLeft ]).addTo(this._map)


        if (this.options.interactive) {
            L.DomUtil.addClass(path, 'leaflet-interactive');
        }
        this._renderer._addPath(this);
        this._project();
        this._map.on('zoomend', this._update, this);
        this._renderer._layers[L.stamp(this)] = this;
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
        this._project();
    },

    setText: function(text, notupdate){
        this.text = text;
        if(!this._map) return;
        this._path.textContent = this.text;
        if(notupdate) return;
        var rect = this._path.getBoundingClientRect();
        var tl = this._map.latLngToLayerPoint(this.topLeft);
        this.bottomRight = this._map.layerPointToLatLng(tl.add({x: rect.width, y: rect.height}));        
        this._project();
    },

    getText: function(){
        return this.text;
    },

    setLatLngs: function(latLngs, notupdate){
        this.topLeft = latLngs[0];
        this.bottomRight = latLngs[1];
        if(!this.bottomRight && this._map) {
            var xy = this._calculateBounds(this._map,this.bbox, this.topLeft);
            this.topLeft = xy[0];
            this.bottomRight = xy[1];
        }
        if(notupdate) return;
        
        this._project();
    },
    getLatLngs: function(){
        return [this.topLeft, this.bottomRight];
    },
    setRotate: function(rotate, notupdate){
        this.rotate = rotate;
        if(!this._map) return;
        if(notupdate) return;
        this._project();
    },

    _updateStyle: function(){
        this._path.setAttribute('fill', this.style.fill);
        this._path.setAttribute('font-family', this.style.fontFamily);
        this._path.setAttribute('font-size', this.style.fontSize);
        this._path.setAttribute('font-style', this.style.fontStyle);        
    },

    _update: function(){
        // var tl = this._map.latLngToLayerPoint(this.topLeft);
        // var br = this._map.latLngToLayerPoint(this.bottomRight);
        // this._path.setAttribute('x', tl.x);
        // this._path.setAttribute('y', br.y);
        // var bb = this.bbox;
        // var wTransf = Math.round((br.x - tl.x) / (bb.width) * 100) / 100;
        // var hTransf = Math.round((br.y - tl.y) / (bb.height) * 100) / 100;
        // var dx = -(wTransf-1) * tl.x;
        // var dy = -(hTransf-1) * br.y;
        // // var transform = 'translate('+dx+' '+dy+') scale('+wTransf+ ' '+ hTransf +')';
        // // this._path.setAttribute('transform', transform);        

        // var z = this._map.getZoom();
        // var matrix = L.matrix(1,0,0,1,0,0);
        // var origin = {x:tl.x, y:br.y}
        // matrix.rotate(this.rotate, L.bounds(tl, br).getCenter(true));
        // matrix.scale({x:wTransf, y:hTransf}, origin);
        // var transform = 'matrix(' + matrix._matrix.join(',') + ')';
        // this._path.setAttribute('transform', transform); 


        // if(this.rotate){
        //     var ce =L.bounds(tl, br).getCenter(true).subtract({x:dx, y:dy})//.scaleBy({x:wTransf, y:hTransf}).add(tl);
        //     transform += ' rotate('+this.rotate+' '+ce.x+' '+ce.y+')';
        // }
        // this._path.setAttribute('transform', transform);        
        // this._path.setAttribute('transform', 'matrix('+wTransf+ ', 0, 0, '+ hTransf +',0 ,0)');        
    },

    _calculateBounds: function(map, bbox, topLeft){
        var tl = map.latLngToLayerPoint(topLeft); 
        // var tl = cp.add({x: 0, y: -bbox.height/2});
        var br = tl.add({x: bbox.width, y: bbox.height});
        return [map.layerPointToLatLng(tl), map.layerPointToLatLng(br)]        
    },

    _getBBox: function(map, path){
        var prev_y = path.getAttribute('y') || 0;
        var prev_x = path.getAttribute('x') || 0;
        var noParent = !path.parentNode;
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