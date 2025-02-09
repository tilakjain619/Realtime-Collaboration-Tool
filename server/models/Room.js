const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    code: { type: String, default: "// Write JavaScript code here..." },
    users: [{ name: String, id: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    chat: [
        {
            name: String,
            message: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
