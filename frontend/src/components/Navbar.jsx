import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate()

  return (
    <div className="fixed w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between px-4 md:px-8 shadow-lg">
      {/* Left: User Profile */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/profile")}>
        <div className="relative">
          <img
            src={user?.profilePic || "/default-avatar.jpg"}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-md"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{user?.username}</h2>
          <p className="text-xs text-green-300 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* Right: Logout Button */}
      <button
        onClick={logout}
        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2 rounded-full text-sm transition-all duration-300 flex items-center gap-2 group border border-white/20"
      >
        Logout
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
};

export default Navbar;