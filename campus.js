var request = require('request'),
    cheerio = require('cheerio'),
    cookie = require('cookie'),
    r = require('./room');

var roomListHtmlUrl = 'http://www.laundryview.com/lvs.php?s=219';

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

Campus = function() {
  this.rooms = [];
  this.PHPSESSID = '';
  this.jar = request.jar();
};

Campus.prototype = {
  loadRooms: function(callback) {
  	self = this;
  	this.refreshSession(function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Got rooms');
        self.rooms = parseRooms(self, body);
        callback(self.rooms);
      }
    }, false);
  },

  refreshSession: function(callback, forceRefresh) {
    self = this;
    forceRefresh = forceRefresh!==undefined && forceRefresh;
    if (forceRefresh) {
    	// New cookie jar = new session ID
  	  this.jar = request.jar();
    }

    var opts = {
      url: roomListHtmlUrl,
      jar: this.jar
    };

    request(opts, function(error, response, body) {
      if (!error && response.statusCode == 200) {
    		if (response.headers.hasOwnProperty('set-cookie')) {
    			// New cookie provided
	      	try {
	          var cookies = cookie.parse(response.headers['set-cookie'][0]);
		        if (cookies.hasOwnProperty(phpSessionCookieName)) {
			        self.PHPSESSID = cookies[phpSessionCookieName];
		        	console.log('New PHPSESSID cookie: ' + self.PHPSESSID);
		        }
		    	} catch (err) {
						console.log("Error reading updated cookie: " + err);
	      	}
	      }
      }
      callback(error, response, body);
    });
  }
};

exports.Campus = Campus;