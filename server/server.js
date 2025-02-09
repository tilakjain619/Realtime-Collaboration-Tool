const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

mongoose.connect('mongodb://localhost:27017/realtime-code-collab')
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

io.on("connection", (socket) => {
    socket.on("join-room", async ({ name, roomId }) => {
        try {
            let room = await Room.findOne({ roomId });
    
            if (!room) {
                // If the room doesn't exist, create it
                room = new Room({ roomId, users: [{ name, id: socket.id }] });
                await room.save();
            } else {
                const userExists = room.users.some((user) => user.name === name);
                
                if (!userExists) {
                    room.users.push({ name, id: socket.id });
                    room.updatedAt = Date.now(); // Update last modified time
                    await room.save();
                } else {
                    room.users = room.users.map((user) =>
                        user.name === name ? { ...user, id: socket.id } : user
                    );
                    await room.save();
                }
            }
    
            socket.join(roomId);
    
            // Send updated user list and timestamps
            io.to(roomId).emit("update-users", {
                users: room.users.map((user) => user.name),
                createdAt: room.createdAt,
                updatedAt: room.updatedAt
            });
    
            // Send latest code to the new user
            socket.emit("code-update", room.code);
    
        } catch (err) {
            console.log(err);
        }
    });
    
    

    socket.on("code-change", async ({ roomId, code }) => {
        try {
            const room = await Room.findOne({ roomId });
            if (room) {
                room.code = code;
                room.updatedAt = Date.now();  // Update the last updated time
                await room.save();

                // Sync the updated code with all users in the room
                socket.to(roomId).emit("code-update", code);
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("typing", ({ roomId, name }) => {
        socket.to(roomId).emit("user-typing", name); // Broadcast typing event
    });

    socket.on("send-message", async ({ roomId, name, message }) => {
        try {
            const room = await Room.findOne({ roomId });
            if (room) {
                const chatMessage = { name, message, timestamp: Date.now() };
                room.chat.push(chatMessage); // Save chat in the database
                await room.save();
    
                // Send message to all users in the room
                io.to(roomId).emit("receive-message", chatMessage);
            }
        } catch (err) {
            console.log(err);
        }
    });
    

    socket.on("disconnect", async () => {
        try {
            // Find all rooms that the user was part of (based on socket.id)
            const roomsList = await Room.find({ "users.id": socket.id });
    
            for (const room of roomsList) {
                // Remove user from the room
                room.users = room.users.filter((user) => user.id !== socket.id);
                room.updatedAt = Date.now();  // Update the room's last updated time
                await room.save();
    
                // Emit the updated list of users in the room
                io.to(room.roomId).emit("update-users", room.users.map(user => user.name));
            }
        } catch (err) {
            console.log(err);
        }
    });
    
});

server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
