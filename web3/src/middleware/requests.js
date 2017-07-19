
import * as a from '../actions.js'
import {selectedStandsId} from '../state.js'
import {Immutable} from "../utils/fp.js"

export default function RequestsMiddleware(store){
    return function(next){
        return function(action)
        {
            switch(action.type)
            {
                case a.INIT:
                    d3.json('/pavilions/')
                      .get(function(pavilions){
                            store(a.PAVILIONS_LOADED, pavilions);
                      }); 

                    d3.json('/bases/')
                      .get(function(bases){
                            store(a.BASES_LOADED, bases);
                      });

                    d3.json('/overlays/')
                      .get(function(bases){
                            store(a.OVERLAYS_LOADED, bases);
                      });

                    d3.json('/stands/')
                      .get(function(stands){
                            store(a.STANDS_LOADED, stands);
                      });

                    break;

                case a.PAVILION_ADD:
                    var pavi = action.payload;
                    d3.request('/pavilions/0')
                           .mimeType("application/json")
                           .on("error", function(error) { store(a.ERROR_SET, error); })
                           .on("load", function(xhr) { 
                               var res = JSON.parse(xhr.responseText);
                               pavi = _.extend({}, pavi, res)
                               store(a.PAVILION_ADDED, pavi);
                            })
                           .send('POST', JSON.stringify(pavi));
                    break;

                case a.PAVILION_DELETE:
                    var id = action.payload.id;
                    d3.request('/pavilions/'+id+'|delete')
                      .post(function(er, xhr){
                            if(er) store(a.ERROR_SET, er);
                            else store(a.PAVILION_DELETED, id)
                      });
                    break;

                case a.BASE_LAYER_SAVE:
                    var base_layer = _.clone(action.payload.base);
                    delete base_layer['distance'];
                    delete base_layer['raw_svg'];
                    d3.request('/pavilions/'+base_layer.id+'/base/')
                        .mimeType("application/json")
                        .send('POST', JSON.stringify(base_layer), function(er, xhr){
                            if(er) store(a.ERROR_SET, er.target.responseText)
                            else {
                                var res = JSON.parse(xhr.responseText);
                                base_layer = _.extend({}, base_layer, res);
                                store(a.BASE_LAYER_SAVED, base_layer)
                            }
                        });
                    break;

                case a.OVERLAY_SAVE:
                    var overlay = action.payload;
                    d3.request('/pavilions/'+overlay.id+'/overlay/')
                        .mimeType("application/json")
                        .send('POST', JSON.stringify(overlay), function(er, xhr){
                            if(er) store(a.ERROR_SET, er.target.responseText || 'Connection error')
                            else {
                                var res = JSON.parse(xhr.responseText);
                                overlay = _.extend({}, overlay, res);
                                store(a.OVERLAY_SAVED, overlay);
                            }
                        });
                    break;

                case a.STAND_ADD:
                    var stand = action.payload;
                    var stands_id = selectedStandsId(store);
                    d3.request('/stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(a.ERROR_SET, er.target.responseText || 'Connection error')
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(a.STAND_ADDED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                      });
                    break;

                case a.STAND_TYPE_UPDATE:
                    var type = action.payload.type;
                    var stand = action.payload.stand;
                    stand = Immutable.set(stand, 'type', type);
                    var stands_id = selectedStandsId(store);
                    d3.request('/stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(a.ERROR_SET, er.target.responseText || 'Connection error')
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(a.STAND_UPDATED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                    });
                    break;
                
                case a.STAND_POINTS_UPDATE:
                    var stand = action.payload.stand;
                    var points = action.payload.points;
                    stand = Immutable.set(stand, 'points', points);
                    var stands_id = selectedStandsId(store);
                    d3.request('/stands/'+stands_id)
                      .mimeType("application/json")
                      .send('POST', JSON.stringify(stand), function(er, xhr){
                          if(er) store(a.ERROR_SET, er.target.responseText || 'Connection error')
                          else{
                              var res = JSON.parse(xhr.responseText);
                              stand = _.extend({}, stand, res);
                              store(a.STAND_UPDATED, {
                                  stands_id: stands_id,
                                  stand: stand
                              });
                          }
                    });
                    break;

                case a.STAND_DELETE:
                    var stand = action.payload;
                    var stands_id = selectedStandsId(store);
                    d3.request('/stands/'+stands_id+'/'+stand.id+'|delete')
                      .mimeType("application/json")
                      .get(function(er, xhr){
                            if(er) store(a.ERROR_SET, er);
                            else {
                                var res = JSON.parse(xhr.responseText);
                                store(a.STAND_DELETED, {
                                    stands_id: res.stands_id,
                                    stand: res.stand_id
                                });
                            }
                      });
                    break;


                    
            }
            next(action);
        }
    }
}