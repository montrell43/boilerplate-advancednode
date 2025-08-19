const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      ClientSecrect: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback"
    },
    function(accessToken, refReshToken, profile, cb) {
      myDataBase.findAndModify(
        { id: profile.id },
        {},
        { $setOnInsert: { id: profile.id, username: profile.usename, photo: profile.photos[0].value } },
        { upsert: true, new: true },
        (err ,doc) => cb(err, doc.value)
      )
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
//   app.post('/register', (req, res) => {
//     const { username, password } = req.body;
//     myDataBase.findOne({ username: username }, (err, user) => {
//       if (err) return res.redirect('/');
//       if (user) return res.redirect('/'); // User exists

//       bcrypt.hash(password, 12, (err, hash) => {
//         if (err) return res.redirect('/');
//         myDataBase.insertOne({ username, password: hash }, (err, doc) => {
//           if (err) return res.redirect('/');
//           res.redirect('/');
//         });
//       });
//     });
//   });
 };
