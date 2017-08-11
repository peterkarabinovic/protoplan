import {Handler, Browser} from 'leaflet/src/core/index.js'
import {toPoint} from 'leaflet/src/geometry/Point.js'

import * as Util from 'leaflet/src/core/Util.js';
import * as DomUtil from 'leaflet/src/dom/DomUtil.js'
import * as DomEvent from 'leaflet/src/dom/DomEvent.js';
import {Path} from  'leaflet/src/layer/vector/Path.js';
import {SVG} from  'leaflet/src/layer/vector/SVG.js';
import {Editable} from './Leaflet.Editable.js'
import {LatLngBounds} from 'leaflet/src/geo/LatLngBounds.js'

/**
 * Leaflet vector features drag functionality
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */

/**
 * Matrix transform path for SVG/VML
 * Renderer-independent
 */
Path.include({

	/**
	 * Applies matrix transformation to SVG
	 * @param {Array.<Number>?} matrix
	 */
	_transform: function(matrix) {
		if (this._renderer) {
			if (matrix) {
				this._renderer.transformPath(this, matrix);
			} else {
				// reset transform matrix
				this._renderer._resetTransformPath(this);
				this._update();
			}
		}
		return this;
	},

	/**
	 * Check if the feature was dragged, that'll supress the click event
	 * on mouseup. That fixes popups for example
	 *
	 * @param  {MouseEvent} e
	 */
	_onMouseClick: function(e) {
		if ((this.dragging && this.dragging.moved()) ||
			(this._map.dragging && this._map.dragging.moved())) {
			return;
		}

		this._fireMouseEvent(e);
	}

});

var END = {
	mousedown: 'mouseup',
	touchstart: 'touchend',
	pointerdown: 'touchend',
	MSPointerDown: 'touchend'
};
var MOVE = {
	mousedown: 'mousemove',
	touchstart: 'touchmove',
	pointerdown: 'touchmove',
	MSPointerDown: 'touchmove'
};

function _sqDist(p1, p2) {
	var dx = p2.x - p1.x,
	    dy = p2.y - p1.y;
	return dx * dx + dy * dy;
}


/**
 * Drag handler
 * @class Path.Drag
 * @extends {Handler}
 */
