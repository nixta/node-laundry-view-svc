var request = require('request'),
    cheerio = require('cheerio'),
    cookie = require('cookie'),
    r = require('./room');

var roomListHtmlUrl = 'http://www.laundryview.com/lvs.php?s=219';

function parseRooms(htmlBody) {
  console.log('Parsing Rooms...');
  var $ = cheerio.load(htmlBody),
      result = {};
  $('a[class="a-room"]').each(function(index) {
    var room = new r.Room($(this));
    result[room.roomId] = room;
  });
  return result;
};

Rooms = function() {
  this.rooms = [];
  this.PHPSESSID = '';
};

Rooms.prototype = {
  loadRooms: function(callback) {
    self = this;
    var opts = {
      url: roomListHtmlUrl,
      jar: true
    };
    request(opts, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Got rooms');
        var cookies = cookie.parse(response.headers['set-cookie'][0]);
        this.PHPSESSID = cookies['PHPSESSID'];
        this.rooms = parseRooms(body);

        callback(this.rooms);
      }
    });
  }
};

exports.Rooms = Rooms;