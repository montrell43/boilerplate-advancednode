'use strict';
require('dotenv').config();

const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const LocalStrategy = require('passport-local');

const app = express();

// Middleware
app.use(cors());
fccTesting(app);
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pug templating
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views', 'pug'));

// Session config
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
myDB(async client => {
  const myDataBase = await client.db('exercise-tracker').collection('users');

  // Passport strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username }, (err, user) => {
      if (err) return done(err);
      if (!user || password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));

  // Passport session management
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectId(id) }, (err, doc) => {
      if (err) return done(err);
      done(null, doc);
    });
  });

  // Auth guard
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  // Routes
  app.route('/')
    .get((req, res) => {
      res.render('index', {
        title: 'Connected to Database',
        message: 'Please login',
        showLogin: true
      });
    });

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });

  app.route('/register')
    .post((req, res) => {
      const { username, password } = req.body;
      myDataBase.findOne({ username }, (err, user) => {
        if (err || user) return res.redirect('/');
        myDataBase.insertOne({ username, password }, (err, doc) => {
          if (err) return res.redirect('/');
          res.redirect('/');
        });
      });
    });

  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('profile', { user: req.user });
    });

  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('Listening on port ' + port);
  });

}).catch(e => {
  app.route('/')
    .get((req, res) => {
      res.render('index', {
        title: e,
        message: 'Unable to connect to database'
      });
    });
});
