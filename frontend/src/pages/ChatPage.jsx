// src/pages/ChatPage.jsx
import ChatWindow from "../components/ChatWindow";
import { useAuth } from "../context/AuthContext";
import { useOutletContext } from "react-router-dom";

export default function ChatPage() {
  const { selectedUser, setSelectedUser } = useOutletContext();
  const { user } = useAuth();

  // We return ChatWindow; you could also render other right-column content here.
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatWindow currentUser={user} selectedUser={selectedUser} />
    </div>
  );
}
