var request = require('request'),
    cheerio = require('cheerio'),
    cookie = require('cookie'),
    r = require('./room');

var roomListHtmlUrlTemplate = 'http://www.laundryview.com/lvs.php?s=';

var phpSessionCookieName = 'PHPSESSID';

function parseRooms(campus, htmlBody) {
  var $ = cheerio.load(htmlBody),
      result = {};
  $('a[class="a-room"]').each(function(index) {
    var room = new r.Room(campus, $(this));
    result[room.roomId] = room;
  });
  return result;
};

Campus = function(sessionKey, campusName) {
	this.roomsUrl = roomListHtmlUrlTemplate + sessionKey;
	this.name = campusName;
  this.rooms = [];
  this.PHPSESSID = '';
  this.jar = request.jar();
};

Campus.prototype = {
  loadRooms: function(callback) {
  	this.refreshSession(function(error, response, body) {
      if (!error && response.statusCode == 200) {
        this.rooms = parseRooms(this, body);
        console.log('Loaded ' + Object.keys(this.rooms).length + ' rooms for ' + this.name);
        return callback(null, this.rooms);
      } else {
      	return callback(error, null);
      }
    }.bind(this), false);
  },

  refreshSession: function(callback, forceRefresh) {
    forceRefresh = forceRefresh!==undefined && forceRefresh;
    if (forceRefresh) {
    	// New cookie jar = new session ID
  	  this.jar = request.jar();
    }

    var opts = {
      url: this.roomsUrl,
      jar: this.jar
    };

    request(opts, function(error, response, body) {
      if (!error && response.statusCode == 200) {
    		if (response.headers.hasOwnProperty('set-cookie')) {
    			// New cookie provided
	      	try {
	          var cookies = cookie.parse(response.headers['set-cookie'][0]);
		        if (cookies.hasOwnProperty(phpSessionCookieName)) {
			        this.PHPSESSID = cookies[phpSessionCookieName];
		        	console.log('New PHPSESSID cookie: ' + this.PHPSESSID);
		        }
		    	} catch (err) {
						console.log("Error reading updated cookie: " + err);
	      	}
	      }
      }
      callback(error, response, body);
    }.bind(this));
  }
};

exports.Campus = Campus;