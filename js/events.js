/**
// 
**/
class Events {

    constructor (context) {
        
        this.context = context;
        this.listeners = {};
    }

    listenTo (target, evt_name, callback, opt_context) {

        var scope = opt_context ? opt_context : this.context;
        var new_listener = {
            target: target,
            callback: callback,
            context: scope
        };

        if (this.listeners[evt_name]) {
            this.listeners[evt_name].push(new_listener);
        } else {
            this.listeners[evt_name] = [new_listener];
        }
    }
    stopListening (target, evt_name, callback) {

        var listener;
        var listeners = this.listeners[evt_name];
        var leftovers = [];

        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                listener = listeners[i];
                if (listener.target !== target && listener.callback !== callback) {
                    leftovers.push(listener);
                }
            }
            this.listeners[evt_name] = leftovers;
        }
    }
    isListening (target, evt_name, callback) {

        var listeners = this.listeners[evt_name];
        var confirmed = [];
        if (listeners) {
            confirmed = listeners.filter( (item) =>
                (item.target === target && item.callback === callback)
            );
            return confirmed !== [];
        }
    }
    dispatch (evt_name, caller, params) {

        var listener;
        var args = Array.prototype.slice.call(arguments, 1);
        var listeners = this.listeners[evt_name];
        var doCallback = listener => listener.callback.apply(listener.context, args);
            
        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                listener = listeners[i];
                if (listener.target === caller) {
                    doCallback(listener);
                }
            }
        }
    }
}

export default Events;