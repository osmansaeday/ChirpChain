const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth'); // Assuming you've created the auth middleware
const upload = require('../middleware/upload'); // Import Multer configuration



const router = express.Router();

// Route to create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
    if (!req.body.content) {
        return res.status(400).send({ error: 'Content is required.' });
    }

    const post = new Post({
        ...req.body,
        user: req.user._id,
        imagePath: req.file ? req.file.path : '', // Save the path of the uploaded file
    });

    try {
        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({}).populate('user', 'username');
        res.send(posts);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to get the feed 
router.get('/feed', auth, async (req, res) => {
    try {
      const currentUser = req.user;
  
      // Fetch posts from followed users
      const posts = await Post.find({ user: { $in: currentUser.following } })
                              .populate('user', 'username')
                              .sort({ createdAt: -1 }); // Sort by creation time, newest first
  
      res.send(posts);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
// Route to get a single post by ID
router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('user', 'username');
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to get all posts with pagination, filtering, and sorting
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filterOptions = req.query.userId ? { user: req.query.userId } : {};
    const sortOptions = req.query.sortBy ? { [req.query.sortBy]: req.query.sortDirection || 'asc' } : {};

    try {
        const posts = await Post.find(filterOptions)
            .skip(skip)
            .limit(limit)
            .sort(sortOptions)
            .populate('user', 'username'); // Adjust based on your requirements
        res.send(posts);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to update a post by ID
router.patch('/:postId', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['content']; // Extend this array with other fields you'd allow to update
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send();
        }

        // Check if the user updating the post is the owner
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).send({ error: 'You can only edit your own posts.' });
        }

        updates.forEach(update => post[update] = req.body[update]);
        await post.save();

        res.send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to delete a post by ID
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).send({ error: 'Post not found.' });
        }

        // Check if the user requesting the deletion is the owner of the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).send({ error: 'Not authorized to delete this post.' });
        }

        // Delete the post if the user is the owner
        await post.remove();
        res.send({ message: 'Post deleted successfully.' });
    } catch (error) {
        res.status(500).send(error);
    }
});


// Route to toggle like on a post
router.patch('/:postId/like', auth, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user._id; // Assuming your auth middleware sets req.user

    try {
        const post = await Post.findById(postId);
        const likeIndex = post.likes.findIndex(id => id.equals(userId));

        if (likeIndex === -1) {
            // If not liked yet, add like
            post.likes.push(userId);
        } else {
            // If already liked, remove like
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
});

//////////////////////////Comments///////////////////////////////////////////////
// Route to add a comment to a post
router.post('/:postId/comments', auth, async (req, res) => {
    try {
      const comment = new Comment({
        content: req.body.content,
        user: req.user._id,
        post: req.params.postId,
      });
  
      await comment.save();
      res.status(201).send(comment);
    } catch (error) {
      res.status(500).send(error);
    }
  });
// Route to get comments for a specific post
router.get('/:postId/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId }).populate('user', 'username');
        res.send(comments);
    } catch (error) {
        res.status(500).send(error);
    }
});
// Route to update a specific comment
router.patch('/comments/:commentId', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['content']; // Fields allowed to be updated
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).send({ error: 'Comment not found.' });
        }

        // Check if the user updating the comment is the owner
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).send({ error: 'Not authorized to update this comment.' });
        }

        updates.forEach(update => comment[update] = req.body[update]);
        await comment.save();
        res.send(comment);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to delete a specific comment
router.delete('/comments/:commentId', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).send({ error: 'Comment not found.' });
        }

        // Check if the user deleting the comment is the owner
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).send({ error: 'Not authorized to delete this comment.' });
        }

        await comment.remove();
        res.send({ message: 'Comment deleted successfully.' });
    } catch (error) {
        res.status(500).send(error);
    }
});




module.exports = router;
