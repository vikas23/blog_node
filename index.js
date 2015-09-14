var express = require('express');
var multipart = require('connect-multiparty');
var app = express();

//Configure Multipart
var multipartMiddleware = multipart({
	uploadDir: "./uploads"
});

// set up handlebars view engine
var handlebars = require('express-handlebars')
	.create({
		defaultLayout: 'main'
	});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 8080);

app.get('/', function (req, res) {
	res.render('home');
});
app.post('/submitBlog', multipartMiddleware, function (req, res) {
	console.log(req.files['Blog Image']);
});
// custom 404 page
app.use(function (req, res) {
	res.type('text/plain');
	res.status(404);
	res.send('404 - Not Found');
});

// custom 500 page
app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.type('text/plain');
	res.status(500);
	res.send('500 - Server Error');
});

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:' +
		app.get('port') + '; press Ctrl-C to terminate.');
});
