var debug = require('debug')('sense');
var domain = require('domain');
var bleno = require('bleno');

var name = 'Sensé';
var uuids = [0x5353];

for (var c = 1; c < 7; ++c) {
	uuids.push(uuids[0] + c);
}

uuids = uuids.map(function(id) {
	return id.toString(16);
})

function errHandler(name) {
	return function(err) {
		if(err) {
			debug('Error in %s: %s', name, err);
		} else {
			debug('%s successful', name);
		}
	}
}

// handle bluetooth device state changes
// state = <"unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn">
bleno.on('stateChange', function(state) {
	debug('stateChange: %s', state);
});

// client connected
bleno.on('accept', function(clientAddress) {
	debug('client accepted: %s', clientAddress);
}); // Linux only

// client disconnected
bleno.on('disconnect', function(clientAddress) {
	debug('client disconnect: %s', clientAddress);
}); // Linux only

bleno.on('rssiUpdate', function(clientAddress) {
	debug('client rssiUpdate: %s', clientAddress);
}); // Linux only

var advertDomain = domain.create();

advertDomain.on('error', errHandler('advertising-domain'));

advertDomain.run(function() {
	bleno.on('advertisingStart', errHandler('on-advertisingStart'));
	bleno.on('advertisingStartError', errHandler('on-advertisingStartError'));
	bleno.on('advertisingStop', errHandler('on-advertisingStop'));

	bleno.startAdvertising(name, uuids, errHandler('startAdvertising'));
});

var characteristicDomain = domain.create();
characteristicDomain.on('error', errHandler('characteristic-domain'));

characteristicDomain.run(function() {
	var Characteristic = bleno.Characteristic;

	var characteristic = new Characteristic({
	    uuid: 'fff1', // or 'fff1' for 16-bit
	    properties: [  ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify'
	    secure: [  ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify'
	    value: null, // optional static value, must be of type Buffer
	    descriptors: [
	        // see Descriptor for data type
	    ],
	    onReadRequest: null, // optional read request handler, function(offset, callback) { ... }
	    onWriteRequest: null, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
	    onSubscribe: null, // optional notify subscribe handler, function(maxValueSize, updateValueCallback) { ...}
	    onUnsubscribe: null, // optional notify unsubscribe handler, function() { ...}
	    onNotify: null // optional notify sent handler, function() { ...}
	});


	bleno.on('servicesSet', errHandler('on-servicesSet'));
	var serviceDomain = domain.create();
	serviceDomain.on('error', errHandler('service-domain'));

	serviceDomain.run(function() {

		var PrimaryService = bleno.PrimaryService;

		var primaryService = new PrimaryService({
		    uuid: 'fff0', // 'fff0' for 16-bit
		    characteristics: [
		        characteristic
		    ]
		});

		var services = [
		   primaryService
		];

		bleno.setServices(services, errHandler('setServices'));

	});
});