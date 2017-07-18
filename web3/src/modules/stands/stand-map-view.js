import {toLatLngs} from '../../utils/utils.js'
import {selectedStands, selectedStandsId} from '../../state.js'
import {Stand} from '../../svg/leaflet-stand.js'

/**
 * 
 *  stands state 
 * {
 *      "standsId": {
 *          "id1": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *          "id2": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *          "id3": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *          "id4": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *          "id5": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *          "id6": { points: [], rotate: number, openWalls: number, type: {}, label: string, label_point: [] },
 *      }
 * }
 * 
 *  
 */

 export default function(config, store, map){
    var standsGroup = L.featureGroup().addTo(map);
    var stands = {}

    function onStandChanges(e)
    {
        var stands_id = selectedStandsId(store);
        if(e.new_val && !e.old_val) {
            var s = e.new_val;
            var style = config.stands.types[s.type].style;
            var $stand = new Stand(toLatLngs(s.points), style, s.openWalls);
            $stand.id = s.id;
            $stand.stands_id = stands_id;
            standsGroup.addLayer($stand);
            stands[s.id] = $stand;
        }
        else if(!e.new_val && e.old_val) {
            var id = _.last(e.path);
            var stand = stands[id];
            standsGroup.removeLayer(stand);
            delete stands[id];
        }
        else {
            var id = _.last(e.path);
            var $stand = stands[id];
            var s = e.new_val;
            var style = config.stands.types[s.type].style;
            $stand.update(toLatLngs(s.points), style, s.openWalls)
        }
    }
     

    function onSelectedStandsId(e){
        if(e.old_val){
            store.off('entities.stands.'+e.old_val+".*", onSelectedStandsId);
            standsGroup.clearLayers();
            stands = {};
        }
        if(e.new_val){
            store.on('entities.stands.'+e.new_val+".*", onSelectedStandsId);
            _.each(selectedStands(store), function(s){
                onStandChanges({new_val:s});
            });
        }
    }

    store.on('selectedStandsId', onSelectedStandsId );

    return {stands:stands, standsGroup:standsGroup}
 }
