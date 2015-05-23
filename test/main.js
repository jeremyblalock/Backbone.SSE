$(document).ready(function() {

  var TestModel = Backbone.SSE.Model.extend({

    initialize: function() {
      console.log("Initialize is being called.");
    },
    url: function() {
      return 'https://notifications.sy.n:9292/api/v1/users/77/stream';
    }

  });

  var model = new TestModel();

  model.on('sync', function(m) {
    console.log('sync', m.toJSON());
  });

  model.on('change:unread_count', function(m) {
    console.log('change:unread_count', m.get('unread_count'));
  });

  model.on('change:notification', function(m) {
    console.log('change:notification', m.get('notification'));
  });

  console.log(model);

  model.start();

});
