
import * as a from '../../actions.js'
import {str} from '../../utils/utils.js'


export default function(config, store, map, overlayMapView)
{
    var tooltipContent = document.getElementById('overlay-tooltip-template').text;
    var tooltip = L.tooltip({permanent:true, interactive: true}).setContent(tooltipContent);
    var $delete = function() { return tooltip.getElement().getElementsByTagName('i')[0]; }
    var $roate = function() { return tooltip.getElement().getElementsByTagName('i')[1]; }

    var cat2group = overlayMapView.cat2group;
    var cat2layers = overlayMapView.cat2layers;

    function onDeleteFeat(){
        store(a.OVERLAY_FEAT_DELETE);
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
    }

    function onFeatContext(cat, e){
        onFeatClick(cat, e);
        tooltip.setLatLng(e.latlng);
        map.addLayer(tooltip); 
        $roate().style.display = cat === 'notes' ? '' : 'none';
        L.DomEvent.on($delete(), 'click', onDeleteFeat);
        L.DomEvent.on($roate(), 'click', onRotateFeat);
    }

    function closeTooltip(){
        if(tooltip._map) {
            map.removeLayer(tooltip); 
            L.DomEvent.off($delete(), 'click', onDeleteFeat);
            L.DomEvent.off($roate(), 'click', onRotateFeat);
        }
    }


    _.mapObject(cat2group, function(val, cat){
        val.group.on('click', _.partial(onFeatClick, cat));
    });

    
    _.mapObject(cat2group, function(val, cat){
        val.group.on('contextmenu', _.partial(onFeatContext, cat));
    });

    store.on('ui.overlay.feat', closeTooltip);
    // store.on('ui.overlay.feat', onSelectFeat);
    // map.on('click', closeTooltip);

  
}