'use strict';
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const ObjectID = require('mongodb').ObjectID;
const myDB = require('./connection');  // your connection helper
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const path = require('path');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views', 'pug'));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

fccTesting(app); // For FCC testing purposes

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Connect to DB and setup passport and routes inside this callback
myDB(async (client) => {
  const myDataBase = await client.db('exercise-tracker').collection('users');

  // Passport Local Strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(err, doc);
    });
  });

  // Middleware to check if authenticated
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  // Routes

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Welcome',
      message: 'Please login',
      showLogin: true,
      showRegistration: false,
      showSocialAuth: false
    });
  });

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      console.log(`User ${req.user.username} attempted to log in.`);
      res.redirect('/profile');
    }
  );

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});
