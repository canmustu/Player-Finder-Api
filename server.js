const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const http = require('http').Server(app);
//const cookie_session = require('cookie-session');
const cookie_parser = require('cookie-parser');
const body_parser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const keys = require('./config/keys');
const session = require('express-session');

// middlewares
const logger_middleware = require('./middlewares/logger-middleware');

// allow path for "public" folder
app.use('/public', express.static(path.join(__dirname, 'public')))

// passport setup
require('./services/passport-setup');

// Connect to mongoose
mongoose
    .set('useCreateIndex', true)
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

// logger middleware
// app.use(logger_middleware);

app.use(passport.initialize());

app.use(cors());

app.use(body_parser.json());

// routes
const auth_route = require('./routes/auth-route');
const user_route = require('./routes/user-route');
const game_route = require('./routes/game-route');
const lobby_route = require('./routes/lobby-route');

app.use(auth_route.path, auth_route);
app.use(user_route.path, user_route);
app.use(game_route.path, game_route);
app.use(lobby_route.path, lobby_route);

// start project
const port = process.env.PORT || 80;
const server = app.listen(port, () => {
    console.log('Server started on port', port);
});

const io = require('socket.io').listen(server);

// connect to socket.io
require('./services/socket-service')(io);