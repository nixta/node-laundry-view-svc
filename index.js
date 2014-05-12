var express = require('express'),
    campus = require('./campus'),
    path = require('path'),
    async = require('async');

var app = express();

var roomCache = {},
    campusConfigs = {
      216: {
        id:'pcv',
        name:'Peter Cooper Village'
      },
      219: {
        id:'st',
        name:'Stuyvesant Town'
      }
    };

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
  var loadFunctions = {};

  for (var campusId in campusConfigs) {
    var campusConfig = campusConfigs[campusId];
    var c = new campus.Campus(campusId, campusConfig.name);
    campusConfig['campus'] = c;
    loadFunctions[campusId] = c.loadRooms.bind(c);
  }

  async.parallel(loadFunctions, function(err, results) {
    if (err) {
      console.log("Error getting rooms lists: ", err);
    } else {
      for (var campusId in results) {
        var campusRooms = results[campusId];
        for (var roomId in campusRooms) {
          roomCache[roomId] = campusRooms[roomId];
        }
      }
      console.log('Loaded ' + Object.keys(roomCache).length + ' rooms across ' + Object.keys(results).length + ' campuses');
      setUpRoutes();
    }
  });
};

app.configure(function() {
  loadRoomCache();
  app.use(app.router);
  app.use(express.static(path.join(__dirname, "web"), {maxAge: 31557600000}));
});

var port = process.env.PORT || process.env.VCAP_APP_PORT || 1337;
var server = app.listen(port, function() {
  console.log('Server started on port %d', server.address().port);
})