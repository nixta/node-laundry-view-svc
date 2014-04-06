var express = require('express'),
    campus = require('./campus'),
    path = require('path');

var app = express();

var roomCache = {},
    serviceInitialized = false;

function setUpRoutes() {
  app.get('/rooms', function(req, res) {
    return res.send(roomCache);
  });

  app.get('/room/:roomId', function(req, res) {
    var room = roomCache[req.params.roomId],
      roomIsValid = false;

    if (room !== undefined) {
      var cacheRefreshDue = new Date(room.nextRefreshDue);
      if (cacheRefreshDue > new Date()) {
        roomIsValid = true;
      }
    } else {
      return res.send(404, "Room " + req.params.roomId + " does not exist");
    }

    if (roomIsValid) {
      res.send(room);
    } else {
      room.loadRoom(function(error, room) {
        if (error) {
          return res.send(500, {
            error: error
          });
        } else {
          roomCache[room.roomId] = room;
          return res.send(room);
        }
      });
    }
  });

  console.log("Initialized routes");
}

function loadRoomCache() {
  var c = new campus.Campus();
  c.loadRooms(function(rooms) {
    console.log(Object.keys(rooms).length + ' Rooms loaded into app');
    roomCache = rooms;
    serviceInitialized = true;
    setUpRoutes();
  });
};

app.configure(function() {
  loadRoomCache();
  app.use(app.router);
  app.use(express.static(path.join(__dirname, "resources"), {maxAge: 31557600000}));
});

var port = process.env.PORT || process.env.VCAP_APP_PORT || 1337;
var server = app.listen(port, function() {
  console.log('Server started on port %d', server.address().port);
})