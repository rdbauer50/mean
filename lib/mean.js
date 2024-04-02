// Dependencies
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var validator = require('express-validator');
var session = require('express-session');
var fs = require('fs');
var http = require('http');
var https = require('https');
var _ = require('lodash');
var mongoose = require('mongoose');
var morgan = require('morgan');
var passport = require('passport');
var path = require('path');
var swig = require('swig');

// Dependent
var MongoStore = require('connect-mongo')(session);

function Mean() {

}

Mean.prototype.start = function(basedir) {
    this.basedir = basedir;
    require('./config')(this);
    this.app = express();
    this.mongoose = mongoose;
    this.mongoose.connect(this.config.server.db);

    // Views
    this.app.set('views', path.join(basedir, 'server', 'home', 'views'));
    this.app.engine('html', swig.renderFile);
    this.app.set('view engine', 'html');
    this.app.set('view cache', false); // Swig will cache

    // Body / Cookie Middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
        extended: true
    }));
    this.app.use(validator());
    this.app.use(cookieParser(this.config.server.cookieSecret));

    // Logging Middleware
    if (process.env.NODE_ENV === 'production') {
        var accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'logs', 'access.log'), {
            flags: 'a'
        });
        this.app.use(morgan('combined', {
            stream: accessLogStream
        }));
    } else {
        this.app.use(morgan(':method :url :status :response-time ms'));
    }

    // Static paths
    this.app.use('/client', express.static(path.join(this.basedir, 'client')));

    // Session Middleware using mongodb
    this.app.use(session({
        resave: true,
        saveUninitialized: false,
        secret: this.config.server.sessionSecret,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));

    // Model initilization
    this.models = [];
    require('./models')(this);

    // Passport
    require('./passport')(passport); // configure passport
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.passport = passport;

    // Routes
    require('./routes')(this);

    // SSL settings
    if (this.config.server.secure) {
        this.httpApp = express();
        this.httpApp.set('port', this.config.server.httpPort);
        this.httpApp.get('*', function(req, res, next) {
            var path = "https://" + req.headers.host;
            if (req.path) {
                path += req.path;
            }
            res.redirect(path);
        });
        this.redirectServer = http.createServer(this.httpApp);
        this.redirectServer.listen(this.httpApp.get('port'));

        this.app.set('port', process.env.PORT || this.config.server.httpsPort);
        this.server = https.createServer(this.config.sslOptions, this.app);
    }
    else {
        this.app.set('port', process.env.PORT || this.config.server.httpPort);
        this.server = http.createServer(this.app);
    }

    //Error Catching
    this.server.on('error', function(error) {
        console.error(error);
    });

    // Listen to port
    var port = this.app.get('port');
    this.server.listen(port, function() {
        console.log('app listening on port %s', port);
    });
}

Mean.prototype.seed = function(basedir) {
    this.basedir = basedir;
    require('./config')(this);
    this.mongoose = mongoose;
    this.mongoose.connect(this.config.server.db);
    // Model initilization
    this.models = [];
    require('./models')(this);

    require(path.join(this.basedir, 'seed', 'seed'))();
}

Mean.getInstance = function() {
    if (typeof this.instance === 'undefined') {
        this.instance = new Mean();
    }
    return this.instance;
};


module.exports = Mean.getInstance();
