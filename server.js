'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const myDB = require('./connection');
const routes = require("./routes.js")
const auth = require('./auth.js');
const path = require('path');
const cors = require("cors");
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const { ObjectID } = require("mongodb");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser")

const app = express();
//const hash = bcrypt.hashSync(req.body.password, 12);

// const corsOptions = {
//   origin: 'https://www.freecodecamp.org', // <-- The origin of the FCC test runner
//   credentials: true // <-- Allow cookies and credentials to be sent
// };

// --> Use the configured CORS options

const allowedOrigins = [
  'https://www.freecodecamp.org',
  'null' // needed for FCC's sandboxed iframe origin
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); 
app.use('/public', express.static(path.join(process.cwd() + '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
  auth(app, myDataBase);      // auth logic moved to auth.js
  routes(app, myDataBase);    // route logic moved to routes.js
});

// 404 middleware (last)
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port ' + (process.env.PORT || 3000));
  });