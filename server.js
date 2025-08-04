'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const myDB = require('./connection');
const auth = require('./auth');
const path = require('path');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
fccTesting(app);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db('exercise-tracker').collection('users');

  auth(app, myDataBase);

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Hello',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      console.log(`User ${req.user.username} logged in.`);
      res.redirect('/profile');
    }
  );

  app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    res.render('profile', { username: req.user.username });
  });

  app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port ' + (process.env.PORT || 3000));
  });
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database'
    });
  });
});
