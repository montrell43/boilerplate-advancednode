'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

const app = express();

const { ObjectID } = require('mongodb');
const { MongoClient } = require('mongodb');
const url = 'mongodb+srv://tmerriweather:test1234@cluster0.eugw6oa.mongodb.net/exercise-tracker?retryWrites=true&w=majority';

const client = new MongoClient(url);

client.connect()
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return client.close();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });

// Middleware
app.use(cors());
fccTesting(app);
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views', 'pug'));

// Session
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// DB connection
myDB(async client => {
  const myDataBase = await client.db('exercise-tracker').collection('users');

  const LocalStrategy = require('passport-local');

  // Passport strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });

    app.post('/register', (req, res) => {
  const { username, password } = req.body;
  myDataBase.findOne({ username }, (err, user) => {
    if (err || user) return res.redirect('/');
    myDataBase.insertOne({ username, password }, (err, doc) => {
      if (err) return res.redirect('/');
      res.redirect('/');
    });
  });
});

  }));

  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if (err) return done(err);
      done(null, doc);
    });
  });

  // Protect middleware
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  // Routes
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true
    });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    console.log('Login successful, redirecting to /');
    res.render('/profile');
  }
);

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
  });

 // --- Start the Server Only After DB Connection ---
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
