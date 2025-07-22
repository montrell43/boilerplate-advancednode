module.exports = function (app, myDataBase) {
  const passport = require('passport');

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Home',
      message: 'Welcome! Please log in or register.',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
  });

  app.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.post('/register', (req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, function (err, user) {
      if (err) return next(err);
      if (user) return res.redirect('/');
      myDataBase.insertOne(
        { username: req.body.username, password: req.body.password },
        (err, doc) => {
          if (err) return res.redirect('/');
          next(null, doc.ops[0]);
        }
      );
    });
  },
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }
};
