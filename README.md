# piOutlets
### A web server that allows you to control RF Outlets with a Raspberry Pi

#### Requirements:
* [NodeJS](https://nodejs.org/en/)
* An RF Wireless Transmitter (optional Receiver for getting codes)
* Wireless RF Outlets ([Etekcity](https://www.amazon.com/Etekcity-Wireless-Electrical-Household-Appliances/dp/B00DQELHBS)
* [timleland](https://github.com/timleland/rfoutlet)'s RFsniffer/codesend for sending rf signals
  * use the guide in the repo to get codes
* PIR sensor for motion control
* NPM install the rest of the required modules

#### Installation:
Clone the repository and CD into the directory with your favorite terminal then
``` npm install ```
to install the rest of the node modules

#### Configuration
A variable called outlet.config holds configuration numbers:
```javascript 
outlet.config = {
    port: 80,  // Sets the port of the webserver (80 requires sudo)
    
    motionOnTime:  15,    // Hour in military time where the motion sensor turns on
    motionOffTime: 1,     // Hour in military time where the motion sensor turns off 
    motionLength: 5,      // Minutes of waiting for motion
    motionLightId: 1      // ID of light to turn on/off due to motion

};
```
Inside of the root's app.js, there is a variable called outlet.lights that has a list of all of the lights created by default.
The format is: 
```javascript
    {
        'id': 0,                    // increasing and unique
        'name': 'Bedroom',          // Unique name for outlet
        'code': [333116, 333107],   // RF code [OFF, ON]
        'status': false             // current status of outlet (default to false and let the app do the rest)
    }
```

* code [OFF, ON]
  * These are the codes that you can get from your RF receiver. The Off code is first, the On code is second. 
  * code[0] = off code[1] = on
  
You can create as many light objects as you like, just make sure the properties above are all set. 


#### To Run:
In order to run this at port 80 you will have to run it as admistrator (sudo). You may also change the port to whatever you see fit.
``` node app.js ```

#### Features
* NodeJS backend
* AngularJS frontend
* SocketIO that syncs every client with the correct outlet status
* Motion Control for outlet in the same room as your Pi with on/off times and on/off switch
* POSTable API that allows you to turn on/off specific lights via name.
  * ``` POST to http://localhost/lights/on/bedroom ``` to turn on the bedroom lights
  * requires the JWT token generated from your login to be POSTed (must copy from cookies)
* Unpacked Google Extension (inside public folder)
  * Load the unpacked extension and change the URL of the ```io.connect()```  to the IP/URL of your server
  * Keep your outlet controls with you at any time on any page.
  
  
##### Google Home (optional)
If you have your app open to the public, you can use IFTTT's Google Assistant service and Maker service to create voice commands to connect your server. Just make sure you send a POST with form data and that it passes along the POST data
