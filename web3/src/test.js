import {GridPanel} from './map/grid-panel.js'
import * as math from './map/math.js'


L.Browser.touch = false;

var  map = L.map('map', {
    crs: L.CRS.Simple,
    zoomControl: false,
    attributionControl: false,
    editable: true,
        editOptions: {
            // skipMiddleMarkers: true
        }
});
var gridPanel = GridPanel(map);
function updateBaseLayerSize(size_m)
{
    if(!size_m) return;
    var map_size = {x: map._container.offsetWidth, y: map._container.offsetHeight};
    var trans =  math.transformation(map_size, size_m);
    map.options.crs = L.extend({}, L.CRS.Simple, {transformation: trans });  
    map.setMaxBounds([[-size_m.y, -size_m.x], [size_m.y*2, size_m.x*2]]);
    map.setMaxZoom( math.maxZoom(size_m) );
    var bounds =  L.latLngBounds([[0,0], [size_m.y, size_m.x]]);
    if(_.isUndefined(map.getZoom()))
        map.fitBounds(bounds);
    gridPanel(size_m);
    return bounds;
}

updateBaseLayerSize({x:800, y:600});

function View()
{
    return new Vue({
        el: '#form',
        data: {
            selection: null,
        },
        methods: {
            select: function(sel){ 
                this.selection = sel; 
            },
            cssClass: function(p){
                return p == this.selection ? 'w3-text-red'  : '';
            }
        }
    });
}

function Draw(view)
{
    var drawMode = null;
    var groupLayer = L.layerGroup().addTo(map);
    var modes = {
        line: drawLine(groupLayer),
        rect: drawRect(groupLayer),
        note: drawNote(groupLayer)
    }

    view.$watch('selection', function(sel)
    {
        if(drawMode){
            drawMode.exit();
        }
        drawMode = modes[sel];
        if(drawMode)
            drawMode.enter();
    })
}

function drawLine(groupLayer)
{
    var line = null;

    function enter(){
        line = map.editTools.startPolyline(undefined, {weight:2, color: 'red', dashArray:'5,10'});
        line.on('editable:drawing:commit', on_commit)

    }

    function exit(){
        if(line) {
            line.disableEdit();
            map.removeLayer(line);
            line.off('editable:drawing:commit', on_commit)
            line = null;
        }
    }

    function on_commit(event){
        line.disableEdit();
        map.removeLayer(line);
        line.setStyle({weight:4, color: 'green'});
        groupLayer.addLayer(line);
        line.off('editable:drawing:commit', on_commit)
        line = null;
    }


    return {enter:enter, exit: exit};
}

function drawRect(groupLayer){
    var rect = null;
    
    function enter(){
        rect = map.editTools.startRectangle(undefined, {weight:2, color: 'red', dashArray:'5,10'});
        rect.on('editable:drawing:commit', on_commit)
    }
    function exit(){

    }
    function on_commit(event){
        rect.disableEdit();
        map.removeLayer(rect);
        rect.setStyle({weight:2, color: 'green'});
        groupLayer.addLayer(rect);
        rect.off('editable:drawing:commit', on_commit)
        rect = null;
    }
    return {enter:enter, exit: exit};
}

function drawNote(groupLayer){
    function enter(){

    }
    function exit(){

    }
    return {enter:enter, exit: exit};
}


Draw(View());

