import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { io } from "socket.io-client";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosAttach } from "react-icons/io";
import { FaArrowRightLong, FaRegFaceSmile } from "react-icons/fa6";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef();
  const socketRef = useRef();
  const fileInputRef = useRef(null)

  // Initialize Socket.IO (once)
  useEffect(() => {
    if (socketRef.current) return;
    socketRef.current = io("http://localhost:3000", { withCredentials: true });
    socketRef.current.emit("join", currentUser.id || currentUser._id);
    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    // Real-time seen updates
    socketRef.current.on("messages_read", ({ byUserId, senderId }) => {
      // When the other user reads messages in this chat
      if (selectedUser && byUserId === selectedUser._id) {
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === prev.length - 1 && m.senderId === (currentUser.id || currentUser._id)
              ? { ...m, isRead: true }
              : m
          )
        );
      }
    });
  }, [currentUser.id, currentUser._id, selectedUser]);

  // Re-bind typing listener on selectedUser change
  useEffect(() => {
    if (!socketRef.current) return;
    const handleTyping = ({ senderId }) => {
      if (selectedUser && senderId === selectedUser._id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };
    socketRef.current.on("typing", handleTyping);
    return () => {
      socketRef.current?.off("typing", handleTyping);
    };
  }, [selectedUser]);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Emit real-time message
    socketRef.current.emit("send_message", {
      senderId: currentUser.id || currentUser._id,
      receiverId: selectedUser._id,
      message: input.trim(),
    });
    try {
      // Persist via REST API
      const res = await API.post("/messages", {
        senderId: currentUser.id || currentUser._id,
        receiverId: selectedUser._id,
        message: input.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // to send send text after clicking enter
  const handleKeyDown = (e) =>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      handleSend();
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !selectedUser) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (input && input.trim()) {
        formData.append("message", input.trim());
      }
      formData.append("receiverId", selectedUser._id);

      const res = await API.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [...prev, res.data]);
      setInput("");
      e.target.value = "";
    } catch (err) {
      console.error("Error uploading attachment:", err);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  //for typing... functionality
  const handleInputChange =  (e) =>{
    setInput(e.target.value);
    socketRef.current.emit("typing",{
      senderId:currentUser.id || currentUser._id,
      receiverId: selectedUser._id
    })
  }
  

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="text-center max-w-md">
          <div className="inline-block p-4 rounded-full bg-gray-200 mb-4 animate-pulse">
            <IoChatbubbleEllipsesOutline className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Select a conversation</h2>
          <p className="text-gray-500">Choose a user from your contacts to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser.profilePic || "/default-avatar.png"}
            alt={selectedUser.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">{selectedUser.username}</h2>
          {/* 6️⃣ Show typing indicator */}
          {typing ? (
            <p className="text-xs text-gray-500 italic">Typing...</p>
          ):(
            <p className="text-xs text-green-500">Online now</p>
          )
          }
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
  {messages.map((msg, idx) => {
    const isSender = msg.senderId === (currentUser.id || currentUser._id);
    const isLast = idx === messages.length - 1;

    return (
      <div
        key={idx}
        className={`flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-xs p-3 rounded-2xl transition-all duration-300 transform ${
            isSender
              ? "bg-blue-500 text-white rounded-tr-none animate-float-in"
              : "bg-white text-gray-700 rounded-tl-none animate-float-in-left shadow-sm"
          }`}
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          {msg.attachmentUrl ? (
            msg.attachmentType && msg.attachmentType.startsWith("image/") ? (
              <img src={msg.attachmentUrl} alt={msg.attachmentName || "image"} className="max-w-full rounded-lg mb-2" />
            ) : (
              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`${isSender ? "text-blue-100" : "text-blue-600"} underline text-sm`}>
                {msg.attachmentName || "Download attachment"}
              </a>
            )
          ) : null}
          {msg.message && <p className="text-sm">{msg.message}</p>}
          <div
            className={`text-xs mt-1 ${
              isSender ? "text-blue-100" : "text-gray-400"
            } text-right`}
          >
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isSender && isLast && msg.isRead && (
              <span className="ml-2 text-green-300">✓ Seen</span>
            )}
          </div>
        </div>
      </div>
    );
  })}
  <div ref={scrollRef} />
</div>  

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full p-3 pl-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,video/mp4"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors" onClick={triggerFileSelect}>
                <IoIosAttach className="h-5 w-5" />
              </button>
              <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                <FaRegFaceSmile className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            onKeyDown={handleKeyDown}
            disabled={!input.trim()}
            className={`p-3 rounded-full transition-all duration-300 transform hover:scale-105 ${
              input.trim()
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaArrowRightLong className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}