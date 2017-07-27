
/**
 * Add inqueue_on/inqueue_off methods on obj
 * with these methods clients could add event handler into stack
 * event handlers call from the tail, if handler return true? then processing stop
 * @param {*} obj 
 */
export function EventHandlerStack(obj)
{
    var stack = {};
    obj.inqueue_on = function(event_type, handler, context){
        var q = stack[event_type];
        if(!q){
            q = {};
            q.handlers = [];
            q.fn = function(event){
                var q = stack[event_type] || {handlers: []};
                for(var i=q.handlers.length-1; i>=0; i--){
                    var h = q.handlers[i];
                    if( h.call(h._context || this, event) === true )
                        break;
                }
            }
            stack[event_type] = q;
            obj.on(event_type, q.fn)
        }
        handler._context = context;
        q.handlers.push(handler);
    }

    obj.inqueue_off = function(event_type, handler){
        var q = stack[event_type];
        if(q){
            q.handlers = _.without(q.handlers, handler);
            if(!q.handlers.length){
                obj.off(event_type, q.fn);
                delete stack[event_type];
            }
        }
    }

    return obj;

}