var express = require('express'),
		rooms = require('./rooms'),
		path = require('path');

var app = express();

var roomCache = {};

function loadRoomCache() {
	var allRooms = new rooms.Rooms();
	allRooms.loadRooms(function(rooms) {
		console.log('Rooms loaded into app');
		roomCache = rooms;
	});
};

app.configure(function() {
	loadRoomCache();
	app.use(app.router);
	app.use(express.static(path.join(__dirname,"resources"), {maxAge: 31557600000}));
});

app.get('/rooms', function(req, res) {
	res.send(roomCache);
});

app.get('/room/:roomId', function(req, res) {
	var room = roomCache[req.params.roomId],
			roomIsValid = false;
	if (room !== undefined) {
		var cacheRefreshDue = new Date(room.nextRefreshDue);
		if (cacheRefreshDue > new Date()) {
			roomIsValid = true;
		}
	}

	if (roomIsValid) {
		res.send(room);
	} else {
		room.loadRoom(function(room) {
			roomCache[room.roomId] = room;
			res.send(room);
		});
	}
});

var port = process.env.PORT || process.env.VCAP_APP_PORT || 1337;
var server = app.listen(port, function() {
	console.log('Server started on port %d', server.address().port);
})