var express = require('express');
var router = express.Router();

function ensureAuthenticated(req, res, next){
	//Passport Authentication API
	if(req.isAuthenticated()){
		return next();
	}	
	res.redirect('/home');
}

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
	res.render('index', { title: 'Express' });
  
});


router.get('/home', function(req, res, next){
	res.render('outerindex', {
		title: 'OuterIndex'
	})
});

module.exports = router;
