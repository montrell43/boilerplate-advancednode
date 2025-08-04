const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false);
        // Compare hashed password:
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) return done(err);
          if (!result) return done(null, false);
          return done(null, user);
        });
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectId(id) }, (err, doc) => {
      done(err, doc);
    });
  });

  // Register route with password hashing
  app.post('/register', (req, res) => {
    const { username, password } = req.body;
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return res.redirect('/');
      if (user) return res.redirect('/'); // User exists

      bcrypt.hash(password, 12, (err, hash) => {
        if (err) return res.redirect('/');
        myDataBase.insertOne({ username, password: hash }, (err, doc) => {
          if (err) return res.redirect('/');
          res.redirect('/');
        });
      });
    });
  });
};
