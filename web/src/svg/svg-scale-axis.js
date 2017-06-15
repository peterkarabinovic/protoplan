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
    
    var gridY = d3.axisRight(scaleY).ticks(40)
                                   .tickSize(rect.width, 0, 0)
                                   .tickFormat('');
    var $gridY1 = $grid.append('g')
                    .attr('class', 'grid')
                    .attr("transform", "translate(0,0)");

    var image_heigth = 0;
    var render = function()
    {
        var b = map.getBounds()
        scaleX.domain([b.getWest(), b.getEast()]);
        $x.call(axisX)

        scaleY.domain([image_heigth-b.getSouth(), image_heigth-b.getNorth() ]);
        $y.call(axisY)

    }

    var update_grid = function(){
        var b = map.getBounds()
        scaleX.domain([b.getWest(), b.getEast()]);
        scaleY.domain([image_heigth-b.getSouth(), image_heigth-b.getNorth()]);

        $gridX1.call(gridX);
        $gridY1.call(gridY);
    }




    var enable = function(baseimage_size){
        image_heigth = baseimage_size.y;
        map.off('move', render)
        map.on('move', render)
        map.off('move', update_grid)
        map.on('move', update_grid)
        render()
        update_grid()
    }
    enable.redraw = function(baseimage_size){
        image_heigth = baseimage_size.y;
        render();
        update_grid();
    }
    
    return enable;
}