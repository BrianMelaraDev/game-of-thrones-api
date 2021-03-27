const User = require('./models/user')
var ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');
module.exports = function(app, passport, db,fetch) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });
    // app.get('/login', isLoggedIn, function (req, res) {
    //   res.render('profile.ejs', { user: req.user });
    // });
    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
      User.findById(req.user._id).then((user) => {
          res.render('profile.ejs', {
            user : user

          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      let firstname = req.body.name
      let lastname = req.body.msg
      const character = req.user.character
      fetch(`https://www.anapioficeandfire.com/api/characters?name=${firstname}%20${lastname}`)
          .then(res=>res.json())
          .then(data=>{
            character.name.push(data[0].playedBy[0])
            character.location.push(data[0].culture)
            const promise = User.findById(req.user._id)
            promise.then(function(user){
              user.character = character
            let savePromise= user.save()
        
              savePromise.then(function(){

                res.redirect('/profile')
              })
            })
            console.log(character);
      })
    })

    app.delete('/messages', (req, res) => {
      console.log('hello',req)
      db.collection('users').findOneAndDelete({_id: new mongoose.mongo.ObjectID('6058182df31cf46484bc8def')}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
