// app.js

const socketIOClient = require('socket.io-client');
const { spawn } = require('child_process');
const { FeedbackTransformer } = require('./feedback');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

// Initialize commander for command-line arguments
const program = new Command();

// Define command-line options
program
  .option('-c, --config <path>', 'Path to config file', 'config.json')
  .option('-u, --username <username>', 'Username to use for server connection')
  .option('-s, --server-url <url>', 'Server URL to connect to')
  .option('-v, --visits <visits>', 'max visits')
  .option('-l, --concurrency-limit <limit>', 'concurrency limit')
  .option('-p, --pools <pools>', 'pools');

program.parse(process.argv);

// Function to load configuration from file
function loadConfig(configPath) {
  const absolutePath = path.resolve(configPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Config file not found at ${absolutePath}`);
    process.exit(1);
  }

  let config = {};

  // Determine file extension
  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === '.json') {
    config = require(absolutePath);
  } else if (ext === '.yaml' || ext === '.yml') {
    const yaml = require('js-yaml');
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    config = yaml.load(fileContents);
  } else {
    console.error('Unsupported config file format. Use JSON or YAML.');
    process.exit(1);
  }

  return config;
}

// Load configuration
const config = loadConfig(program.opts().config);

// Override config with command-line arguments if provided
const serverUrl = program.opts().serverUrl || config.serverUrl;
const username = program.opts().username || config.username;
const visits = program.opts().visits || config.visits;
const concurrencyLimit = program.opts().concurrencyLimit || config.concurrencyLimit;
const pools = program.opts().pools || config.pools;

if (!serverUrl || !username) {
  console.error('Server URL and username must be provided either in the config file or via command-line arguments.');
  process.exit(1);
}

console.log(`Using server URL: ${serverUrl}`);
console.log(`Using username: ${username}`);

// Initialize variables
let katagoProcess = null;
let serverSocket = null;
let feedbackTransformer = null;

// Start the KataGo process
function startKatagoProcess() {
  if (!katagoProcess) {
    katagoProcess = spawn('katago/katago.exe', ['analysis', '-config', 'katago/analysis_example.cfg', '-model', 'katago/models/kata1-b18c384nbt.bin.gz']);
    feedbackTransformer = new FeedbackTransformer();

    let buffer = '';

    katagoProcess.stdout.on('data', data => {
      const katagoData = data.toString();
      buffer += katagoData;

      let completedResponses = buffer.split("\n");
      buffer = completedResponses.pop();

      completedResponses.forEach(response => {
        const moveData = feedbackTransformer.katago2moves(response);
        const feedback = feedbackTransformer.calculateFeedback(moveData);
        console.log(`updating feedback: ${JSON.stringify(feedback)}`);
        if (serverSocket) {
          serverSocket.emit('katagoResponse', feedback);
        }
      });
    });

    katagoProcess.stderr.on('data', err => {
      console.error(`Katago error: ${err}`);
    });

    katagoProcess.on('close', code => {
      console.log(`Katago process exited with code ${code}`);
      katagoProcess = null;
    });

    console.log('KataGo process started');
  }
}

// Establish connection to the remote server
function connectToRemoteServer() {
  if (serverSocket) {
    console.log(`Server Socket already exists. Disconnecting the old one.`);
    serverSocket.disconnect();
  }

  // Establish a new socket connection
  const newSocket = socketIOClient(`${serverUrl}/katago`);

  serverSocket = newSocket;

  newSocket.on('connect', () => {
    console.log(`Connected to remote server at ${serverUrl}`);

    // Send registration message
    newSocket.emit('registerKata', { owner: username, pools: pools, visits: visits, concurrencyLimit: concurrencyLimit });
    console.log(`Sent register message to server with: ${username}, ${pools}, ${visits}, ${concurrencyLimit}`);

    // Start KataGo process upon successful connection
    startKatagoProcess();
  });

  newSocket.on('disconnect', () => {
    console.log('Disconnected from remote server');
    serverSocket = null;

    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect to remote server...');
      connectToRemoteServer();
    }, 5000); // Retry after 5 seconds
  });


  // Handle messages from the remote server
  newSocket.on('registerOK', () => {
    console.log('Registration with remote server successful');
  });

  newSocket.on('queryKatago', (query) => {
    if (katagoProcess) {
      katagoProcess.stdin.write(`${query}\n`);
      // console.log(`Passing query to KataGo: ${query}`);
    } else {
      newSocket.emit('katagoNotRunning');
    }
  });

  console.log(`Finished setting up server socket`);
}

// Main execution flow
(function main() {
  connectToRemoteServer();
})();
