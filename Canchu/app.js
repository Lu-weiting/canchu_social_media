const express = require('express');
const app = express();
require('dotenv').config();
const cors=require('cors');
// const rateLimiterMiddleware = require('./rateLimiter');
const userRouter = require('./Router/user_Router');
const friendshipRouter = require('./Router/friendship_Router');
const eventRouter = require('./Router/event_Router');
const postRouter = require('./Router/post_Router');
const ssl = require('./Router/SSL');
const groupRouter = require('./Router/group_Router');
const chatRouter = require('./Router/chat_Router');
//const path = require('path');
app.use(cors());
// app.use(express.static(__dirname+'/static'));
app.use('/static', express.static('/canchu/static'));
// app.use(rateLimiterMiddleware);


app.use(express.json());
app.use('/api/1.0/users',userRouter);
app.use(ssl);
app.use('/api/1.0/posts',postRouter);
app.use('/api/1.0/events',eventRouter);
app.use('/api/1.0/friends',friendshipRouter);
app.use('/api/1.0/groups',groupRouter);
app.use('/api/1.0/chat',chatRouter);

app.get('/', (req, res) => {
    res.send('Hello, My Server!');
});
module.exports = app;
