'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require("cors")
const passport = require('passport');
const myDB = require('./connection');
const routes = require('./routes');
const auth = require('./auth');
const path = require('path');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const logger = require("morgan");

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(logger("dev"));

fccTesting(app); // For FCC testing

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
const myDataBase = await client.db('exercise-tracker').collection('users');

  app.post('/login',
  passport.authenticate('local', { failureRedirect: '/', failureMessage: true }),
  function(req, res) {
    res.redirect('/');
  });

  routes(app, myDataBase);

  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + (process.env.PORT || 3000));
  });
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database',
    });
  });
});
