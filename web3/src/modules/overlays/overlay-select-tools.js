
import * as a from '../../actions.js'
import {str} from '../../utils/utils.js'


export default function(config, store, map, overlayMapView)
{
    var tooltipContent = document.getElementById('tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; }
    var $roate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; }
    var $edit = function() { return tooltip.getElement().getElementsByTagName('i')[2]; }

    var cat2group = overlayMapView.cat2group;
    var cat2layers = overlayMapView.cat2layers;

    function onDeleteFeat(){
        store(a.OVERLAY_FEAT_DELETE);
    }

    function onEditFeat(e){
        store(a.OVERLAY_EDIT, true)
        closeTooltip(tooltip);
        L.DomEvent.stopPropagation(e);
    }

    function onRotateFeat(){
        store(a.OVERLAY_FEAT_ROTATE);   
        closeTooltip(tooltip);
    }

    function onFeatClick(cat, e){
        var layer_id = e.layer.id.split('.'),
            feat_id = str(cat,'.',layer_id[1]);
        store(a.OVERLAY_FEAT_SELECT, feat_id);        
        closeTooltip(tooltip);         
        L.DomEvent.stopPropagation(e);
    }


    function onFeatContext(cat, e){
        onFeatClick(cat, e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        var cl = cat === 'notes' ? L.DomUtil.removeClass : L.DomUtil.addClass; 
        cl($roate(), 'w3-hide')
        L.DomUtil.removeClass($edit(), 'w3-hide')
        L.DomEvent.on($delete(), 'click', onDeleteFeat);
        L.DomEvent.on($roate(), 'click', onRotateFeat);
        L.DomEvent.on($edit(), 'click', onEditFeat);
        // 
    }

    function closeTooltip(){        
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onDeleteFeat);
            L.DomEvent.off($roate(), 'click', onRotateFeat);
            L.DomEvent.off($edit(), 'click', onEditFeat);
        }
    }


    _.mapObject(cat2group, function(val, cat){
        val.group.on('click', _.partial(onFeatClick, cat));
    });

    
    _.mapObject(cat2group, function(val, cat){
        val.group.on('contextmenu', _.partial(onFeatContext, cat));
    });

    store.on('ui.overlay.feat', closeTooltip);
   
}