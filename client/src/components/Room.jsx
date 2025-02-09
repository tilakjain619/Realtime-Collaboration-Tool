import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { format } from 'date-fns'

const socket = io("http://localhost:5000");

function Room() {
    const location = useLocation();
    const { name, roomId } = location.state || {};
    const [code, setCode] = useState("// Write JavaScript here...");
    const [output, setOutput] = useState("");
    const [users, setUsers] = useState([]);
    const [typingUser, setTypingUser] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");


    useEffect(() => {
        if (!name || !roomId) return;

        socket.emit("join-room", { name, roomId });

        socket.on("update-users", ({ users = [], createdAt, updatedAt }) => {
            setUsers(users || []); // Ensure users is always an array
            setCreatedAt(createdAt);
            setUpdatedAt(updatedAt);
        });

        socket.on("user-typing", (userName) => {
            setTypingUser(userName);
            setTimeout(() => setTypingUser(""), 1000); // Clear typing after 1 second
        });

        socket.on("code-update", (newCode) => {
            setCode(newCode);
        });
        socket.on("receive-message", (chatMessage) => {
            setMessages((prev) => [...prev, chatMessage]);
        });

        return () => {
            socket.off("update-users");
            socket.off("user-typing");
            socket.off("code-update");
            socket.off("receive-message");
        };
    }, [name, roomId]);

    const handleCodeChange = (value) => {
        setCode(value);
        socket.emit("code-change", { roomId, code: value });
        socket.emit("typing", { roomId, name }); // Emit typing event
    };

    const sendMessage = () => {
        if (message.trim() !== "") {
            socket.emit("send-message", { roomId, name, message });
            setMessage(""); // Clear input after sending
        }
    };

    // Run JavaScript code
    const executeCode = () => {
        let outputText = "";
        const originalConsoleLog = console.log;

        console.log = (...args) => {
            outputText += args.join(" ") + "\n"; // Capture console.log messages
        };

        try {
            const result = new Function(code)();
            if (result !== undefined) {
                outputText += result;
            }
        } catch (error) {
            outputText += error.toString();
        }

        console.log = originalConsoleLog; // Restore console.log
        setOutput(outputText);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center md:flex-row md:gap-4 md:items-baseline">
            <div className="w-full max-w-4xl md:w-2/10">
                {/* Room Info & Active Users */}
                <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg shadow-lg max-h-[250px] overflow-y-hidden">
                    <h2 className="text-xl font-bold text-green-400">Room: {roomId}</h2>
                    <p className="text-sm mt-1 text-gray-400">
                        Created at: {createdAt ? format(new Date(createdAt), "d MMM hh:mm a") : "Loading..."}
                    </p>
                    <p className="text-sm mt-0.5 text-gray-400">
                        Last Modified: {updatedAt ? format(new Date(updatedAt), "d MMM hh:mm a") : "Loading..."}
                    </p>

                    <h4 className="text-sm text-zinc-300 mt-2">Active Users:</h4>
                    <ul className="flex flex-wrap gap-2 mt-2">
                        {users.map((user, index) => (
                            <li key={index} className="bg-gray-700 px-3 py-1 rounded-md">
                                {user}
                            </li>
                        ))}
                    </ul>

                    <p className="text-sm text-gray-400 mt-2 min-h-5">{typingUser && (typingUser + " is typing...")}</p>
                </div>
                {/* Chat Section */}
                <div className="w-full  max-w-4xl mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold">Chat</h3>
                    <div className="mt-2 bg-gray-900 p-3 rounded-md h-40 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <p key={index} className="text-sm mt-0.5">
                                <span className="text-green-400 font-semibold">{msg.name}: </span>
                                {msg.message}
                            </p>
                        ))}
                    </div>
                    <div className="mt-2 flex">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded-l-md outline-none"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="px-4 bg-green-700 hover:bg-green-600 cursor-pointer text-white font-semibold rounded-r-md"
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
            <div className="w-full md:w-8/10">

                {/* Code Editor */}
                <div className="w-full mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
                    <div className="flex mb-2 justify-between items-center">
                        <h3 className="text-lg font-semibold">Editor</h3>
                        <div>
                            {/* Run Code Button */}
                            <button
                                onClick={executeCode}
                                className="px-4 py-1 cursor-pointer bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md shadow-md"
                            >
                                Run Code
                            </button>
                        </div>
                    </div>
                    <CodeMirror
                        value={code}
                        height="400px"
                        className="border border-gray-700 rounded-lg"
                        theme={oneDark}
                        extensions={[javascript()]}
                        onChange={(value) => handleCodeChange(value)}
                    />
                </div>

                {/* Output Section */}
                <div className="w-full mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold">Output</h3>
                    <pre className="mt-2 bg-black text-green-400 p-3 rounded-md">
                        {output || "No Output"}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default Room;
