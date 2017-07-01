import {PAVILIONS_LOADED,
        PAVILION_DELETE,
        PAVILION_DELETED,
        PAVILION_ADD, 
        PAVILION_ADDED,
        BASE_LAYER_SAVE, 
        BASE_LAYER_SAVED, 
        ERROR_SET, 
        INIT} from '../actions.js'

export default function RequestsMiddleware(store){
    return function(next){
        return function(action)
        {
            switch(action.type)
            {
                case INIT:
                    d3.json('/pavilions/')
                      .get(function(pavilions){
                            store(PAVILIONS_LOADED, pavilions);
                      }); 
                    break;

                case PAVILION_ADD:
                    var pavi = action.payload;
                    d3.request('/pavilions/0')
                           .mimeType("application/json")
                           .on("error", function(error) { store(ERROR_SET, error); })
                           .on("load", function(xhr) { 
                               var res = JSON.parse(xhr.responseText);
                               pavi = _.extend({}, pavi, res)
                               store(PAVILION_ADDED, pavi);
                            })
                           .send('POST', JSON.stringify(pavi));
                    break;

                case PAVILION_DELETE:
                    var id = action.payload.id;
                    d3.request('/pavilions/'+id+'|delete')
                      .post(function(er, xhr){
                            if(er) store(ERROR_SET, er);
                            else store(PAVILION_DELETED, id)
                      });
                    break;

                case BASE_LAYER_SAVE:
                    var pavi_id = action.payload.pavi_id;
                    var base_layer = _.clone(action.payload.base);
                    delete base_layer['distance'];
                    delete base_layer['raw_svg'];
                    d3.request('/pavilions/'+pavi_id+'/base/0')
                        .mimeType("application/json")
                        .send('POST', JSON.stringify(base_layer), function(er, xhr){
                            if(er) store(ERROR_SET, er)
                            else {
                                var res = JSON.parse(xhr.responseText);
                                base_layer = _.extend({}, base_layer, res);
                                store(BASE_LAYER_SAVED, {pavi_id:pavi_id, base: base_layer})
                            }
                        })

                    
            }
            next(action);
        }
    }
}