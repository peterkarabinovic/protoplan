import _  from '../es6/underscore.js'
import {toBounds} from 'leaflet/src/geometry/Bounds.js'
import {toLatLng} from 'leaflet/src/geo/LatLng.js'
import {Rectangle} from 'leaflet/src/layer/vector/index.js'

import select from 'd3-selection/src/select.js';
import scaleLinear from 'd3-scale/src/linear.js' 
import {axisLeft, axisBottom} from 'd3-axis/src/axis.js' 

var round = Math.round;
var max = Math.max;
var min = Math.min;

export var Grid = Rectangle.extend({
    options: {
        color: 'grey',
        weight: 1,
        fill: true,
        className: 'grid-axis'
    },

    snap: function(latlng){
        latlng.lat = Math.round(latlng.lat / this.step) * this.step; 
        latlng.lng = Math.round(latlng.lng / this.step) * this.step; 
        return latlng;
    },

    snapContainerPoint: function(cp){
        if(!this._map) return cp;
        var ll = map.containerPointToLatLng(cp)
        return map.latLngToContainerPoint(map.snap(ll));        
    }, 

    onAdd: function (map) {
        var g = map.getRenderer(this)._rootGroup;
        this.$axis = select(g).append('g')
                .attr('class', 'grid')
                .style('pointer-events', 'none');
        this._addAxis(map);
        Rectangle.prototype.onAdd.call(this, map);
        map.on('move', this._updateAxis, this);
    },

    onRemove: function (map) {
        this.$axis.remove();
        this.$graphPanel.remove();
        map.off('move', this._updateAxis, this);
        Rectangle.prototype.onRemove.call(this, map);
    },

    getPoints: function(){
        var ll = this._boundsToLatLngs(this.getLatLngs());
        return {
            topLeft: { x: ll[0].lng, y: ll[0].lat },
            bottomRight: { x: ll[2].lng, y: ll[2].lat },
        }
    },

    _addAxis: function(map){
        var format_meters = function(d) { return d + ' м'}
        var map_size = map._container.getBoundingClientRect();
        var margin = {left: 50, right: 0, top: 5, bottom: 30};
        this.$graphPanel = select('body')
            .append('svg')
                .style('position', 'absolute')
                .style('top', (map_size.top - margin.top) + 'px')
                .style('left', (map_size.left - margin.left - 1) + 'px')
                .style('height', (map_size.height + margin.top + margin.bottom) + 'px')
                .style('width', (map_size.width + margin.left + margin.right) + 'px')
                .style('pointer-events', 'none')
                .style('z-index', "399");
        // Axis X
        this.$axisX = this.$graphPanel.append('g')
                        .attr('class', 'x axis')
                        .attr("transform", "translate("+ margin.left+"," + (margin.top + map_size.height) + ")");
        this.scaleX = scaleLinear().range([0, map_size.width]);
        this.axisX = axisBottom(this.scaleX).ticks(10).tickFormat(format_meters);

        // Axis Y
        this.$axisY = this.$graphPanel.append('g')
                        .attr('class', 'y axis')
                        .attr("transform", "translate("+ (margin.left) +"," + margin.top + ")");
        this.scaleY = scaleLinear().range([map_size.height, 0 ]);
        this.axisY = axisLeft(this.scaleY).ticks(10).tickFormat(format_meters);
    },

    _updateAxis: function(){
        var b = this._map.getBounds();
        var myb = this.getBounds();
        this.scaleX.domain([b.getWest() - myb.getWest(), b.getEast() - myb.getWest()]);
        this.$axisX.call(this.axisX);

        // this.scaleY.domain([b.getSouth()-myb.getSouth(), b.getNorth()-myb.getSouth() ]);
        this.scaleY.domain([myb.getNorth()-b.getNorth(), myb.getNorth()-b.getSouth() ]);
        this.$axisY.call(this.axisY);
    },

    _updatePath: function(){
        var map = this._map;
        Rectangle.prototype._updatePath.call(this);
        var step = this.step;
        var bb = toBounds(this._parts[0]);
        var topLeft = bb.getTopLeft();
        var bottomRight = bb.getBottomRight();
        var xNum = 0, yNum = 0;
        if(step > 2) {
            xNum = Math.ceil((bottomRight.x - topLeft.x) / step);
            yNum = Math.ceil((bottomRight.y - topLeft.y) / step);
        }
        
        var $x = this.$axis.selectAll('line.x').data(_.range(1, xNum))
        $x.exit().remove();
        $x.enter()
            .append('line')
                .style('stroke', this.options.color)
                .style('stroke-width', this.options.weight)
                .attr('class', 'grid-axis x')
            .merge($x)
                .attr('y1', topLeft.y)
                .attr('y2', bottomRight.y)
                .attr('x1', function(d) { 
                    return topLeft.x + d * step
                } )
                .attr('x2', function(d) { return topLeft.x + d * step} )
        var $y = this.$axis.selectAll('line.y').data(_.range(1, yNum))
        $y.exit().remove();
        $y.enter()
            .append('line')
                .style('stroke', this.options.color)
                .style('stroke-width', this.options.weight)
                .attr('class', 'grid-axis y')
            .merge($y)
                .attr('y1', function(d) { return  topLeft.y + d * step; } )
                .attr('y2', function(d) { return  topLeft.y + d * step; } )
                .attr('x1', topLeft.x)
                .attr('x2', bottomRight.x);
        
        this._updateAxis();
    },
 
    _project: function(){
        if(this._map){

            var diff = [0.5, 1, 5, 10, 20, 100, 500];
            var dm = 0;
            var dpx = 0;
            for(var i=0; i<diff.length; i++){
                dm = diff[i];
                var p1 = this._map.latLngToContainerPoint(toLatLng(0,0));
                var p2 = this._map.latLngToContainerPoint(toLatLng(0,dm));
                dpx = p1.distanceTo(p2);
                if(dpx > 5)
                    break;
                            
            }
            // REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR
            var p1 = this._map.latLngToContainerPoint(toLatLng(0,0));
            var p2 = this._map.latLngToContainerPoint(toLatLng(0,0.5));
            var d = p1.distanceTo(p2);
            if(d < 5){
                var p1 = this._map.latLngToContainerPoint(toLatLng(0,0));
                var p2 = this._map.latLngToContainerPoint(toLatLng(0,1));
                var d = p1.distanceTo(p2);
                if(d < 5){
                    var p1 = this._map.latLngToContainerPoint(toLatLng(0,0));
                    var p2 = this._map.latLngToContainerPoint(toLatLng(0,5));
                    var d = p1.distanceTo(p2);
                }
                if(d < 5){
                    var p1 = this._map.latLngToContainerPoint(toLatLng(0,0));
                    var p2 = this._map.latLngToContainerPoint(toLatLng(0,10));
                    var d = p1.distanceTo(p2);
                }
            // REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR REFACTOR
            }
            this.step = d > 5 ? d : 5;
        }
        Rectangle.prototype._project.call(this);
    }
});