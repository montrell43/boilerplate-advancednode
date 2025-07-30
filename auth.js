const passport = require('passport');
const LocalStrategy = require('passport-local');
const { ObjectId } = require('mongodb');

module.exports = function (app, myDataBase) {
  // Local Strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);
      if (user.password !== password) return done(null, false);
      return done(null, user);
    });
  }));

  // Serialize
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectId(id) }, (err, doc) => {
      done(null, doc);
    });
  });
};
