
import * as a from '../../actions.js'
import {str} from '../../utils/utils.js'
import {selectedOverlayId} from '../../state.js'

export default function(config, store, map, overlayMapView)
{
    var tooltipContent = document.getElementById('overlay-tooltip-template').text;
    var tooltip = L.tooltip({permanent:true}).setContent(tooltipContent);

    var selectedLayer = null;
    var cat2group = overlayMapView.cat2group;
    var cat2layers = overlayMapView.cat2layers;

    function onFeatureClick(cat, e){
        var layer_id = e.layer.id.split('.'),
            feat_id = str(cat,'.',layer_id[1]);
        store(a.OVERLAY_FEAT_SELECT, feat_id);
    }

    _.mapObject(cat2group, function(val, cat){
        val.group.on('click', _.partial(onFeatureClick, cat));
    });

    function onDeleteFeat(){
        store(a.OVERLAY_FEAT_DELETE);
    }

    function updateSelectedLayer(e){
        if(selectedLayer) {
            selectedLayer.disableEdit();
            selectedLayer = null;
            L.DomEvent.off(tooltip.getElement(), 'click', onDeleteFeat);
            map.removeLayer(tooltip);
        }
        var feat_path = e.new_val;
        if(feat_path){
            var p = feat_path.split('.'),
                cat = p[0],
                id = p[1];
            var overlay_id = selectedOverlayId(store)
            var layer_id = str(overlay_id, '.', id);
            selectedLayer = cat2layers[cat][layer_id];
            if(selectedLayer) {
                selectedLayer.enableEdit(map);      
                tooltip.setLatLng(selectedLayer.getCenter());
                map.addLayer(tooltip);
                L.DomEvent.on(tooltip.getElement(), 'click', onDeleteFeat);
            }
        }
    }

    store.on('ui.overlay.feat', updateSelectedLayer);

    
}