var gpio = require('rpi-gpio');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sudo = require('sudo');
var options = {
    cachePassword: true,
    prompt: 'Password, yo? ',
    spawnOptions: {/* other options for spawn */}
};
var outlet = [];
server.listen(80, function (e) {
    console.log('Server started. Awaiting Input:');
    setInterval(checkSensor, 60000);
});
init();
gpio.setMode(gpio.MODE_BCM);
gpio.setup(19, gpio.DIR_IN, gpio.EDGE_BOTH);

gpio.on('change', function (channel, value) {
    if (channel == 19) {
        console.log('Motion detected.');
        outlet.motion = new Date();
        if (outlet.lights[1].status == false && value == true)
            if(outlet.motionOn == true && (outlet.motion.getHours() > 15 || outlet.motion.getHours() < 3))
            // Turn on light only if the light is off, the motion sensor was tripped, and it's past 5pm
            sendCode(1);

    }
});

io.on('connection', connection);

function init() {
    outlet.motion = new Date();
    outlet.motionOn = true;

    outlet.lights = [
        {'id': 0, 'name': 'Bedroom outlet.lights', 'status': false, 'code': [333116, 333107]},
        {'id': 1, 'name': 'Living Room Lamp', 'status': false, 'code': [333260, 333251]},
        {'id': 2, 'name': 'Audio Mixer', 'status': false, 'code': [333580, 333571]},
        {'id': 3, 'name': 'Office Lamp', 'status': false, 'code': [341260, 341251]}
    ];
    app.use(express.static('public'));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/outlet.html');
    });
}

function connection(socket) {
    console.log("User connected: " + socket.id);
    io.emit('light status', outlet.lights);
    io.emit('motion set', outlet.motionOn);

    socket.on('motion set', function (n) {
        outlet.motionOn = n;
        console.log('Motion sensor set to ' + outlet.motionOn);
        io.emit('motion set', outlet.motionOn);
    });

    socket.on('light status', function (n) {
        io.emit('light status', outlet.lights);
        io.emit('motion set', outlet.motionOn);
    });

    socket.on('light change', function (n) {

        if (outlet.lights[n].status) {

            sendCode(n);
        }
        else {
            console.log('Turning the ' + outlet.lights[n].name + ' on');
            sendCode(n);
        }
        io.emit('light status', outlet.lights);
    });

    socket.on('disconnect', function () {
    });
}

function sendCode(light) {
    var code;
    if (outlet.lights[light].status) {
        code = outlet.lights[light].code[0];
        outlet.lights[light].status = false;
        console.log('Turning the ' + outlet.lights[light].name + ' off');
    }
    else {
        code = outlet.lights[light].code[1];
        outlet.lights[light].status = true;
        console.log('Turning the ' + outlet.lights[light].name + ' on');
    }
    var child = sudo(['/var/www/rfoutlet/codesend', code.toString()], options);
    child.stdout.on('data', function (data) {

        io.emit('light status', outlet.lights);
    });
}

function checkSensor() {
    if(outlet.motionOn == true) {
        console.log('Any motion in the past 5 minutes?');
        gpio.read(19, function (err, value) {
            if (value == false && outlet.lights[1].status == true) {
                if (new Date().getTime() - outlet.motion.getTime() > 300000) {
                    sendCode(1);
                    console.log('No motion.');
                } else {
                    console.log('Yes. Checking again in a minute.');
                }
            }
        });
    }
}
