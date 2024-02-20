const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path as necessary
const router = express.Router();

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
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(400).json({ message: 'Cannot find user' });
    }

    if (await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign({ username: user.username }, process.env.TOKEN_SECRET);
      return res.header('auth-token', token).json({ message: 'Logged in successfully', token: token });
    } else {
      return res.status(400).json({ message: 'Not Allowed' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
