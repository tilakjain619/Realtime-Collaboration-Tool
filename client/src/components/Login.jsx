import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        if (name.trim() && roomId.trim()) {
            navigate(`/room/${roomId}`, { state: { name, roomId } });
        } else {
            alert("Please enter a valid name and room ID.");
        }
    };

    return (
        <div className="bg-gray-900 p-2 grid items-center justify-center min-h-screen w-full">
            <div className="bg-gray-800 px-6 grid gap-2 rounded-xl py-5 w-full max-w-3xl shadow-2xl text-gray-200">
                <h2 className="font-bold">Join a Room</h2>
                <small className="text-zinc-400">Create a new room or join an existing one.</small>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border block border-gray-700 px-4 py-2 w-full rounded-lg outline-none"
                />
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="border block border-gray-700 px-4 py-2 w-full rounded-lg outline-none"
                />
                <button onClick={handleJoin} className="bg-green-700 w-fit mx-auto px-4 cursor-pointer hover:bg-green-600 py-2 rounded-lg">
                    Join Room
                </button>
            </div>
        </div>
    );
}

export default Login;
