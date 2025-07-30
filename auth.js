const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { ObjectId } = require('mongodb');

module.exports = function(app, myDataBase) {
  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false);
        if (password !== user.password) return done(null, false);
        return done(null, user);
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

  // Registration route (optional: you can put it here or in server.js)
  app.post('/register', (req, res) => {
    const { username, password } = req.body;
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return res.redirect('/');
      if (user) return res.redirect('/'); // User exists, redirect back

      myDataBase.insertOne({ username, password }, (err, doc) => {
        if (err) return res.redirect('/');
        res.redirect('/');
      });
    });
  });
};
