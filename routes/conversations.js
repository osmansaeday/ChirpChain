const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Route to start or get a conversation
router.post('/', auth, async (req, res) => {
    try {
        const { participant } = req.body;
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, participant] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user._id, participant]
            });
            await conversation.save();
        }

        res.status(201).send(conversation);
    } catch (error) {
        res.status(500).send(error);
    }
});

// In routes/conversations.js
router.get('/', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.user._id] }
        }).populate('participants', 'username'); // Adjust based on your needs

        res.send(conversations);
    } catch (error) {
        res.status(500).send({ message: "Error fetching conversations", error: error.toString() });
    }
});


// Route to send a message with participant check
router.post('/messages', auth, async (req, res) => {
    try {
        const { conversationId, text } = req.body;

        // First, find the conversation to check if the current user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).send({ message: "Conversation not found." });
        }

        // Check if the current user is one of the participants
        if (!conversation.participants.some(participant => participant.equals(req.user._id))) {
            return res.status(403).send({ message: "Unauthorized: You are not a participant in this conversation." });
        }

        // Proceed to create and save the message since the user is authorized
        const message = new Message({
            conversation: conversationId,
            sender: req.user._id,
            text
        });

        await message.save();
        res.status(201).send(message);
    } catch (error) {
        res.status(500).send(error);
    }
});


// Route to get messages from a conversation, with participant check
router.get('/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation.findById(conversationId);

        // Check if the current user is a participant in the conversation
        if (!conversation.participants.some(participant => participant.equals(req.user._id))) {
            return res.status(403).send({ message: "Unauthorized: You are not a participant in this conversation." });
        }

        const messages = await Message.find({ conversation: conversationId })
                                      .populate('sender', 'username')
                                      .sort({ createdAt: 1 }); // Sort by creation time for chronological order

        res.status(200).send(messages);
    } catch (error) {
        res.status(500).send({ message: "Error fetching messages", error: error.toString() });
    }
});



module.exports = router;