Handler.PathDrag = Handler.extend( /** @lends  Path.Drag.prototype */ {

  statics: {
    DRAGGING_CLS: 'leaflet-path-draggable',
  },


  /**
   * @param  {Path} path
   * @constructor
   */
  initialize: function(path) {

    /**
     * @type {Path}
     */
    this._path = path;

    /**
     * @type {Array.<Number>}
     */
    this._matrix = null;

    /**
     * @type {L.Point}
     */
    this._startPoint = null;

    /**
     * @type {L.Point}
     */
    this._dragStartPoint = null;

    /**
     * @type {Boolean}
     */
    this._mapDraggingWasEnabled = false;

  },

  /**
   * Enable dragging
   */
  addHooks: function() {
    this._path.on('mousedown', this._onDragStart, this);

    this._path.options.className = this._path.options.className ?
        (this._path.options.className + ' ' + Handler.PathDrag.DRAGGING_CLS) :
         Handler.PathDrag.DRAGGING_CLS;

    if (this._path._path) {
      DomUtil.addClass(this._path._path, Handler.PathDrag.DRAGGING_CLS);
    }
  },

  /**
   * Disable dragging
   */
  removeHooks: function() {
    this._path.off('mousedown', this._onDragStart, this);

    this._path.options.className = this._path.options.className
      .replace(new RegExp('\\s+' + Handler.PathDrag.DRAGGING_CLS), '');
    if (this._path._path) {
      DomUtil.removeClass(this._path._path, Handler.PathDrag.DRAGGING_CLS);
    }
  },

  /**
   * @return {Boolean}
   */
  moved: function() {
    return this._path._dragMoved;
  },

  /**
   * Start drag
   * @param  {L.MouseEvent} evt
   */
  _onDragStart: function(evt) {
    var eventType = evt.originalEvent._simulated ? 'touchstart' : evt.originalEvent.type;

    var cp = evt.containerPoint;
    var map = this._path._map;
    if(!map.options.nosnap && map.grid)
      cp = map.grid.snapContainerPoint(cp);
    this._mapDraggingWasEnabled = false;
    this._startPoint = cp.clone();
    this._dragStartPoint = cp.clone();
    this._matrix = [1, 0, 0, 1, 0, 0];
    DomEvent.stop(evt.originalEvent);

    DomUtil.addClass(this._path._renderer._container, 'leaflet-interactive');
    DomEvent.on(document, MOVE[eventType], this._onDrag,    this)
    DomEvent.on(document, END[eventType],  this._onDragEnd, this);

    if (this._path._map.dragging.enabled()) {
      // I guess it's required because mousdown gets simulated with a delay
      //this._path._map.dragging._draggable._onUp(evt);

      this._path._map.dragging.disable();
      this._mapDraggingWasEnabled = true;
    }
    this._path._dragMoved = false;

    if (this._path._popup) { // that might be a case on touch devices as well
      this._path._popup._close();
    }

    this._replaceCoordGetters(evt);
  },

  /**
   * Dragging
   * @param  {L.MouseEvent} evt
   */
  _onDrag: function(evt) {
    DomEvent.stop(evt);

    var first = (evt.touches && evt.touches.length >= 1 ? evt.touches[0] : evt);
    var containerPoint = this._path._map.mouseEventToContainerPoint(first);

    var cp = containerPoint;
    var map = this._path._map;
    if(!map.options.nosnap && map.grid)
      cp = map.grid.snapContainerPoint(cp);
    
    var x = cp.x;
    var y = cp.y;

    var dx = x - this._startPoint.x;
    var dy = y - this._startPoint.y;

    if (!this._path._dragMoved && (dx || dy)) {
      this._path._dragMoved = true;
      this._path.fire('dragstart', evt);
      // we don't want that to happen on click
      this._path.bringToFront();
    }

    this._matrix[4] += dx;
    this._matrix[5] += dy;

    this._startPoint.x = x;
    this._startPoint.y = y;

    this._path.fire('predrag', evt);
    this._path._transform(this._matrix);
    this._path.fire('drag', evt);
  },

  /**
   * Dragging stopped, apply
   * @param  {L.MouseEvent} evt
   */
  _onDragEnd: function(evt) {
    var containerPoint = this._path._map.mouseEventToContainerPoint(evt);
    var moved = this.moved();

    // apply matrix
    if (moved) {
      this._transformPoints(this._matrix);
      this._path._updatePath();
      this._path._project();
      this._path._transform(null);

      DomEvent.stop(evt);
    }


    DomEvent.off(document, 'mousemove touchmove', this._onDrag, this)
    DomEvent.off(document, 'mouseup touchend',    this._onDragEnd, this);

    this._restoreCoordGetters();

    // consistency
    if (moved) {
      this._path.fire('dragend', {
        distance: Math.sqrt(
          _sqDist(this._dragStartPoint, containerPoint)
        )
      });

      // hack for skipping the click in canvas-rendered layers
      var contains = this._path._containsPoint;
      this._path._containsPoint = Util.falseFn;
      Util.requestAnimFrame(function() {
        DomEvent.skipped({ type: 'click' });
        this._path._containsPoint = contains;
      }, this);
    }

    this._matrix          = null;
    this._startPoint      = null;
    this._dragStartPoint  = null;
    this._path._dragMoved = false;

    if (this._mapDraggingWasEnabled) {
      DomEvent.fakeStop({ type: 'click' });
      this._path._map.dragging.enable();
    }
  },


  /**
   * Applies transformation, does it in one sweep for performance,
   * so don't be surprised about the code repetition.
   *
   * [ x ]   [ a  b  tx ] [ x ]   [ a * x + b * y + tx ]
   * [ y ] = [ c  d  ty ] [ y ] = [ c * x + d * y + ty ]
   *
   * @param {Array.<Number>} matrix
   */
  _transformPoints: function(matrix, dest) {
    var path = this._path;
    var i, len, latlng;

    var px = toPoint(matrix[4], matrix[5]);

    var crs = path._map.options.crs;
    var transformation = crs.transformation;
    var scale = crs.scale(path._map.getZoom());
    var projection = crs.projection;

    var diff = transformation.untransform(px, scale)
      .subtract(transformation.untransform(toPoint(0, 0), scale));
    var applyTransform = !dest;

    path._bounds = new LatLngBounds();

    // console.time('transform');
    // all shifts are in-place
    if (path._point) { // L.Circle
      dest = projection.unproject(
        projection.project(path._latlng)._add(diff));
      if (applyTransform) {
        path._latlng = dest;
        path._point._add(px);
      }
    } else if (path._rings || path._parts) { // everything else
      var rings   = path._rings || path._parts;
      var latlngs = path._latlngs;
      dest = dest || latlngs;
      if (!Util.isArray(latlngs[0])) { // polyline
        latlngs = [latlngs];
        dest    = [dest];
      }
      for (i = 0, len = rings.length; i < len; i++) {
        dest[i] = dest[i] || [];
        for (var j = 0, jj = rings[i].length; j < jj; j++) {
          latlng     = latlngs[i][j];
          dest[i][j] = projection
            .unproject(projection.project(latlng)._add(diff));
          if (applyTransform) {
            path._bounds.extend(latlngs[i][j]);
            rings[i][j]._add(px);
          }
        }
      }
    }
    return dest;
    // console.timeEnd('transform');
  },



  /**
   * If you want to read the latlngs during the drag - your right,
   * but they have to be transformed
   */
  _replaceCoordGetters: function() {
    if (this._path.getLatLng) { // Circle, CircleMarker
      this._path.getLatLng_ = this._path.getLatLng;
      this._path.getLatLng = Util.bind(function() {
        return this.dragging._transformPoints(this.dragging._matrix, {});
      }, this._path);
    } else if (this._path.getLatLngs) {
      this._path.getLatLngs_ = this._path.getLatLngs;
      this._path.getLatLngs = Util.bind(function() {
        return this.dragging._transformPoints(this.dragging._matrix, []);
      }, this._path);
    }
  },


  /**
   * Put back the getters
   */
  _restoreCoordGetters: function() {
    if (this._path.getLatLng_) {
      this._path.getLatLng = this._path.getLatLng_;
      delete this._path.getLatLng_;
    } else if (this._path.getLatLngs_) {
      this._path.getLatLngs = this._path.getLatLngs_;
      delete this._path.getLatLngs_;
    }
  }

});


