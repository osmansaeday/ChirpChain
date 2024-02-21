const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path as necessary
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    // Check for required fields
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).send('All required fields must be filled');
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

// POST route for user login
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


module.exports = router;
