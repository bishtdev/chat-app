const Message = require("../models/Message.js");
const User = require("../models/User");
const generateToken = require("../utils/generateToken.js")
const fs = require("fs");
const path = require("path");


// @desc    Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ 
        message: "Please provide username, email and password" 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: userExists.username === username 
          ? "Username already taken" 
          : "Email already registered" 
      });
    }

    // Create user
    const user = await User.create({ 
      username, 
      email, 
      password
    });

    if (user) {
      // Return user data and token
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Server error during registration", 
      error: error.message 
    });
  }
};

// @desc    Login user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        message: "Please provide both username and password" 
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ 
        message: "User not found" 
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid password" 
      });
    }

    // Return user data and token
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during login", 
      error: error.message 
    });
  }
};

// @desc    Get all users (search support)
exports.getAllUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          username: { $regex: req.query.search, $options: "i" },
        }
      : {};

    const users = await User.find(keyword);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


//get chatted users
exports.getChattedUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).select("senderId receiverId");

    const userIdsSet = new Set();
    messages.forEach(msg => {
      if (msg.senderId.toString() !== userId) userIdsSet.add(msg.senderId.toString());
      if (msg.receiverId.toString() !== userId) userIdsSet.add(msg.receiverId.toString());
    });

    const userIds = [...userIdsSet];

    const users = await User.find({ _id: { $in: userIds } }).select("-password");

    res.json(users);
  } catch (err) {
    console.error("Error getting chatted users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc get current user's profile
//GET /api/users/profile
exports.getProfile = async (req, res) =>{
  try {
    const user = await User.findById(req.user.id).select("-password");
    if(!user)return res.status(404).json({message: "user not found"})
      res.json(user)
  } catch (error) {
    console.log('error getting profile', error)
    res.status(500).json({message: 'Internal server error'})
  }
}


//@desc update user's profile
//PUT /api/users/profile

exports.updateProfile = async (req, res) =>{
  try {
    const userId = req.user.id;
    const {username, email, password, profilePic, status, bio} = req.body;

     // Load user document (so pre-save hooks run)
     const user = await User.findById(userId);
     if (!user) return res.status(404).json({ message: "User not found" });
 
     // Check username/email uniqueness if changed
     if (username && username !== user.username) {
       const exists = await User.findOne({ username });
       if (exists) return res.status(400).json({ message: "Username already taken" });
       user.username = username;
     }
 
     if (email && email !== user.email) {
       const exists = await User.findOne({ email });
       if (exists) return res.status(400).json({ message: "Email already registered" });
       user.email = email;
     }
     
     //update other fields
     if (bio !== undefined) user.bio = bio;
     if (status !== undefined) user.status = status;
     if (profilePic !== undefined) user.profilePic = profilePic;

     //if password is provided, hash it
     if(password) user.password = password;

      // Save (triggers pre('save') password hashing)
    const updated = await user.save();

    // Return updated user (omit password)
    const { _id, username: upUser, email: upEmail, profilePic: upPic, bio: upBio, status: upStatus, createdAt } = updated;

    res.json({
      _id,
      username: upUser,
      email: upEmail,
      profilePic: upPic,
      bio: upBio,
      status: upStatus,
      createdAt
    });
  } catch (error) {
    console.log('error updating profile', error)
    res.status(500).json({message: 'Internal server error'})
  }
}

//to upload the avatar 
exports.uploadAvatar = async (req, res) => {
  try {
    // multer has parsed the file, accessible at req.file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user already had a local avatar stored on the server, remove it
    try {
      const prevPic = user.profilePic || "";
      const uploadPrefix = `/uploads/avatars/`;

      if (prevPic && prevPic.includes(uploadPrefix)) {
        // extract filename safely
        const prevFilename = prevPic.substring(prevPic.lastIndexOf(uploadPrefix) + uploadPrefix.length);
        if (prevFilename) {
          const prevFilePath = path.join(__dirname, "..", "uploads", "avatars", prevFilename);

          // Only attempt deletion if the file path is inside the avatars folder
          if (prevFilePath.includes(path.join("uploads", "avatars"))) {
            await fs.promises.unlink(prevFilePath).catch((unlinkErr) => {
              // If file doesn't exist just ignore, otherwise log
              if (unlinkErr.code !== "ENOENT") {
                console.error("Error deleting previous avatar:", unlinkErr);
              }
            });
          }
        }
      }
    } catch (cleanupErr) {
      // Log cleanup error but don't block the new upload
      console.error("Avatar cleanup error (continuing):", cleanupErr);
    }

    // build accessible URL for the uploaded file
    const profilePicUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

    // update user's profilePic
    user.profilePic = profilePicUrl;
    await user.save();

    return res.json({ profilePic: profilePicUrl });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({ message: "Server error uploading avatar" });
  }
};
