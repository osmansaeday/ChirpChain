const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    imagePath: String,

    // Add any other fields like images, likes, comments etc. as needed
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
