'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const myDB = require('./connection');
const auth = require('./auth');
const path = require('path');
const cors = require("cors");
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const { ObjectID } = require("mongodb");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());

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
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
  //auth(app, myDataBase);

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true
    });
  });

   app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
  res.render('profile', { username: req.user.username });
});

// Logout route
app.route('/logout').get((req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy((err) => { 
      if (err) { return next(err); }  // completely end session
      res.redirect('/');
    });
  });
});

app.route('/register')
  .post((req, res, next) => {
    // Step 1: Check if username exists
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) return next(err);        // on error, call next(err)
      if (user) return res.redirect('/'); // if user exists, redirect home

      // If user not found, insert the new user
      myDataBase.insertOne(
        { username: req.body.username, password: req.body.password }, 
        (err, doc) => {
          if (err) {
            return res.redirect('/');
            } else {
              next(null, doc.ops[0]);
            }  // on insert error, redirect home
                       // call next to proceed to authentication
        }
      );
    });
  },
  // Step 2: Authenticate the newly registered user
  passport.authenticate('local', { failureRedirect: '/' }),
  // Step 3: Redirect to profile after successful login
  (req, res) => {
    res.redirect('/profile');
  }
);

// 404 middleware (last)
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);

      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  }).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database'
    });
  });
});

  
//    function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/');
// }

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Checking authenication")
    return next();
  }
  console.log("Not authenicated, redirecting")
  res.redirect('/');
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port ' + (process.env.PORT || 3000));
  });