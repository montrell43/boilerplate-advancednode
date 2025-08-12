'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const myDB = require('./connection');
const path = require('path');
const { ObjectID } = require('mongodb');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Session setup - set resave and saveUninitialized to false for better behavior
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretHere',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure: true requires HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = client.db('database').collection('users');

  // Passport local strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username }, (err, user) => {
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
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  app.get('/', (req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true
    });
  });

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    }
  );

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
  });

  app.post('/register', (req, res, next) => {
    const { username, password } = req.body;
    myDataBase.findOne({ username }, (err, user) => {
      if (err) return next(err);
      if (user) return res.redirect('/');
      myDataBase.insertOne({ username, password }, (err, doc) => {
        if (err) return next(err);
        next(null, doc.ops[0]);
      });
    });
  },
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  });

  // Fix logout route to avoid buffering
  app.get('/logout', (req, res, next) => {
    req.logout(err => {
      if (err) { return next(err); }
      req.session.destroy(err => {
        if (err) { return next(err); }
        res.clearCookie('connect.sid', { path: '/' });
        res.redirect('/');
      });
    });
  });

  // 404 middleware
  app.use((req, res) => {
    res.status(404).type('text').send('Not Found');
  });

}).catch(e => {
  app.get('/', (req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database'
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
