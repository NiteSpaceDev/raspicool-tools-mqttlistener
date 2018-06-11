// Core pieces
const AWS = require('aws-sdk');
const AWSMqtt = require('aws-mqtt');
const WebSocket = require('ws');
const { Client } = require('pg');


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

  // PostgreSQL connection parameters - We'll convert this to docker secrets,
  // but it Postgre is not accessible outside the localhost swarm, so it's not
  // a huge deal
  var pgconn = {
    user: 'sensor',
    host: 'timescaledb',
    database: 'raspicool',
    password: 'dataload',
    port: 5432 };

  // Insert query string
  // TODO: Remove 'returning' option so that sensor user can have better permission restriction
  const query = 'INSERT into readings (sid, tempc, pressure, humidity, voltage) values ($1, $2, $3, $4, $5) returning *';

  // Start Async / Await protected stuff
  try {
    //  Get IOT Endpoint
    const IOT = new AWS.Iot()
    const endpoint = await IOT.describeEndpoint().promise();
    IOTOptions.endpoint = endpoint.endpointAddress;
    //console.log(IOTOptions);

    // Connect to Postgres
    const pgclient = new Client(pgconn);
    await pgclient.connect();
    
    // Setup IOT MQTT client
    console.log("Building mqtt client");
    const client = AWSMqtt.connect(IOTOptions);

    // Setup event callbacks
    // Subscribe to data channel when we connect
    client.on('connect', () => { client.subscribe('environment/data'); });
    // Whenever we receive a message, make sure it's on the right channel and insert into DB
    client.on('message', (topic, message) => {
      data = JSON.parse(message);
      data.tempf = Math.round((data.temp*1.8+32)*100)/100;
      console.log(data.sensor, ": ", data.temp, "c / ", data.tempf, "f");
      if (topic == 'environment/data')
      {
        // Send insert to Postgre - Final code will not include dumping inserted record
        pgclient.query(query, [data.sensor, data.temp, data.pressure, data.humidity, data.voltage])
        .then( res => { console.log(res.rows[0]); } )
        .catch(e => console.error(e.stack));
      }

    });
    // Make a note if we lose MQTT connection
    client.on('close', () => { console.log("Connection closed, exiting");  });
  } catch (err) {
    console.log(err.message);
  }
}

// Kick everything off
setup();
