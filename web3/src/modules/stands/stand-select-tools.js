
import * as a from '../../actions.js'
import {str} from '../../utils/utils.js'


export default function(config, store, map, standMapView)
{
    var tooltipContent = document.getElementById('tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; }
    var $roate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; }
    var $edit = function() { return tooltip.getElement().getElementsByTagName('i')[2]; }


    function onStandClick(e){
        store(a.STAND_SELECT, e.layer.id);
        closeTooltip(tooltip);         

    }

    function onStandContext(e){
        onStandClick(e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        L.DomUtil.removeClass($roate(), 'w3-hide')
        L.DomUtil.removeClass($edit(), 'w3-hide')
        L.DomEvent.on($delete(), 'click', onStandDelete);
        L.DomEvent.on($roate(), 'click', onStandRotate);
        L.DomEvent.on($edit(), 'click', onStandEdit);
        
    }

    function onStandDelete(){

    }

    function onStandRotate(){

    }

    function onStandEdit(){

    }

    function closeTooltip(){
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onStandDelete);
            L.DomEvent.off($roate(), 'click', onStandRotate);
            L.DomEvent.off($edit(), 'click', onStandEdit);
        }
    }


    standMapView.standsGroup.on('click', onStandClick);
    standMapView.standsGroup.on('contextmenu', onStandContext);
}