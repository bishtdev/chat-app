import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ onSelectUser }) {
  const navigate = useNavigate();
  const [baseUsers, setBaseUsers] = useState([]); // unfiltered chatted users
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [removedUserIds, setRemovedUserIds] = useState(() => {
    try {
      const rawUser = localStorage.getItem("userInfo");
      const parsed = rawUser ? JSON.parse(rawUser) : null;
      const key = parsed ? `removedContacts:${parsed.id || parsed._id}` : null;
      if (!key) return [];
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchResults, setSearchResults] = useState([]);

  const sidebarRef = useRef(null);
  const { user } = useAuth();

  // Load removed list when logged-in user changes
  useEffect(() => {
    if (!user) return;
    try {
      const key = `removedContacts:${user.id || user._id}`;
      const saved = localStorage.getItem(key);
      setRemovedUserIds(saved ? JSON.parse(saved) : []);
    } catch {
      setRemovedUserIds([]);
    }
  }, [user]);

  // Persist removed list
  useEffect(() => {
    if (!user) return;
    const key = `removedContacts:${user.id || user._id}`;
    localStorage.setItem(key, JSON.stringify(removedUserIds));
  }, [removedUserIds, user]);

  // Fetch chatted users (base list)
  useEffect(() => {
    const fetchChattedUsers = async () => {
      try {
        const res = await API.get("/users/chatted"); // use new endpoint
        setBaseUsers(res.data);
      } catch (err) {
        console.error("Failed to load chatted users", err);
      }
    };
  
    if (user) fetchChattedUsers();
  }, [user]);

  // Live search across all users when typing
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!search) {
          setSearchResults([]);
          return;
        }
        const res = await API.get(`/users?search=${encodeURIComponent(search)}`);
        const currentUserId = user?.id || user?._id;
        const list = res.data.filter(u => u._id !== currentUserId);
        if (!cancelled) setSearchResults(list);
      } catch (err) {
        if (!cancelled) setSearchResults([]);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [search, user]);

  const handleRemove = (id) => {
    setRemovedUserIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleUnremoveAndSelect = (u) => {
    setRemovedUserIds(prev => prev.filter(x => x !== u._id));
    // Ensure user appears in base list locally
    setBaseUsers(prev => (prev.some(x => x._id === u._id) ? prev : [u, ...prev]));
    onSelectUser(u);
    setIsOpen(false);
    navigate("/")
  };

  const displayedUsers = baseUsers.filter(u => !removedUserIds.includes(u._id));
  

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-30 md:hidden p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar with Mobile Responsiveness */}
      <div
        ref={sidebarRef}
        className={`fixed md:fixed mt-16 inset-y-0 left-0 z-40 w-4/5 md:w-1/4 bg-white border-r border-gray-200 flex flex-col shadow-lg overflow-hidden transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sidebar Content */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar Header */}
          <div className="h-[81px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white grid grid-cols-1 content-center items-center text-center">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <p className="text-indigo-200 text-sm mt-1">Chat with your connections</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all text-sm md:text-base"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User List */}
          <ul className="flex-1 overflow-y-auto custom-scrollbar pb-4">
            {displayedUsers.map(u => (
              <li
                key={u._id}
                onClick={() => handleUnremoveAndSelect(u)}
                className="px-3 py-2 md:px-4 md:py-3 hover:bg-purple-50 cursor-pointer transition-all duration-300 transform hover:translate-x-1 group"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={u.profilePic || "./default-avatar.png"}
                      alt={u.username}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white shadow group-hover:border-purple-200 transition-all"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full border border-white"></span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-800 truncate text-sm md:text-base group-hover:text-purple-700 transition-colors">
                        {u.username}
                      </h3>
                      <span className="text-xs text-gray-400 hidden md:block">2:30 PM</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs md:text-sm text-gray-500 truncate max-w-[120px] md:max-w-[160px]">
                        Last message preview...
                      </p>
                      {u.unread > 0 && (
                        <span className="bg-purple-500 text-white text-[10px] md:text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center animate-pulse">
                          {u.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(u._id); }}
                    className="ml-2 text-xs text-gray-400 hover:text-red-500"
                    title="Remove from list"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Search results for adding users back or starting new chats */}
          {search && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500">Search results</div>
              <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                {searchResults.length === 0 && (
                  <li className="px-4 py-2 text-sm text-gray-400">No users found</li>
                )}
                {searchResults.map(u => (
                  <li
                    key={`sr-${u._id}`}
                    onClick={() => handleUnremoveAndSelect(u)}
                    className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">{u.username}</span>
                    <span className="text-xs text-purple-600">Add & open</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}