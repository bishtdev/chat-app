// src/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

const MainLayout = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (left column) */}
        <Sidebar onSelectUser={setSelectedUser} />

        {/* Main content area (right) — child routes render here */}
        <main className="flex-1 flex flex-col min-h-0 md:ml-[25%] mt-16">
          {/* provide selectedUser + setter to child routes */}
          <Outlet context={{ selectedUser, setSelectedUser }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
