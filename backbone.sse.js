/***************************************************
 *
 *  Backbone.SSE
 * 
 *  Effortless Backbone EventSource Integration
 *
 *  Copyright 2015, Jeremy Blalock & Synack, Inc.
 *
 *  v0.0.1
 *
 ***************************************************/

!function(Backbone, _, $) {
  var SSE = Backbone.SSE = {};

  var noop = function(key) {
    return function() {
      throw key + ' is not available in Backbone.SSE';
    }
  }

  SSE.Model = Backbone.Model.extend({
    constructor: function(attributes, options) {
      _.bindAll(this, '_receiveMessage', '_receiveError', '_receiveOpen');

      // Setup some instance variables:
      this._activeEvents = [];
      this._partials = {};

      // Call super constructor
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    /* Override default prefix for clarity. */
    cidPrefix: 'sse',

    /*
     * Initialize EventSource.
     * Meant to take the place of standard Model fetch.
     */
    start: function(url) {
      url = url || _.result(this, 'url');
      if (this._eventSource) {
        this.stop();
      };
      this._eventSource = new window.EventSource(url);

      this._eventSource.addEventListener('message', this._receiveMessage);
      this._eventSource.addEventListener('error',   this._receiveError);
      this._eventSource.addEventListener('open',    this._receiveOpen);

      // Listen to user-defined events
      for (var i = 0; i < this._activeEvents.length; i += 1) {
        this._listenToEvent(this._activeEvents[i]);
      }
    },

    /*
     * Teardown SSE connection.
     * Prevents memory leaks caused by starting many connections.
     */
    stop: function() {
      if (this._eventSource) {
        // Close connection
        this._eventSource.close();

        // Cleanup
        this._eventSource.removeEventListener('message', this._receiveMessage);
        this._eventSource.removeEventListener('error',   this._receiveError);
        this._eventSource.removeEventListener('open',    this._receiveOpen);

        // Cleanup to user-defined events
        for (var i = 0; i < this._activeEvents.length; i += 1) {
          this._stopListeningToEvent(this._activeEvents[i]);
        }

        // Unset
        this._eventSource = null;
      }
    },

    /*
     * Stop and start connection, to reset if failing.
     */
    restart: function() {
      this.stop();
      this.start();
    },

    /*
     * Capture events we're trying to listen to, to make sure we're
     * triggering those events.
     */
    on: function(name) {
      if (this._activeEvents.indexOf(name) == -1) {
        this._activeEvents.push(name);
        this._listenToEvent(name);
      }
      Backbone.Model.prototype.on.apply(this, arguments);
    },

    /* Receive data.
     * Triggers new sync event. */
    _receiveMessage: function(e) {
      var data = JSON.parse(e.data);
      this.set(this.parse(data));
      this.trigger('sync', this);
    },

    /* Receive arbitrary event.
     * Triggers that event. */
    _receiveEvent: function(evt, e) {
      var data = null;
      if (e.data) {
        data = JSON.parse(e.data);
      }
      this.trigger(evt, data, e);
    },

    /* Error Occurred.
     * Will happen every ~1s because of how SSE retries. */
    _receiveError: function(e) {
      this.trigger('eventSourceError', e);
    },

    /* Successfully established connection.
     * Trigger open event. */
    _receiveOpen: function(e) {
      this.trigger('opened', this);
    },

    /* Wrap underscore.js partial, using singleton pattern.
     * Will only work with string and numeric arguments. */
    _partial: function(functionName) {
      var args = _.values(arguments),
          key = args.join(',');
      if (key in this._partials) {
        return this._partials[key];
      }
      var func = this[functionName];
      if (!func) return null;
      var partial = _.bind.apply(_, [func, this].concat(args.slice(1)));
      this._partials[key] = partial;
      return partial
    },

    /* Listen to an arbitrary SSE event.
     * Useful for listening to heartbeats, updates, etc. */
    _listenToEvent: function(evt) {
      if (!this._eventSource) return;
      var func = this._partial('_receiveEvent', evt);
      this._eventSource.addEventListener(evt, func);
    },

    /* Stop listening to arbitrary SSE event.
     * Follows same pattern as _listenToEvent. */
    _stopListeningToEvent: function(evt) {
      var func = this._partial('_receiveEvent', evt);
      this._eventSource.removeEventListener(evt, func);
    },

    /* Disable invalid methods: */
    sync: noop('sync'),
    fetch: noop('fetch'),
    destroy: noop('destroy'),
    save: noop('save')
  });

}(Backbone, _, jQuery);
