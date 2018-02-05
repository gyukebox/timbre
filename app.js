const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const resources = require('./resources/index');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session configuration
app.use(session(resources.session));

app.use('/', require('./routes/index'));
app.use('/biddings', require('./routes/bidding'));
app.use('/chart', require('./routes/chart'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/requests', require('./routes/request'));
app.use('/search', require('./routes/search'));
app.use('/users', require('./routes/user'));

module.exports = app;
