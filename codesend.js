var gpio = require('rpi-gpio');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

gpio.setMode(gpio.MODE_BCM);
gpio.setup(19,gpio.DIR_IN,gpio.EDGE_BOTH);
server.listen(80,function(e){
// motion sensor
setInterval(checkSensor,60000);
var motion;
});
gpio.on('change',function(channel,value) {
	if(channel == 19) {
		console.log('Motion detected.');
		if(lights[1].status == false && value == true && new Date().getHours() > 17) {
			// Turn on light only if the light is off, the motion sensor was tripped, and it's past 5pm
			
			motion = new Date();
			sendCode(1);				
		}
	}
});

function checkSensor() {
	console.log('Any motion in the past 5 minutes?');
	gpio.read(19,function(err,value) {
		if(value == false && lights[1].status == true && (new Date().getTime() - motion.getTime() > 300000)) { 
			sendCode(1);
			console.log('No motion.');	
		}
		else {
			console.log('Yes. Checking again in a minute.');
		}
	});


}


app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/outlet.html');
});

var sudo = require('sudo');
var options = {
    cachePassword: true,
    prompt: 'Password, yo? ',
    spawnOptions: { /* other options for spawn */ }
};
var lights = [
 { 'id': 0, 'name': 'Bedroom Lights', 'status': true, 'code': [333116,333107] },   
 { 'id': 1, 'name': 'Living Room Lamp', 'status': false, 'code': [333260,333251] },  
 { 'id': 2, 'name': 'Living Room Fan', 'status': false, 'code': [333580,333571] },    
 { 'id': 3, 'name': 'Office Lamp', 'status': false, 'code': [341260,341251] }     
];


io.on('connection', connection);




function connection(socket) {
    console.log(socket.id);
    io.emit('light status', lights);
    
    
    socket.on('light change', function(n){
        
        if(lights[n].status) {
            console.log('Turning the ' + lights[n].name + ' off');
            sendCode(n);
        }
        else {
            console.log('Turning the ' + lights[n].name + ' on');
            sendCode(n);
        }
        io.emit('light status', lights);
  });
  
  socket.on('disconnect', function(){});
    
    
}


function sendCode(light) {
	var code;
	if(lights[light].status) {
		code = lights[light].code[0]; lights[light].status = false;
	}
	else {
		code = lights[light].code[1]; lights[light].status = true; 
	}
	io.emit('light status', lights); 
    	var child = sudo([ '/var/www/rfoutlet/codesend', code.toString()], options);
            child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
    
    
}
