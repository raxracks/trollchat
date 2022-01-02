const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const randomstring = require("randomstring");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const port = 3000;
const saltRounds = 10;
const ejson = require('./encrypted-json.js');

const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 500
});

// quickfix("data/sessions")
// quickfix("data/users")

app.use(express.static('static'));
app.use(cookieParser());
app.use('/api/', apiLimiter);

app.get('', (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get('/api/v1/fetch_keys', (req, res) => {
    /* TODO
    Fetch user(s) from database and send array of public keys
    */

    res.send("Unimplemented");
});

app.get('/api/v1/signup', async (req, res) => {
    let username = req.query.u;
    let email = req.query.e;
    let password = req.query.h;

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            ejson.readJSON("data/users").then(users => {
                if(users[username]) return res.send("Username taken.");

                users[username] = {"e": email, "p": hash, "s": salt};

                ejson.writeJSON("data/users", users);
            });
        });
    });
});

app.get('/api/v1/login', async (req, res) => {
    let username = req.query.u;
    let password = req.query.h;

    ejson.readJSON("data/users").then(users => {
        let storedHash = users[username].p;
        let salt = users[username].s;

        bcrypt.hash(password, salt, function(err, hash) {
            let session_key = randomstring.generate(70);
            
            if(hash == storedHash) {
                ejson.readJSON("data/sessions").then(sessions => {
                    sessions[session_key] = users[username];
                    sessions[session_key].u = username;
                    sessions[session_key].date = new Date();
                    
                    ejson.writeJSON("data/sessions", sessions);
                })
            }

            res.send(session_key);
        });
    });
});

function validate_session(req, res, path,  redirect_path = "", use_redirect = false) {
    let cookies = req.cookies;
    
    let username = cookies.u;
    let sessionID = cookies[Object.keys(cookies)[2]];

    if (!sessionID) return res.redirect("/login");

    ejson.readJSON("data/sessions").then(sessions => {
        if (!sessions[sessionID]) return res.redirect("/login");

        if (sessions[sessionID] && sessions[sessionID].u === username) {
            if(use_redirect) return res.redirect(redirect_path);
            return res.sendFile(__dirname + path);
        } else {
            return res.redirect("/login");
        }
    });
}

app.get('/api/v1/checksession', (req, res) => {
    validate_session(req, res, "", "/chat", true);
});

app.get('/api/v1/user/get_channels', (req, res) => {
    ejson.readJSON("data/sessions").then(sessions => {
        console.log(sessions);
    });
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + "/views/signup.html");
});

app.get('/tos', (req, res) => {
    res.sendFile(__dirname + "/views/tos.html");
});

app.get('/chat', (req, res) => {
    validate_session(req, res, "/views/welcome.html");
});

app.get('/chat/:server', (req, res) => {
    validate_session(req, res, "", "/chat", true);
});

app.get('/chat/:server/:channel', (req, res) => {
    validate_session(req, res, "/views/chat.html");
});

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
