const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path as necessary
const router = express.Router();
const auth = require('../middleware/auth');

// Route for user registration 
router.post('/register', async (req, res) => {
  try {
    // Check for required fields
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).send('All required fields must be filled');
    }
    // Check if the email or username already exists
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (emailExists) {
      return res.status(400).send('Email already exists, please login instead.');
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      email,
      password: hashedPassword,
      username
    });

    // Save the user
    const newUser = await user.save();
    res.status(201).json({ userId: newUser._id, username: newUser.username, email: newUser.email });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route to get all users (For internal use - secure accordingly)
router.get('/internal/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Route for user login
router.post('/login', async (req, res) => {
  try {
    // Determine if the user is logging in with an email or a username
    const loginField = req.body.login.includes('@') ? { email: req.body.login } : { username: req.body.login };

    // Find the user by email or username
    const user = await User.findOne(loginField);
    if (!user) {
      console.log('User not found');
      return res.status(400).send('Invalid login credentials.');
    }

    // Check if the password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(400).send('Invalid login credentials.');
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token to the client
    res.send({ token: token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Something went wrong.');
  }
});

// Route to update user information
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'email', 'password', 'currentPassword'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation || !req.body.currentPassword) {
    return res.status(400).send({ error: 'Invalid updates or missing current password!' });
  }

  try {
    const user = req.user;
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).send({ error: 'Current password is incorrect.' });
    }

    // Exclude 'currentPassword' from updates
    const updatesToApply = updates.filter(update => update !== 'currentPassword');

    for (let update of updatesToApply) {
      user[update] = req.body[update];
      if (update === 'password') {
        user.password = await bcrypt.hash(req.body.password, 10);
      }
    }

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Route to delete user account
router.delete('/me', auth, async (req, res) => {
  if (!req.body.currentPassword) {
    return res.status(400).send({ error: 'Current password is required.' });
  }

  try {
    const user = req.user;
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).send({ error: 'Current password is incorrect.' });
    }

    // Proceed with deletion since the password matches
    const deletionResult = await User.deleteOne({ _id: user._id });

    if (deletionResult.deletedCount === 0) {
      // No user was deleted, handle accordingly
      return res.status(404).send({ message: 'User not found.' });
    }

    res.send({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).send(error);
  }
});



module.exports = router;
