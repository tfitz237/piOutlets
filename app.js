var gpio = require('rpi-gpio');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser     =        require("body-parser");

var app = express();
app.use(cookieParser());
app.use(bodyParser());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static('public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sudo = require('sudo');
var jwt = require('jsonwebtoken');

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

    gpio.setMode(gpio.MODE_BCM);
    gpio.setup(19, gpio.DIR_IN, gpio.EDGE_BOTH);
    outlet.motion = new Date();
    outlet.motionOn = true;

    outlet.lights = [
        {'id': 0, 'name': 'Bedroom', 'status': false, 'code': [333116, 333107]},
        {'id': 1, 'name': 'Living Room', 'status': false, 'code': [333260, 333251]},
        {'id': 2, 'name': 'Audio Mixer', 'status': false, 'code': [333580, 333571]},
        {'id': 3, 'name': 'Office', 'status': false, 'code': [341260, 341251]}
    ];

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/login.html');
    });
    app.get('/login', function (req, res) {
        res.sendFile(__dirname + '/login.html');
    });
    app.post('/login', function (req, res) {
        console.log(req.body);
        var user = { name: req.body.username, pass: req.body.password};
        if(user.name == "tfitz237" && user.pass == "tfitz123") {
            res.cookie('jwt', jwt.sign(user, 'supersecretcode'));

        }
        res.redirect("/lights");
    });
    app.get('/lights', function(req, res) {
        if(req.cookies.jwt != undefined && jwt.verify(req.cookies.jwt, 'supersecretcode', {ignoreExpiration: true})) {
            res.sendFile(__dirname + '/index.html');
        }
    });
    app.post('/lights/:on/:lightName', function(req,res) {
        if(jwt.verify(req.body.token, 'supersecretcode', {ignoreExpiration: true})) {
            var name = req.params.lightName;
            var on = (req.params.on == "on");
            findAndSend(name.replace('the','').trim(), on);
	    console.log("POST<'"+name+"'>", on);
        }
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
        sendCode(n);
        io.emit('light status', outlet.lights);
    });

    socket.on('disconnect', function () {
    });
}

function sendCode(light, on) {
    var code;
    if(typeof on !== "undefined") {
        if (!on) {
            code = outlet.lights[light].code[1];
            outlet.lights[light].status = true;
            console.log('Turning the ' + outlet.lights[light].name + ' on');
        } else {
            code = outlet.lights[light].code[0];
            outlet.lights[light].status = false;
            console.log('Turning the ' + outlet.lights[light].name + ' off');
        }
    } else {
        if (!outlet.lights[light].status) {
            code = outlet.lights[light].code[1];
            outlet.lights[light].status = true;
            console.log('Turning the ' + outlet.lights[light].name + ' on');
        } else if (outlet.lights[light].status) {
            code = outlet.lights[light].code[0];
            outlet.lights[light].status = false;
            console.log('Turning the ' + outlet.lights[light].name + ' off');
        }
    }
    var child = sudo(['/var/www/rfoutlet/codesend', code.toString()], options);
    child.stdout.on('data', function (data) {
        var child2 = sudo(['/var/www/rfoutlet/codesend', code.toString()], options);
        child2.stdout.on('data', function (data) {
            var child3 = sudo(['/var/www/rfoutlet/codesend', code.toString()], options);
            child3.stdout.on('data', function (data) {
                io.emit('light status', outlet.lights);
            });
        });
    });
}

function checkSensor() {
    if(outlet.motionOn == true) {
        console.log('Any motion in the past 5 minutes?');
        gpio.read(19, function (err, value) {
            if (value == false && outlet.lights[1].status == true) {
                if (new Date().getTime() - outlet.motion.getTime() > 300000) {
                    sendCode(1, false);
                    console.log('No motion.');
                } else {
                    console.log('Yes. Checking again in a minute.');
                }
            }
        });
    }
}

function findAndSend(name, on) {
    if(name == 'all') {
        for(var i = 0; i < outlet.lights.length; i++) {
            sendCode(outlet.lights[i], on);
        }
    }
    for(var i = 0; i < outlet.lights.length; i++) {
        if(outlet.lights[i].name.toLowerCase() == name.toLowerCase()) {
            sendCode(i, on);
            console.log(outlet.lights[i]);
        }
    }

}