/**
 * @param  {Path} layer
 * @return {Path}
 */
Handler.PathDrag.makeDraggable = function(layer) {
  layer.dragging = new Handler.PathDrag(layer);
  return layer;
};


/**
 * Also expose as a method
 * @return {Path}
 */
Path.prototype.makeDraggable = function() {
  return Handler.PathDrag.makeDraggable(this);
};


Path.addInitHook(function() {
  if (this.options.draggable) {
    // ensure interactive
    this.options.interactive = true;

    if (this.dragging) {
      this.dragging.enable();
    } else {
      Handler.PathDrag.makeDraggable(this);
      this.dragging.enable();
    }
  } else if (this.dragging) {
    this.dragging.disable();
  }
});

SVG.include({

	/**
	 * Reset transform matrix
	 */
	_resetTransformPath: function(layer) {
		layer._path.setAttributeNS(null, 'transform', '');
	},

	/**
	 * Applies matrix transformation to SVG
	 * @param {Path}         layer
	 * @param {Array.<Number>} matrix
	 */
	transformPath: function(layer, matrix) {
		layer._path.setAttributeNS(null, 'transform',
			'matrix(' + matrix.join(' ') + ')');
	}

});

SVG.include( !Browser.vml ? {} : {

	/**
	 * Reset transform matrix
	 */
	_resetTransformPath: function(layer) {
		if (layer._skew) {
			// super important! workaround for a 'jumping' glitch:
			// disable transform before removing it
			layer._skew.on = false;
			layer._path.removeChild(layer._skew);
			layer._skew = null;
		}
	},

	/**
	 * Applies matrix transformation to VML
	 * @param {Path}         layer
	 * @param {Array.<Number>} matrix
	 */
	transformPath: function(layer, matrix) {
		var skew = layer._skew;

		if (!skew) {
			skew = SVG.create('skew');
			layer._path.appendChild(skew);
			skew.style.behavior = 'url(#default#VML)';
			layer._skew = skew;
		}

		// handle skew/translate separately, cause it's broken
		var mt = matrix[0].toFixed(8) + ' ' + matrix[1].toFixed(8) + ' ' +
			matrix[2].toFixed(8) + ' ' + matrix[3].toFixed(8) + ' 0 0';
		var offset = Math.floor(matrix[4]).toFixed() + ', ' +
			Math.floor(matrix[5]).toFixed() + '';

		var s = this._path.style;
		var l = parseFloat(s.left);
		var t = parseFloat(s.top);
		var w = parseFloat(s.width);
		var h = parseFloat(s.height);

		if (isNaN(l)) { l = 0; }
		if (isNaN(t)) { t = 0; }
		if (isNaN(w) || !w) { w = 1; }
		if (isNaN(h) || !h) { h = 1; }

		var origin = (-l / w - 0.5).toFixed(8) + ' ' + (-t / h - 0.5).toFixed(8);

		skew.on = 'f';
		skew.matrix = mt;
		skew.origin = origin;
		skew.offset = offset;
		skew.on = true;
	}

});

