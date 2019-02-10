const express = require('express');
const app = express();
const mongoose = require('mongoose');
//const cookie_session = require('cookie-session');
const cookie_parser = require('cookie-parser');
const body_parser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const keys = require('./config/keys');
const session = require('express-session');

// routes
const auth_route = require('./routes/auth-routes')

// models
require('./models/user-model');

// passport setup
require('./services/passport-setup');

// Connect to mongoose
mongoose
    .connect(keys.mongodb.URI, { useNewUrlParser: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log(err));

app.use(cookie_parser());
app.use(session({
    secret: "0sA3hI8kV48AtS4D",
    name: "player_finder_cookie",
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: 5 * 60 * 1000, // 5 minute
    }
}));

app.use(passport.initialize());

app.use(cors());

app.use(body_parser.json());

// routes
app.use(auth_route.path, auth_route);

app.get('/', (req, res) => {
    if (req.user) res.send(req.user);
    else res.send("hello world için çok geç değil mi çocuk adam ?<div></div><a href='/auth/steam'>STEAM</a> <a href='/auth/facebook'>FACEBOOK</a> <a href='/auth/google'>GOOGLE</a>");
});

// start project
const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log('Server started on port', port);
});
