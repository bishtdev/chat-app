// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    username: "",
    email: "",
    profilePic: "",
    bio: "",
    status: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get("/users/profile");
        const data = res.data;
        setForm({
          username: data.username || "",
          email: data.email || "",
          profilePic: data.profilePic || "",
          bio: data.bio || "",
          status: data.status || "Available",
          password: "",
          confirmPassword: "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setMessage("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  //for pfp upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    // basic client-side validation
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setMessage("Only JPG/PNG files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("File too large. Max 2MB.");
      return;
    }
  
    setUploading(true);
    setMessage("");
  
    try {
      const formData = new FormData();
      formData.append("avatar", file);
  
      // Use your existing API instance (it adds Authorization header)
      const res = await API.post("/users/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // server returns { profilePic }
      const { profilePic } = res.data;
      setForm((f) => ({ ...f, profilePic }));
      // also update auth context to reflect new avatar immediately
      updateUser({ profilePic });
      setMessage("Uploaded successfully.");
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (form.password && form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const payload = {
      username: form.username,
      email: form.email,
      bio: form.bio,
      status: form.status,
      profilePic: form.profilePic,
    };
    if (form.password) payload.password = form.password;

    try {
      setSaving(true);
      const res = await API.put("/users/profile", payload);
      // res.data should be updated user (without password)
      setMessage("Profile updated successfully.");
      // update auth context so navbar/sidebar reflect changes
      updateUser({
        username: res.data.username,
        email: res.data.email,
        profilePic: res.data.profilePic || "",
        bio: res.data.bio || "",
        status: res.data.status || "Available",
      });
      // clear password fields
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Profile</h1>
          <p className="text-gray-600">Update your personal information and settings</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Picture
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={form.profilePic || "/default-avatar.jpg"}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                {form.profilePic && (
                  <button 
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, profilePic: "" }));
                      updateUser({ profilePic: "" });
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block mb-2 text-sm text-gray-500">
                  Upload a new photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center px-4 py-2 bg-white text-indigo-600 rounded-lg border border-indigo-300 cursor-pointer hover:bg-indigo-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm mt-1">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <div>
                    {uploading && (
                      <div className="flex items-center text-sm text-indigo-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                        Uploading...
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition bg-white"
              >
                <option>Available</option>
                <option>Busy</option>
                <option>Away</option>
                <option>Offline</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Password
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <input
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    username: user?.username || form.username,
                    email: user?.email || form.email,
                    profilePic: user?.profilePic || form.profilePic,
                    bio: user?.bio || form.bio,
                    status: user?.status || form.status,
                    password: "",
                    confirmPassword: "",
                  });
                  setMessage("");
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Changes
              </button>
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
