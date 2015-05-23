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
    },

    /*
     * Teardown SSE connection.
     * Prevents memory leaks caused by starting many connections.
     */
    stop: function() {
      if (this._eventSource) {
        // Close connection
        this._eventSource.stop();

        // Cleanup
        this._eventSource.removeEventListener('message', this._receiveMessage);
        this._eventSource.removeEventListener('error',   this._receiveError);
        this._eventSource.removeEventListener('open',    this._receiveOpen);

        // Unset
        this._eventSource = null;
      }
    },

    /* Receive data.
     * Triggers new sync event. */
    _receiveMessage: function(e) {
      var data = JSON.parse(e.data);
      this.set(this.parse(data));
      this.trigger('sync', this);
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

    /* Disable invalid methods: */
    sync: noop('sync'),
    fetch: noop('fetch'),
    destroy: noop('destroy'),
    save: noop('save')
  });

}(Backbone, _, jQuery);
