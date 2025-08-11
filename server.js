'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');
const { ObjectId } = require('mongodb');
const myDB = require('./connection'); // your DB connection module
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const cors = require('cors');

const app = express();
app.use(cors());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
fccTesting(app);

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = client.db('database').collection('users');

  // Passport LocalStrategy using bcrypt for password check
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) return done(err);
        if (!result) return done(null, false);
        return done(null, user);
      });
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectId(id) }, (err, doc) => {
      done(err, doc);
    });
  });

  // Middleware to protect profile route
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  // Home route with login & registration forms
  app.route('/').get((req, res) => {
    res.render('index', {
      title: '',
      message: 'Please log in or register',
      showLogin: true,
      showRegistration: true
    });
  });

  // Registration route - hashes password before saving
  app.route('/register').post((req, res, next) => {
    const { username, password } = req.body;
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return next(err);
      if (user) return res.redirect('/'); // user exists

      bcrypt.hash(password, 12, (err, hash) => {
        if (err) return next(err);
        myDataBase.insertOne({ username: username, password: hash }, (err, doc) => {
          if (err) return next(err);
          next(null, doc.ops[0]);
        });
      });
    });
  },
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  });

  // Login route
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  // Profile route - protected
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
  });

  // Logout route - Passport 0.6+ style
  app.route('/logout').get((req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  // 404 middleware
  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database'
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
