// @author: Frenzoid
// ---------------------------------------------------------------------
// This is a service that reads from a MQTT topic and saves the messages in a database.

// --- Imports
// Import libraries
const mqtt = require('mqtt');
const app = require('express')()
const { Sequelize, DataTypes } = require("sequelize");



// --- Configuration variables.
// Address of the MQTT broker, we know it will be localhost because we are running containers in our computer.
const STREAMRADDRESS = "localhost";

// Port of the MQTT broker, we know it will be 1883 because we specified it in the dockerfile.
const STREAMRPORT = 1883;
const STREAMRUSER = "frenzoid";
const STREAMRAPIKEY = "NmZkOTliZjQ5ZGMxNDVmN2I0NzJmZWE1YzIwY2Q4ZDI";
const STREAMRTOPIC = "0x7030f4D0dC092449E4868c8DDc9bc00a14C9f561/streamr_chat";

// Database credentials and table name, we know the database will have these credentials because we specified them in the dockerfile.
const DBADDRESS = "localhost";
const DBPORT = 5432;
const DBNAME = "chatdb";
const DBUSER = "root";
const DBPASSWORD = "root";



// --- Main
// Connect to the MQTT Streamr broker
// The connection string syntax is as follows: protocol://username:address@host:port
// With Streamr nodes you can use whatever username you want as long as API key is the right one.
const client = mqtt.connect(`mqtt://${STREAMRUSER}:${STREAMRAPIKEY}@${STREAMRADDRESS}:${STREAMRPORT}`);
console.log("Connecting to MQTT broker...");

// Connect to the database
// The connection string syntax is as follows: protocol://username:address@host:port/database
// The username, password and dbname must be the same as the ones you used to create the database ( values used in env variables on the dockerfile postgre service ).
// We also disable logging because it's not necessary, unless we want to see the SQL queries being executed :)
const sequelize = new Sequelize(`postgres://${DBUSER}:${DBPASSWORD}@${DBADDRESS}:${DBPORT}/${DBNAME}`, { logging: false });
console.log("Connecting to PostgreSQL database...");



// --- Database Model
// Define the model for a table in the database, this table will hold the messages.

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
  }
});



// --- Event handlers
// Once we successfully connected to the MQTT broker...
client.on('connect', async () => {

  // Subscribe to the topic
  console.log("Connected to MQTT broker!")
  client.subscribe(STREAMRTOPIC);

  try {
    // Authenticate to the database.
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL database server!");

    // And then sync the Messages table, this will create the Messages table if it doesn't already exist in the database.
    await Messages.sync();
    console.log("Synced Messages table in database:", DBNAME);

    // Start listening on port 3000.
    app.listen(3000, () => {
      console.log("API listening on port 3000");
    });

  } catch (error) {
    throw error;
  }
});

// When the client receives a message from the topic...
client.on('message', async (topic, payload) => {

  // The payload is a JSON string, so we need to parse it to an object, and then get the message object from it.
  const { message } = JSON.parse(payload);

  // Create a new message in the database. We can directly pass the "message" object since its fields ( sender, text, date ) are the same as the table columns defined in the Model.
  const dbmessage = await Messages.create(message);
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