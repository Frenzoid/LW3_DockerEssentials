// @author: Frenzoid
// ---------------------------------------------------------------------
// This is a service that reads from a MQTT topic saves the messages in a database and exposes an API endpoint.

// --- Imports
// Import libraries
// Importing MQTT library used to connect to Streamr broker.
const mqtt = require('mqtt');

// Importing express library used to create the API Rest.
const app = require('express')()

// Importing Sequelize library used to connect and manage the database.
const { Sequelize, DataTypes } = require("sequelize");



// --- Environment / Config variables.
// Address of the MQTT broker, we know the address will be localhost because we are running the container in our computer locally.
const STREAMRADDRESS = process.env.STREAMRADDRESS;

// Port of the MQTT broker, we know it will be 1883 because we have it specified it in the docker compose file.
const STREAMRPORT = Number(process.env.STREAMRPORT);
const STREAMRUSER = process.env.STREAMRUSER;
const STREAMRAPIKEY = process.env.STREAMRAPIKEY;
const STREAMRTOPIC = process.env.STREAMRTOPIC;

// Database credentials and table name, we know the database will have these credentials because we will specify them in the docker compose file ( SPOILERS :D ).
const DBADDRESS = process.env.DBADDRESS;
const DBPORT = Number(process.env.DBPORT);
const DBNAME = process.env.DBNAME;
const DBUSER = process.env.DBUSER;
const DBPASSWORD = process.env.DBPASSWORD;



// --- Main
// Connect to the MQTT Streamr broker
// The connection string syntax is as follows: protocol://username:address@host:port
// With Streamr nodes you can use whatever username you want as long as API key is the right one.
const client = mqtt.connect(`mqtt://${STREAMRUSER}:${STREAMRAPIKEY}@${STREAMRADDRESS}:${STREAMRPORT}`);
console.log("Connecting to MQTT broker...");

// Create a database client with the address and credentials.
// The connection string syntax is as follows: protocol://username:address@host:port/database
// The username, password and dbname must be the same as the ones you used to create the database ( values used in env variables on the dockerfile postgre service ).
// We also disable logging because it's not necessary, unless we want to see the SQL queries being executed in our console output :)
const sequelize = new Sequelize(`postgres://${DBUSER}:${DBPASSWORD}@${DBADDRESS}:${DBPORT}/${DBNAME}`, { logging: false });
console.log("Connecting to PostgreSQL database...");



// --- Database Model
// Here we define the model for a table in the database, this table will hold the messages received from the topic.

const Messages = sequelize.define("Messages", {

  // The sender of the message
  sender: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // The text of the message
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // The date of the message
  date: {
    type: DataTypes.STRING,
    allowNull: false
  },
});



// --- Event handlers
// Once we successfully connected to the MQTT broker...
client.on('connect', async () => {

  // Subscribe to the topic
  console.log("Connected to MQTT broker!")
  client.subscribe(STREAMRTOPIC);

  // Database Logic...
  try {
    // Authenticate to the database.
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL database server!");

    // And then sync the Messages table, this will create the Messages table if it doesn't already exist in the database.
    await Messages.sync();
    console.log("Created Messages table in database:", DBNAME);

    // Start the API Rest listening on port 3000.
    app.listen(3000, () => {
      console.log("API listening on port 3000");
    });

  } catch (error) {
    throw error;
  }
});

// When the client receives a message from the topic...
client.on('message', async (topic, payload) => {

  // T// The payload ( message received from the topic ) will be a JSON string, so we need to parse it to an object, and then get the message object from it.
  const { message } = JSON.parse(payload);

  // Create a new message in the database. We can directly pass the "message" object since its fields ( sender, text, date ) have the same variable names as the table columns defined in the Model. Returns the object stored in the database.
  const dbmessage = await Messages.create(message);

  // The line above is equivalent to the line below.
  // const dbmessage = await Messages.create({sender: message.sender, text: message.text, date: message.date }); 

  // Console log the message now stored in the db.
  console.log(dbmessage.dataValues);
});

// Create API Endpoint with a paramter for the sender of the messages.
// This means that if you search http://localhost:3000/messages/frenzoid you will get all the messages sent by "frenzoid".
app.get('/messages/:sender', async (req, res) => {

  // Get the sender from the request parameters.
  const { sender } = req.params;

  // Find all the messages in the database that have the same sender as the one specified in the request.
  const messages = await Messages.findAll({ where: { sender } });

  // Send the messages as a response.
  res.json(messages);
});