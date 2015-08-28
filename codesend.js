var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(process.env.PORT, process.env.IP);


app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/outlet.html');
});

var sudo = require('sudo');
var options = {
    cachePassword: true,
    prompt: 'Password, yo? ',
    spawnOptions: { /* other options for spawn */ }
};

var lights = [
 { 'id': 0, 'name': 'Bedroom Lights', 'status': true, 'code': [341251,341260] },   
 { 'id': 1, 'name': 'Living Room Lamp', 'status': false, 'code': [333251,333260] },  
 { 'id': 2, 'name': 'Living Room Fan', 'status': false, 'code': [341251,341260] },    
 { 'id': 3, 'name': 'Office Lamp', 'status': false, 'code': [341251,341260] }     
];


io.on('connection', connection);




function connection(socket) {
    console.log(socket.id);
    io.emit('light status', lights);
    
    
    socket.on('light change', function(n){
        
        if(lights[n].status) {
            console.log('Turning the ' + lights[n].name + ' off');
            sendCode(lights[n].code[0]);
            lights[n].status = false;
        }
        else {
            console.log('Turning the ' + lights[n].name + ' on');
            sendCode(lights[n].code[1]);
            lights[n].status = true;
        }
        io.emit('light status', lights);
  });
  
  socket.on('disconnect', function(){});
    
    
}


function sendCode(code) {
    var child = sudo([ '/var/www/rfoutlet/codesend', code.toString()], options);
            child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
    
    
}