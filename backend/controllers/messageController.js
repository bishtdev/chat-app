const Message = require('../models/Message');

// @desc    Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    
    // Validate all required fields
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify the sender is the authenticated user
    if (senderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to send message as this user' });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
      timestamp: new Date()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// @desc    Get chat messages between two users
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id; // Get authenticated user's ID
    const otherUserId = req.params.receiverId;

    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }

    // Mark unread messages from otherUser -> currentUser as read
    const updateResult = await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Notify sender in real-time that their messages were seen
    if (updateResult.modifiedCount > 0) {
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      if (io && onlineUsers) {
        const senderSocketId = onlineUsers.get(otherUserId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', {
            byUserId: userId,
            readerId: userId,
            senderId: otherUserId,
          });
        }
      }
    }

    // Get messages where current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};