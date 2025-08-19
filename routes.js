const passport = require('passport');
const bcrypt = require('bcrypt');
const { ObjectID } = require("mongodb");

module.exports = function(app, myDataBase) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  app.route('/')
    .get((req, res) => {
      res.render('index', {
        title: 'Connected to Database',
        message: 'Please log in',
        showLogin: true,
        showRegistration: true
      });
    });

    app.get("./auth/github", passport.authenticate("github"));

    app.get("./auth/github/callback", passport.authenticate("github", { failureRedirect: "/" }), (req, res) => {
      res.redirect("/profile")
    })
  
  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });

  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      res.render('profile', { username: req.user.username });
    });

  app.route('/logout')
    .get((req, res, next) => {
      req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
      });
    });

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) return next(err);
        if (user) return res.redirect('/');

        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({ username: req.body.username, password: hash }, (err, doc) => {
          if (err) return next(err);
          next(null, doc.ops[0]);
        });
      });
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    }
  );
};
