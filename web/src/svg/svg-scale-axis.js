export function AxisWidget(map_div, map)
{
    var rect = map_div.getBoundingClientRect();
    var marginX = {left: 20, right: 0, top: 0, bottom: 10},
        heightX = 20;
    var marginY = {left:20, top:5, right:0, bottom: 10},
        widthY = 30 + marginY.left + marginY.right;

    var format_meters = function(d) { return d + ' м'}

    var $x = d3.select('body')
        .append('svg')
            .style('position', 'absolute')
            .style('top', (rect.bottom ) + 'px')
            .style('left', (rect.left - marginX.left-1) + 'px')
            .style('height', (heightX + marginX.bottom + marginX.top) + 'px')
            .style('width', (rect.width + marginX.left + marginX.right) + 'px')
        .append('g')
            .attr('class', 'x axis')
            .attr("transform", "translate("+ marginX.left+"," + marginX.top + ")")

    var scaleX = d3.scaleLinear().range([0, rect.width]);
    var axisX = d3.axisBottom(scaleX).ticks(10).tickFormat(format_meters);

    var $y = d3.select('body')
        .append('svg')
            .style('position', 'absolute')
            .style('top', (rect.top - marginY.top) + 'px')
            .style('left', (rect.left - widthY) + 'px')
            .style('height', (rect.height + marginY.bottom + marginY.top) + 'px')
            .style('width', widthY  + 'px')
        .append('g')
            .attr('class', 'y axis')
            .attr("transform", "translate("+ (widthY-1) +"," + marginY.top + ")")

    var scaleY = d3.scaleLinear().range([0, rect.height ]);
    var axisY = d3.axisLeft(scaleY).ticks(10).tickFormat(format_meters);

    /**
     * 
     * 
     *  GRID
     */
    var $grid = d3.select('body')
        .append('svg')
            .style('position', 'absolute')
            .style('top', rect.top  + 'px')
            .style('left', rect.left + 'px')
            .style('height', rect.height + 'px')
            .style('width', rect.width  + 'px')
            .style('pointer-events', 'none');

    var gridX = d3.axisBottom(scaleX).ticks(40)
                                   .tickSize(-rect.height, 0, 0)
                                   .tickFormat('');
    var $gridX1 = $grid.append('g')
                    .attr('class', 'grid')
                    .attr("transform", "translate(-1," + rect.height + ")");
    
    var gridY = d3.axisRight(scaleY)
                                    .ticks(40)
                                   .tickSize(rect.width, 0, 0)
                                   .tickFormat('');
    var $gridY1 = $grid.append('g')
                    .attr('class', 'grid')
                    .attr("transform", "translate(0,0)");

    var size_m = 0;
    var render = function()
    {
        var b = map.getBounds()
        scaleX.domain([b.getWest(), b.getEast()]);
        $x.call(axisX)

        scaleY.domain([size_m.y-b.getSouth(), size_m.y-b.getNorth() ]);
        $y.call(axisY)

    }

    var update_grid = function(){
        var b = map.getBounds()
        scaleX.domain([b.getWest(), b.getEast()]);
        scaleY.domain([size_m.y-b.getSouth(), size_m.y-b.getNorth() ]);

        // gridY.ticks(ticksY)
        // gridX.ticks(80)

        $gridX1.call(gridX);
        $gridY1.call(gridY);
    }

    var update_grid_ticks = function(){
        var b = map.getBounds(),
            domainX = [b.getWest(), b.getEast()],
            domainY = [size_m.y-b.getSouth(), size_m.y-b.getNorth() ];

        var stepX = Math.abs(d3.tickStep.apply(null, domainX.concat(40)))
        var stepY = Math.abs(d3.tickStep.apply(null, domainY.concat(40)))
        var step = Math.max(0.5, Math.min(stepX , stepY) )
        // gridY.tickValues ( d3.range( domainY[0],domainY[1], step ) );
        // gridX.tickValues ( d3.range( domainX[0],domainX[1], step ) );
        gridY.ticks(  Math.abs( (domainY[1] - domainY[0]) / step)  );
        gridX.ticks(  Math.abs( (domainX[1] - domainX[0]) / step)  );

    }


    map.on('move', render)
    map.on('move', update_grid)
    map.on('zoomend', update_grid_ticks);


    var enable = function(baseimage_size){
        size_m = baseimage_size;
        render()
        update_grid_ticks();
        update_grid();
    }
   
    return enable;
}