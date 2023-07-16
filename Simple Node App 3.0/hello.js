// @author: Frenzoid
// ---------------------------------------------------------------------
// This is a simple script that reads environment variables each second.

// Read a value from an environment variable.
// In this case USERNAME contains the value of $USERNAME ( or %USERNAME% if you are in Windows ).
const USERNAME = process.env.USERNAME;
const DOG_NAME = process.env.DOG_NAME;

// Return a promise that resolves after "ms" Milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read data from storage.json every second.
async function readData() {
  while (true) {
    // Every second, print the following message.
    console.log("Hello I am", USERNAME, ", and my dog's called ", DOG_NAME, "!");
    await sleep(1000);
  }
}

readData();