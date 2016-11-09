var socket, port, auth = false;
chrome.storage.local.get('jwt', function (result) {
    console.log("storage attempt: ", result.jwt);
    if (typeof result.jwt !== "undefined") {
       connect(result.jwt);

    }
});
function connect(token) {
    socket = io.connect("http://tomfitz.me:9999");

    socket.on('connect', function() {
        socket.emit('authenticate', {token: token});
        console.log('authenticating..', token);
        socket.on('authenticated', function () {
            console.log('success');
            auth = true;
            send('connected');
        });
        socket.on('unauthorized', function (msg) {
            send('unauthorized', msg);

        });
        socket.on('light status', function(msg) {
            send('light status', msg);

        });
        socket.on('motion set', function(msg) {
            send('motion set', msg);
        });
    });
}


chrome.runtime.onConnect.addListener(function(prt){
    prt.onDisconnect.addListener(function() {
        port = undefined;
    });
    port = prt;
    if(auth)
        send('connected');
    prt.onMessage.addListener(listener);
});

function listener(msg){
        console.log(msg.event + ">>" + msg.value);
        var event = msg.event;
        var value = msg.value;
        switch(event) {
            case "connect":
                connect(value);
                break;
            case "light status":
                socket.emit('light status');
                break;
            case "light change":
                socket.emit('light change', value);

        }
    }
function send(event,value) {
    if (typeof port !== "undefined" && typeof port.postMessage !== "undefined") {
        port.postMessage({event:event, value:value});
    }
}
