import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  try {
    const html = fs.readFileSync('./public/index.html');
    res.end(html);
  } catch (err) {
    res.end("Error loading index.html");
  }
});

const wss = new WebSocketServer({ server });

const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

wss.on('connection', (socket, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get("username");

  socket.username = username;

  broadcast({ type: 'system', text: `${username} joined` });

  socket.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      const { username: msgUser, text } = parsed;

      broadcast({ type: 'chat', username: msgUser, text: text });
    } catch (err) {
      console.error("Invalid message format received:", err);
    }
  });

  socket.on('close', () => {
    broadcast({ type: 'system', text: `${socket.username} left` });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});