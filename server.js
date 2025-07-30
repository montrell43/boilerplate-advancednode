'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const myDB = require('./connection');
const routes = require('./routes');
const auth = require('./auth');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
fccTesting(app);

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db('exercise-tracker').collection('users');

  auth(app, myDataBase);
  routes(app, myDataBase);

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/');
    });

  app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port ' + (process.env.PORT || 3000));
  });
}).catch((err) => {
  app.route('/').get((req, res) => {
    res.render('index', { title: err, message: 'Unable to connect to database' });
  });
});
