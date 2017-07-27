
import * as a from '../../actions.js'
import {selectedStand} from '../../state.js'
import {str} from '../../utils/utils.js'


export default function(config, store, map, standMapView)
{
    var $stands = standMapView.stands;
    var tooltipContent = document.getElementById('tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    
    var $edit = function() { return tooltip.getElement().getElementsByTagName('i')[0]; }
    var $rotate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; }
    var $flip = function() { return tooltip.getElement().getElementsByTagName('i')[2]; }
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[3]; }
    


    function onStandClick(e){
        store(a.STAND_SELECT, e.layer.id);
        closeTooltip(tooltip);         
        L.DomEvent.stopPropagation(e);
    }

    function onStandContext(e){
        onStandClick(e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        L.DomUtil.removeClass($rotate(), 'w3-hide')
        L.DomUtil.removeClass($flip(), 'w3-hide')
        L.DomUtil.removeClass($edit(), 'w3-hide')
        L.DomEvent.on($delete(), 'click', onStandDelete);
        L.DomEvent.on($rotate(), 'click', onStandRotate);
        L.DomEvent.on($flip(), 'click', onStandFlip);
        L.DomEvent.on($edit(), 'click', onStandEdit);
        L.DomEvent.stopPropagation(e);
    }

    function onStandDelete(e){
        store(a.STAND_DELETE, selectedStand(store))
        closeTooltip()
    }

    function onStandTransform(method){
        var stand = selectedStand(store);
        var $stand = $stands[stand.id];
        if($stand) {
            $stand[method]();
            var points = map.toPoints($stand.getLatLngs())
            store(a.STAND_POINTS_UPDATE, {stand: stand, points:points});
        }
        closeTooltip(tooltip);
    }

    var onStandRotate = _.partial(onStandTransform, 'rotate');
    var onStandFlip = _.partial(onStandTransform, 'flip');

    function onStandEdit(e){
        store(a.STAND_EDIT, true)
        closeTooltip()
        L.DomEvent.stopPropagation(e);
    }

    function closeTooltip(){
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onStandDelete);
            L.DomEvent.off($rotate(), 'click', onStandRotate);
            L.DomEvent.on($flip(), 'click', onStandFlip);
            L.DomEvent.off($edit(), 'click', onStandEdit);
        }
    }


    standMapView.standsGroup.on('click', onStandClick);
    standMapView.standsGroup.on('contextmenu', onStandContext);

    store.on('ui.stands.sel', closeTooltip);
}