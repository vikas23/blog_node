var express = require('express');
var multipart = require('connect-multiparty');
var mkdirp = require('mkdirp');
var fs = require('fs');
var jsonfile = require('jsonfile');
var jsonConcat = require('json-concat');
var marked = require('marked');

var app = express();

// Exposing Blogs
app.use(express.static('./blogs'));

// Remove directory recursively
var rmDir = function (dirPath) {
	var files
	try {
		files = fs.readdirSync(dirPath);
	} catch (e) {
		return;
	}
	if (files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var filePath = dirPath + '/' + files[i];
			if (fs.statSync(filePath).isFile())
				fs.unlinkSync(filePath);
			else
				rmDir(filePath);
		}
	}
};

var createIndexJson = function (dirPath) {
	if (fs.existsSync("./blogs/index.json")) {
		fs.unlinkSync("./blogs/index.json");
	}
	var files;
	try {
		files = fs.readdirSync(dirPath);
	} catch (e) {
		return;
	}
	var jsonArray = [];
	for (var i = 0; i < files.length; i++) {
		jsonArray[i] = dirPath + '/' + files[i] + '/' + 'blog.json';
	}
	jsonConcat({
		src: jsonArray,
		dest: "./blogs/index.json"
	}, function () {});
};

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

	//Creating directories if not there
	mkdirp('./blogs/' + req.body.id, function (e) {
		if (e) {
			console.log("Directory Already Exists.....!!!");
		}
	});
	mkdirp('./blogs/' + req.body.id + '/img', function (e) {
		if (e) {
			console.log("Directory Already Exists.....!!!");
		}
	});

	// Getting md Files
	var sourceMd = req.files.Upload_Blog.path;
	var targetHtmlPath = './blogs/' + req.body.id + '/' + 'blog.html';

	// Converting md files to html
	fs.writeFileSync(targetHtmlPath, marked(fs.readFileSync(sourceMd, 'utf8').toString()));

	// Getting Blog and Author Images
	var imgDest = './blogs/' + req.body.id + '/img/';
	fs.createReadStream(req.files.imgsrc.path).pipe(fs.createWriteStream(imgDest + 'blogTitle.jpg'));
	fs.createReadStream(req.files.authorImg.path).pipe(fs.createWriteStream(imgDest + 'authorImg.jpg'));

	// Getting JSON Files
	var file = './blogs/' + req.body.id + '/' + 'blog.json';
	var jsonData = {};
	jsonData[req.body.id] = req.body;
	jsonData[req.body.id].imgsrc = imgDest + 'blogTitle.jpg';
	jsonData[req.body.id].authorImg = imgDest + 'authorImg.jpg';
	jsonfile.writeFileSync(file, jsonData);

	// Concat Json to create Index JSON
	createIndexJson('./blogs');

	// Deleting temp files
	rmDir('./uploads');
	res.render('success');
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
