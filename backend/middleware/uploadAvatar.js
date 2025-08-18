// middleware/uploadAvatar.js
const multer = require("multer");
const path = require("path");

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("uploads", "avatars"));
  },
  filename: (req, file, cb) => {
    // unique filename: userId + timestamp + ext
    const userId = (req.user && (req.user.id || req.user._id)) || "anon";
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// file filter (only images)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypeOk = allowed.test(file.mimetype);
  const extOk = allowed.test(ext);
  if (mimetypeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg and png images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = upload;
