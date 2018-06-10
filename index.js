// Core pieces
const AWS = require('aws-sdk');
const AWSMqtt = require('aws-mqtt');
const WebSocket = require('ws');


// Wrap everything in an async function to enable use of await
async function setup()
{
  // Set a default AWS region - we'll make this more flexible later if needed
  AWS.config.region = 'us-east-1';

  // Initialize some global options for IOT
  var IOTOptions = {
    WebSocket: WebSocket,
    region: AWS.config.region,
    credentials: AWS.config.credentials,
    clientId: 'raspi-listen-' + (Math.floor((Math.random() * 100000) +1)),
  };

  try {
    //  Get Endpoint
    const IOT = new AWS.Iot()
    const endpoint = await IOT.describeEndpoint().promise();
    IOTOptions.endpoint = endpoint.endpointAddress;
    //console.log(IOTOptions);
    
    // Setup IOT MQTT client
    console.log("Building mqtt client");
    const client = AWSMqtt.connect(IOTOptions);
    client.on('connect', () => { client.subscribe('environment/data'); });
    client.on('message', (topic, message) => {
      data = JSON.parse(message);
      data.tempf = Math.round((data.temp*1.8+32)*100)/100;
      //vdc = data.vadcv * 
      console.log(data.sensor, ": ", data.temp, "c / ", data.tempf, "f");
    });
    client.on('close', () => { console.log("Connection closed, exiting"); });
  } catch (err) {
    console.log(err.message);
  }
}


setup();
