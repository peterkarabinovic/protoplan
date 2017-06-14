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
            .style('height', (rect.height + marginY.bottom + + marginY.top) + 'px')
            .style('width', widthY  + 'px')
        .append('g')
            .attr('class', 'y axis')
            .attr("transform", "translate("+ (widthY-1) +"," + marginY.top + ")")

    var scaleY = d3.scaleLinear().range([0, rect.height ]);
    var axisY = d3.axisLeft(scaleY).ticks(10).tickFormat(format_meters);

    var image_heigth = 0;
    var render = function()
    {
        var b = map.getBounds()
        scaleX.domain([b.getWest(), b.getEast()]);
        $x.call(axisX)

        scaleY.domain([image_heigth-b.getSouth(),image_heigth-b.getNorth() ]);
        $y.call(axisY)
    }

    var enable = function(baseimage_size){
        image_heigth = baseimage_size.y;
        map.off('viewreset  move', render)
        map.on('viewreset  move', render)
        render()
    }
    return enable;
}