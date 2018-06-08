// Core pieces
const AWS = require('aws-sdk');
const AWSMqtt = require('aws-mqtt');
const WebSocket = require('ws');

// Set a default AWS region - we'll make this more flexible later if needed
AWS.config.region = 'us-east-1';

// Initialize some global options
var IOTOptions = {
  WebSocket: WebSocket,
  region: AWS.config.region,
  credentials: AWS.config.credentials,
  clientId: 'raspi-listen-' + (Math.floor((Math.random() * 100000) +1)),
};


// Ask AWS for our IOT MQTT endpoint
IOT = new AWS.Iot()
IOT.describeEndpoint().promise().then(function(data) {
  IOTOptions.endpoint = data.endpointAddress;
})
.catch(function(err) {console.log(err)})
.then(function(data){
  console.log("Building mqtt client");
  const client = AWSMqtt.connect(IOTOptions);
  client.on('connect', () => { client.subscribe('environment/data'); });
  client.on('message', (topic, message) => {
    data = JSON.parse(message);
    data.tempf = Math.round((data.temp*1.8+32)*100)/100;
    console.log(data.sensor, ": ", data.temp, "c / ", data.tempf, "f");
  });
  client.on('close', () => { console.log("Connection closed, exiting"); });
})


