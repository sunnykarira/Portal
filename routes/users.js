var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var moment = require('moment');


var mongo = require('mongodb');
var User = require('../models/user.js');
var db = require('monk')('localhost/portal');

// require passport and local startegy
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;


router.get('/register', function(req, res, next){

	var batches = db.get('batch');
	batches.find({}, {}, function(err, batches){
		if(err) throw err;
		res.render('register', {
		'title': 'Register',
		'batches': batches
		});
	});
	
});

router.get('/login', function(req, res, next){
	res.render('login', {
		'title': 'Login'
	});
});

router.post('/register', function (req, res,next){
	//Get the form values
	var name = req.body.name;
	var email = req.body.email;
	var batch = req.body.batch;
	var branch = req.body.branch;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;



		//Check for image field
	if(req.files.profileimage){
		console.log('Uploading file...');
		//Getting file info
		var profileImageOriginalName = req.files.profileimage.originalname;
		var profileImageName = req.files.profileimage.name;
		var profileImageMime = req.files.profileimage.mimetype;
		var profileImagePath = req.files.profileimage.path;
		var profileImageExt = req.files.profileimage.extension;
		var profileImageSize = req.files.profileimage.size;
	}else{
		//Set a default image
		var profileImageName = 'noImage.png';
	}

	//Form Validation
	// Value and error
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('batch', 'Batch field is required').notEmpty();
	req.checkBody('email', 'Email not valid').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Password do not match').equals(req.body.password);

	//Check for errors
	var errors = req.validationErrors();

	if(errors){
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			branch: branch,
			username: username,
			password: password,
			password2: password2
		});
	}else{

		var users = db.get('users');

		users.find({'username': username},{}, function(err, user){

			if(user.length !=0) {
				req.flash('info','User Already exists');
				res.location('/users/register');
				res.redirect('/users/register');
			}else{

				var str = username.substring(2,4);
				var now = new Date();
				var curr_month = now.getMonth();
				now = now.toString();
				var curr_year = now.substring(13,15);
				var sem_year = Number(curr_year) - Number(str);
				var semester_month = curr_month;
				var semester;

				if(semester_month >= 7){
					semester = sem_year * 2 + 1;

				}else{
					semester = sem_year * 2;

				}


				var newUser = new User({
					name: name,
					email: email,
					semester: semester,
					branch: branch,
					batch: batch,
					type: 'normal',
					username: username,
					password: password,
					profileimage: profileImageName
				});

				// Create User
				User.createUser(newUser, function (err, user){
					if(err) throw err;
					console.log(user);

				});

				//Success Message
				req.flash('success', 'You are now registered and may log in');
				res.location('/');
				res.redirect('/');

			}

		});


		

	}


});


passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	
	User.getUserById(id, function(err, user){
		done(err, user);
	});
});

passport.use(new localStrategy(

		// username, password, callback
	function(username, password, done){
		User.getUserByUsername(username, function(err, user){
			if(err) throw err;
			if(!user){
				console.log('Unknown User');
				return done(null, false, {
					message: 'unknown User'
				});
			}

			User.comparePassword(password, user.password, function (err, isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				}else{
					console.log('Invalid password');
					return done(null, false, {
						message: 'Invalid Password'
					})
				}
			})
		});	
	}
));


//Post login route
router.post('/login', passport.authenticate('local', {
	failureRedirect:'/users/login',
	failureFlash:'Invalid Username or Password'
}), function (req, res, next){
	console.log('Authentication Successful');
	req.flash('success', 'You are logged in');
	res.location('/');
	res.redirect('/');
});


router.get('/logout', function (req, res, next){
	req.logout();
	req.flash('success', 'You have logged out successfully');
	res.location('/home');
	res.redirect('/home');
});


module.exports = router;



