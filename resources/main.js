var roomCache = {},
    parsedRooms = {},
    selectedRoom = undefined;

$(function() {
  var url = window.location.href,
      svcUrlBase = url.substring(0, url.lastIndexOf("/")+1),
      roomsUrl = svcUrlBase + "rooms",
      roomUrl = svcUrlBase + "room/";

  var washerCtx = $('#roomDetails #washers .availability-chart').get(0).getContext('2d'),
      dryerCtx = $('#roomDetails #dryers .availability-chart').get(0).getContext('2d'),
      washerChart = new Chart(washerCtx),
      dryerChart = new Chart(dryerCtx);

  var picker = $('#roomPicker > select');

  function parseRooms(roomData) {
    var parsedRooms = {};
    for (var roomId in roomData) {
      var room = roomData[roomId],
          campusName = room.campusName,
          campusRooms = parsedRooms[campusName];
      if (campusRooms === undefined) {
        campusRooms = [];
        parsedRooms[campusName] = campusRooms;
      }
      campusRooms.push(room);
    }

    for (var campusName in parsedRooms) {
      parsedRooms[campusName] = parsedRooms[campusName].sort(function(a,b) {
        return a.name<b.name?-1:(a.name>b.name?1:0);
      });
    }

    return parsedRooms;
  }

  function pieChartData(available,busy,all) {
    var availCol = "#008110",
        busyCol = "#A60800",
        oooCol = "#AACCCC";
      
    return [
      { value: available.length, color: availCol },
      { value: busy.length, color: busyCol },
      { value: all.length - available.length - busy.length, color: oooCol }
    ];
  }

  function selectRoom(roomId) {
    $.get(roomUrl + roomId, function(d,s,j) {
      var washers = [],
          dryers = [];
      for (var washerId in d.washers) {
        washers.push(d.washers[washerId]);
      }
      for (var dryerId in d.dryers) {
        dryers.push(d.dryers[dryerId]);
      }
      var dryersInUse = dryers.filter(function(dryer) {
            return dryer.status === "in-use";
          }),
          dryersAvailable = dryers.filter(function(dryer) {
            return dryer.status === "available";
          }),
          washersInUse = washers.filter(function(washer) {
            return washer.status === "in-use";
          }),
          washersAvailable = washers.filter(function(washer) {
            return washer.status === "available";
          });

      $('#roomDetails #washers .panel-body').text(washersAvailable.length + '/' + washers.length + ' available');
      $('#roomDetails #dryers .panel-body').text(dryersAvailable.length + '/' + dryers.length + ' available');

      var chartOptions = {animateRotate: false, animateScale: true, animationSteps: 25};

      washerChart.Doughnut(pieChartData(washersAvailable, washersInUse, washers), chartOptions);
      dryerChart.Doughnut(pieChartData(dryersAvailable, dryersInUse, dryers), chartOptions);

      $.cookie('selected_room', roomId, 3650);
    });
  }

  function roomSelected(evt, params) {
    selectRoom(params.selected);
  }

  function setRoomsList() {
    picker.empty();
    picker.append($('<option></option>'));

    for (var campusId in parsedRooms) {
      var campusRooms = parsedRooms[campusId],
          campusOption = $('<optgroup></option>');
      
      campusOption.attr('label',campusId);
      picker.append(campusOption);

      for (var i = 0; i < campusRooms.length; i++) {
        var room = campusRooms[i],
            roomOption = $('<option></option>');
        roomOption.attr('value', room.roomId);
        roomOption.attr('data-campus', room.campusName)
        roomOption.text(room.name);
        picker.append(roomOption);
      };
    }

    picker.chosen({width: "100%"}).change(roomSelected);
  }

  $.get(roomsUrl, function(data, status, jqXHR) {
    roomCache = data;
    parsedRooms = parseRooms(roomCache);
    setRoomsList();
    var previouslySelectedRoomId = $.cookie('selected_room');
    if (previouslySelectedRoomId !== undefined) {
      selectRoom(previouslySelectedRoomId);
      picker.val(previouslySelectedRoomId);
      picker.trigger('chosen:updated');
    }
  });
});