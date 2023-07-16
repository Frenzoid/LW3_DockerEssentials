// @author: Frenzoid
// ---------------------------------------------
// This is a simple script that reads data from
// ./config/storage.json every second.

const fs = require('fs');

// Return a promise that resolves after "ms" Milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read data from storage.json every second.
async function readData() {
  while (true) {
    const { name } = JSON.parse(fs.readFileSync('./config/storage.json', 'utf8'));
    console.log("Hello " + name + "!");

    await sleep(1000);
  }
}

readData();