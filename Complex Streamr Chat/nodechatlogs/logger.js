// @author: Frenzoid
// ---------------------------------------------------------------------
// This is a service that reads from a MQTT topic and saves the messages in a database.

// --- Imports
// Import libraries
const mqtt = require('mqtt');
const { Sequelize, DataTypes } = require("sequelize");



// --- Constants
// API Key to connect to the MQTT broker.
const APIKEY = "NmZkOTliZjQ5ZGMxNDVmN2I0NzJmZWE1YzIwY2Q4ZDI";

// Topic to subscribe to, use the same!!.
const TOPIC = "0x7030f4D0dC092449E4868c8DDc9bc00a14C9f561/streamr_chat";

// Database credentials and table name, we know the database will have these credentials because we specified them in the dockerfile.
const DBNAME = "chatdb";
const USER = "root";
const PASSWORD = "root";



// --- Main
// Connect to the MQTT Streamr broker
// The connection string syntax is as follows: protocol://username:address@host:port
// With Streamr nodes you can use whatever username you want as long as API key is the right one.
const client = mqtt.connect(`mqtt://frenzoid:${APIKEY}@localhost:1883`);
console.log("Connecting to MQTT broker...");

// Connect to the database
// The connection string syntax is as follows: protocol://username:address@host:port/database
// The username, password and dbname must be the same as the ones you used to create the database ( values used in env variables on the dockerfile postgre service ).
const sequelize = new Sequelize(`postgres://${USER}:${PASSWORD}@localhost:5432/${DBNAME}`);
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
    type: DataTypes.DATE,
    allowNull: false
  }
});



// --- Event handlers
// Once we successfully connected to the MQTT broker...
client.on('connect', async () => {

  // Subscribe to the topic
  console.log("Connected to MQTT broker")
  client.subscribe(TOPIC);

  try {
    // Authenticate to the database.
    await sequelize.authenticate();

    // And then sync the Messages table, this will create the Messages table if it doesn't already exist in the database.
    await Messages.sync();
    console.log("Synced Messages table in database:", DBNAME);

    console.log("Listening for messages...")

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
  console.log(dbmessage);
});