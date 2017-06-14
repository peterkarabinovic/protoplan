

export function createGrid(image, image_size_m) 
{
    var x = d3.scaleLinear().domain([0, image_size_m.x]);
    var xAxis = d3.axisBottom(x).ticks(10)

    return L.d3SvgOverlay(function (sel, proj) {

           var bound = proj.map.getPixelBounds(),
               height_px = bound.max.y - bound.min.y;


           // Add the X Axis     
           var bottom_right = proj.latLngToLayerPoint(L.latLng(0,image_size_m.x))
           var bottom_left = proj.latLngToLayerPoint(L.latLng(0,0))
           x.range([bottom_left.x,bottom_right.x])
           var $xAxis = sel.selectAll('.x').data([1])
           $xAxis.enter()
                 .append("g")
                 .attr('class', 'x axis')
           .merge($xAxis)
                .attr("transform", "translate(0," + height_px + ")")
                .call(xAxis);

    });
}

