var gpio = require('rpi-gpio');
var sudo = require('sudo');
var options = { cachePassword: true, prompt: 'Password:', spawnOptions: {} };
var fs = require('fs');
var md5 = require('md5');
var jwt = require('jsonwebtoken');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var outlet = [];
app.use(cookieParser());
app.use(bodyParser());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static('public'));


init();

gpio.on('change', function (channel, value) {
    if (channel == 19) {
        console.log('Motion detected.');
        outlet.motion = new Date();
        if (outlet.lights[1].status == false && value == true)
            if(outlet.motionOn == true && (outlet.motion.getHours() > 15 || outlet.motion.getHours() < 1))
            sendCode(1, true);

    }
});

io.on('connection', connection);

function init() {
    server.listen(80, function (e) {
        console.log('Server started. Awaiting Input:');
        setInterval(checkSensor, 60000);
    });
    gpio.setMode(gpio.MODE_BCM);
    gpio.setup(19, gpio.DIR_IN, gpio.EDGE_BOTH);


    outlet.motion = new Date();
    outlet.motionOn = true;

    outlet.lights = [
        {'id': 0, 'name': 'Bedroom', 'status': false, 'code': [333116, 333107]},
        {'id': 1, 'name': 'Living Room', 'status': false, 'code': [333260, 333251]},
        {'id': 2, 'name': 'Fan', 'status': false, 'code': [333580, 333571]},
        {'id': 3, 'name': 'Office', 'status': false, 'code': [341260, 341251]}
    ];

    app.get(['/','/login'], function (req, res) {
        if(typeof req.cookies.jwt === "undefined")
            res.sendFile(__dirname + '/login.html');
        else
            res.redirect("/lights");
    });
    app.post('/login', function (req, res) {
        var valid = false;
        var login = { name: req.body.username, pass: req.body.password};
        var users = JSON.parse(fs.readFileSync('users.json', 'utf8')).users;
        for(var i = 0; i < users.length; i++ ) {
            if (login.name == users[i].name && md5(login.pass) == users[i].pass) {
                valid = true;
                res.cookie('jwt', jwt.sign(login, 'supersecretcode'));
                res.redirect("/lights");
            }
        }
        if (!valid)
            res.redirect("/login");
    });
    app.get('/lights', function(req, res) {
        if(req.cookies.jwt != undefined && jwt.verify(req.cookies.jwt, 'supersecretcode', {ignoreExpiration: true})) {
            res.sendFile(__dirname + '/index.html');
        } else {
            res.redirect("/login");
        }
    });
    app.post('/lights/:on/:lightName', function(req,res) {
        if(jwt.verify(req.body.token, 'supersecretcode', {ignoreExpiration: true})) {
            var name = req.params.lightName.replace('the','').trim();
            var on = (req.params.on == "on");
            var valid = findAndSend(name, on);
            if (valid)
                res.sendStatus(200);
            else
                res.sendStatus(400);
	    console.log("POST<'"+name+"'>", on);
        } else {
            res.sendStatus(403);
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
        if (on) {
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
                    console.log('No motion. Lights out.');
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
        return true;
    }
    for(var i = 0; i < outlet.lights.length; i++) {
        if(outlet.lights[i].name.toLowerCase() == name.toLowerCase()) {
            sendCode(i, on);
            console.log(outlet.lights[i]);
            return true;
        }
    }

    return false;

}
