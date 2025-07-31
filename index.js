const express = require("express");
const { Server } = require("socket.io");
const path = require("path");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log(`✅ Connected to client with id ${socket.id}`);
  let joinedRoom = null;

  socket.on("join_room", (room) => {
    if (room) {
      socket.join(room);
      joinedRoom = room;
      console.log(`🚪 Client ${socket.id} joined room ${room}`);
    } else {
      console.log(`🌐 Client ${socket.id} joined global chat`);
    }
  });

  socket.on("message", ({ room, msg }) => {
    console.log(`💬 Message from ${socket.id} in ${room || "global"}: ${msg}`);

    if (room) {
      // Send only to others in the same room
      socket.to(room).emit("new_message", { msg });
    } else {
      // Send only to users NOT in any room
      // Iterate all sockets and send manually
      for (let [id, s] of io.sockets.sockets) {
        if (s.id !== socket.id && ![...s.rooms].some((r) => r !== s.id)) {
          s.emit("new_message", { msg });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
