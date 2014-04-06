var request = require('request'),
    util = require('util'),
    machine = require('./machine');

require('date-utils');

var roomDynamicStatusUrl = 'http://www.laundryview.com/dynamicRoomData.php?location=%s',
    roomApplianceStatusUrl = 'http://www.laundryview.com/appliance_status_ajax.php?lr=%s';

var roomIdPrefix = 'laundry_room.php?lr=',
    deadStatus = '1:0:0:0:0:0';

Room = function(campus, $room) {
  this.campus = campus;
  this.name = $room.text().trim();
  this.roomId = $room.attr('href').replace(roomIdPrefix, '');
  this.washers = [];
  this.dryers = [];
  this.lastRefresh = null;
  this.nextRefreshDue = new Date();
};

Room.prototype = {
  parseRoomOutput: function(roomData) {
    // console.log(">>" + roomData + "<<");
    var dataRows = roomData.split(/^&|:\n&|:\n$/g);
    dataRows.shift();
    dataRows.pop();
    var machineId = 1;
    for (var i = 0; i < dataRows.length; i++) {
      try {
        var keyValue = dataRows[i].split('='),
          k = keyValue[0],
          v = keyValue[1];
        // console.log('"' + k + '" = "' + v + '"');
        if (v !== deadStatus && k.substring(0, 13) === 'machineStatus') {
          var vs = v.split('\n');

          if (vs.length === 1) {
            this.washers.push(new machine.Machine(machineId++, vs[0]));
          } else {
            this.dryers.push(new machine.Machine(machineId++, vs[0]));
            this.dryers.push(new machine.Machine(machineId++, vs[1]));
          }
        }
      } catch (err) {
        console.log(roomData);
        console.log(dataRows);
        console.log("Error parsing the room: " + err);
      }
    };
  },
  loadRoom: function(callback, forceJar) {
    // forceJar = forceJar!==undefined;
    var opts = {
      url: util.format(roomDynamicStatusUrl, this.roomId),
      jar: this.campus.jar
    };
    // console.log("---- ROOM FORCE JAR: " + forceJar);
    // console.log('Requesting:');
    // console.log(opts);

    self = this;

    debugger;
    request(opts, function(error, response, body) {

      function handleRoomUpdateData(r,b) {
        console.log("Loaded room " + r.roomId);
        r.parseRoomOutput(b);
        r.lastRefresh = new Date();
        r.nextRefreshDue = r.lastRefresh.clone().addMinutes(1);
        callback(null, r);
      }
      
      if (!error && response.statusCode == 200) {

        console.log("= ROOM ====================================");
        console.log("REQUEST HEADER " + response.req._header);
        console.log("RESPONSE HEADERS");
        console.log(response.headers);
        console.log("- ROOM ------------------------------------");
        debugger;

        console.log('Got body: ' + body);
        if (body.length == 0) {
          // Cookie expired.
          console.log('**** Cookie Expired. Getting a new one');
          // request.defaults({jar:true});
          self.campus.refreshSession(function(e,r,b) {
            console.log('**** Refreshed session cookie');
            this.loadRoom(callback);
          }.bind(self), true);
        } else {
          console.log('**** Cookie OK');
          handleRoomUpdateData(self,body);
        }

      } else {
        console.log('Could not load room ' + self.roomId);
        callback(error, self);
      }
    }.bind(this));
  },
  toJSON: function() {
    var copy = {},
        exclude = {campus: 1};
    for (var prop in this) {
      if (!exclude[prop]) {
        copy[prop] = this[prop];
      }
    }
    // console.log(copy);
    return copy;
  }
};

exports.Room = Room;