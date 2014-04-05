var request = require('request'),
		util = require('util'),
		machine = require('./machine');

require('date-utils');

var roomDynamicStatusUrl = 'http://www.laundryview.com/dynamicRoomData.php?location=%s',
		roomApplianceStatusUrl = 'http://www.laundryview.com/appliance_status_ajax.php?lr=%s';

var roomIdPrefix = 'laundry_room.php?lr=',
		deadStatus = '1:0:0:0:0:0:';

Room = function($room) {
	this.name = $room.text().trim();
	this.roomId = $room.attr('href').replace(roomIdPrefix, '');
	this.washers = [];
	this.dryers = [];
	this.lastRefresh = null;
	this.nextRefreshDue = new Date();
};

Room.prototype = {
	parseRoomOutput: function(roomData) {
		// console.log(roomData);
		var dataRows = roomData.split('&');
		dataRows.shift();
		for (var i = 0; i < dataRows.length;i++) {
			try {
				var keyValue = dataRows[i].split('='),
						k = keyValue[0],
						v = keyValue[1].replace(/\s+$/g, '');
				// console.log('k = "' + k + '" -- v = "' + v + '"');
				if (v !== deadStatus &&
						k.substring(0,13) === 'machineStatus') {
					k = k.substring(13);
					var vs = v.split('\n');

					if (vs.length === 1) {
						var w = new machine.Machine(k,vs[0]);
						this.washers.push(w);
					} else {
						var d = new machine.Machine(k,vs[0]);
						this.dryers.push(d);
						d = new machine.Machine(k+'a',vs[1]);
						this.dryers.push(d);
					}
				}
			} catch (err) {
				console.log(dataRows);
				console.log("Error parsing the room: " + err);				
			}
		};
	},
	loadRoom: function(callback) {
		var opts = {
			url: util.format(roomDynamicStatusUrl, this.roomId),
			jar: true
		};

		self = this;

		request(opts, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log("Loaded room " + self.roomId);
				self.parseRoomOutput(body);
				self.lastRefresh = new Date();
				self.nextRefreshDue = self.lastRefresh.clone().addMinutes(1);
				callback(self);
			}
		});
	}
};

exports.Room = Room;
