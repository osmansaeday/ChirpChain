const mongoose = require('mongoose');
const express = require('express');
const userRoutes = require('./routes/users');
const conversationsRoutes = require('./routes/conversations');
const postRoutes = require('./routes/posts');
require('dotenv').config();
// console.log(process.env.JWT_SECRET); // This should print your secret key
// const auth = require('../middleware/auth');



const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://ozmame2:BJQa28cojvin8ubm@chirpchain.dhwpbhi.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB:', err));

app.use(express.json()); // Middleware to parse JSON bodies
app.use('/api/conversations', conversationsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
