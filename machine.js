var outOfOrder = 'out-of-order',
		inUse = 'in-use',
		available = 'available',
		unknown = 'unknown',
		statuses = {
			'unknown': 'Unknown',
			'out-of-order': 'Out of Order',
			'in-use': 'In Use',
			'available': 'Available'
		};

var freeFlag = 0,
		minutesLeft = 1,
		oooFlag = 2,
		globalId = 3,
		statusNote = 6;

function parseStatus(machine, encodedStatus) {
	var statusParts = encodedStatus.split(':');

	if (statusParts[oooFlag]==1) {
		machine.status = outOfOrder;
	} else if (statusParts[freeFlag]==1) {
		machine.status = available;
	}	else {
		machine.status = inUse;
	}
	
	if (machine.status === inUse) {
		machine.minutesLeft = parseInt(statusParts[minutesLeft]);
	}

	if (statusParts[statusNote] != 0) {
		machine.message = statusParts[statusNote];
	}

	machine.globalId = statusParts[globalId];

	machine.statusString = statuses[machine.status];
}

Machine = function(machineId, encodedStatus) {
	this.machineId = machineId;
	this.status = unknown;
	this.statusString = ''
	this.minutesLeft = 0;
	this.message = '';
	this.globalId = 0;

	parseStatus(this, encodedStatus);
};

exports.Machine = Machine;