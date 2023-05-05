// backend/server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const leaguesRouter = require('./routes/leagues');

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/leagues', leaguesRouter);

console.log('MONGODB_USERNAME:', process.env.MONGODB_USERNAME);
console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD);

mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.3cuzih8.mongodb.net/test`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
