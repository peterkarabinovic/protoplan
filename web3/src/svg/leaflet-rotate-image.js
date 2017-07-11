
// A quick extension to allow image layer rotation.
var RotateImageOverlay = L.ImageOverlay.extend({
    options: {rotation: 0},
    _animateZoom: function(e){
        L.ImageOverlay.prototype._animateZoom.call(this, e);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    },
    _reset: function(){
        L.ImageOverlay.prototype._reset.call(this);
        var img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
    }
});

export function rotateImageOverlay(url, bounds, options) {
    return new RotateImageOverlay(url, bounds, options);
};

export function isRotateImage(obj){
    return obj instanceof RotateImageOverlay;
}