const jwt = require('jsonwebtoken')
const User = require('../models/User.js')

const protect = async (req, res, next) => {
    let token;

    console.log("Incoming headers:", req.headers); // 👈 Check if token is present

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            console.log("Extracted token:", token); // 👈 Confirm token extraction

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token:", decoded); // 👈 See what's inside

            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};


module.exports = {protect}