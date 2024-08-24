const http = require('http');
const socketIO = require('socket.io');
const io = require("socket.io-client");
const { spawn } = require('child_process');
const { FeedbackTransformer } = require('./feedback');

const server = http.createServer();
const ioServer = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let katagoProcess;
let serverSocket = null;

ioServer.on('connection', socket => {
  console.log('Client connected');
  socket.emit("connected");

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Stop Katago process when the last client disconnects
    if (ioServer.engine.clientsCount === 0) {
      // Kill the Katago process
      if (katagoProcess) {
        console.log("Killing KataGo");
        katagoProcess.kill();
        katagoProcess = null;
      }
    }
  });

  socket.on('connectToServer', (data) => {
    const { user, url } = data;

    if (serverSocket) {
      console.log(`Server Socket already exists. Disconnecting the old one.`);
      serverSocket.disconnect();
    }

    // Establish a new socket connection
    const newSocket = io(url);

    serverSocket = newSocket;
    // console.log(serverSocket);
    newSocket.on('connected', () => {
      console.log(`Kata socket ${user} connected to ${url}`);
    });

    newSocket.on('disconnect', () => {
      console.log(`Kata server socket ${user} disconnected`);
      serverSocket = null;
    });

    // Handle messages from the secondary socket
    newSocket.on('registerOK', () => {
      socket.emit('serverOK');
    });

    newSocket.on('initKatago', () => {
      if (!katagoProcess) {
        katagoProcess = spawn('katago/katago.exe', ['analysis', '-config', 'katago/analysis_example.cfg', '-model', 'katago/models/kata1-b18c384nbt.bin.gz']);
        feedbackTransformer = new FeedbackTransformer();

        let buffer = '';
    
        katagoProcess.stdout.on('data', data => {
          const katagoData = data.toString();
          buffer += katagoData;
          // console.log(`Katago response: ${data}`);

          let completedResponses = buffer.split("\n");
          buffer = completedResponses.pop();

          completedResponses.forEach(response => {
            const moveData = feedbackTransformer.katago2moves(response);
            const feedback = feedbackTransformer.calculateFeedback(moveData);
            console.log(`feedback: ${JSON.stringify(feedback)}`);
            newSocket.emit('katagoResponse', feedback);
          });          
        });
      
        katagoProcess.stderr.on('data', err => {
          console.error(`Katago error: ${err}`);
        });
      
        katagoProcess.on('close', code => {
          console.log(`Katago process exited with code ${code}`);
        });
      }
    });

    newSocket.on('queryKatago', (query) => {
      if (katagoProcess) {
        katagoProcess.stdin.write(`${query}\n`);
        console.log(`passing query to katago: ${query}`);
      } else {
        newSocket.emit('katagoNotRunning');
      }
    });

    console.log(`Finished setting up server socket`);

    newSocket.emit('registerKata', { user: user });
    console.log(`sent register message to server`);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