// Util.trueFn = function() {
//   return true;
// };

/**
 * Leaflet.Editable extension for dragging
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */
Editable.PathEditor.include({

  /**
   * Hooks dragging in
   * @override
   * @return {Editable.PathEditor}
   */
  enable: function() {
    this._enable();
    if (!this.feature.dragging) {
      Handler.PathDrag.makeDraggable(this.feature);
    }
    this.feature.dragging.enable();
    this.feature
      .on('dragstart', this._onFeatureDragStart, this)
      .on('drag',      this._onFeatureDrag,      this)
      .on('dragend',   this._onFeatureDragEnd,   this);

    return this;
  },
  _enable: Editable.PathEditor.prototype.enable,


  /**
   * @override
   * @return {Editable.PathEditor}
   */
  disable: function() {
    this.feature.dragging.disable();
    this._disable();
    this.feature
      .off('dragstart', this._onFeatureDragStart, this)
      .off('drag',      this._onFeatureDrag,      this)
      .off('dragend',   this._onFeatureDragEnd,   this);
    return this;
  },
  _disable: Editable.PathEditor.prototype.disable,


  /**
   * Basically, remove the vertices
   * @param  {Event} evt
   */
  _onFeatureDragStart: function(evt) {
    this.fireAndForward('editable:shape:dragstart', evt);
    this.editLayer.clearLayers();
    if (this.drawing()) {
      this.endDrawing();
    }
  },


  /**
   * Just propagate the event
   * @param  {Event} evt
   */
  _onFeatureDrag: function(evt) {
    this.fireAndForward('editable:shape:drag', evt);
  },


  /**
   * Just propagate the event
   * @param  {Event} evt
   */
  _onFeatureDragEnd: function(evt) {
    this.fireAndForward('editable:shape:dragend', evt);
    // this.initVertexMarkers();

    // for the circle
    if (typeof this.updateResizeLatLng === 'function') {
      this.updateResizeLatLng();
    }
  }

});


export function Drag(_){
  return _;
}