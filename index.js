const express = require('express');
const app = express();
const passport = require('passport');
const zlib = require('zlib');
const fs = require('fs');
const bcrypt = require('bcrypt');
const randomstring = require("randomstring");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Strategy, Scope } = require('@oauth-everything/passport-discord');
const port = 3000;
const saltRounds = 10;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// holy fucking shit i need to move shit into a different file immediately

function compress(input) {
    return new Promise(function(resolve, reject) {
        zlib.gzip(input, (err, buffer) => {
            resolve(buffer);
        });
    });
}

function decompress(input) {
    return new Promise(function(resolve, reject) {
        zlib.gunzip(input, (err, buffer) => {
            resolve(buffer);
        });
    });
}

function read(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, function read(err, data) {
            resolve(data);
        });
    });
}

function write(path, data) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, data, function() {
            resolve(true);
        });
    });
}

function writeJSON(path, json) {
    json = JSON.stringify(json);
    compress(json).then(buffer => {
        write(path, buffer).then(status => { });
    });
}

function readJSON(path) {
    return new Promise(function(resolve, reject) {
        read(path).then(json => {
            decompress(json).then(buffer => {
                resolve(JSON.parse(buffer.toString("utf-8")));
            });
        });
    });
}

function quickfix(path) {
    writeJSON(path, {});
}

function format(path) {
    read(path).then(response => {
        response = JSON.parse(response);
        writeJSON(path, response);
    });
}

app.use(express.static('static'));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api/', apiLimiter);

passport.use(new Strategy(
    {
        clientID: "553473081755172864",
        clientSecret: process.env['CLIENT_SECRET'],
        callbackURL: "https://www.trollchat.cf/auth/discord/callback",
        scope: [Scope.EMAIL, Scope.IDENTIFY]
    }, (accessToken, refreshToken, profile, cb) => {
        cb(null, profile);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

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
            readJSON("data/users").then(users => {
                if(users[username]) return res.send("Username taken.");

                users[username] = {"e": email, "p": hash, "s": salt};

                writeJSON("data/users", users);
            });
        });
    });
});

app.get('/api/v1/login', async (req, res) => {
    let username = req.query.u;
    let password = req.query.h;

    readJSON("data/users").then(users => {
        console.log(users);

        let storedHash = users[username].p;
        let salt = users[username].s;

        bcrypt.hash(password, salt, function(err, hash) {
            let session_key = randomstring.generate(70);
            
            if(hash == storedHash) {
                readJSON("data/sessions").then(sessions => {
                    sessions[session_key] = users[username];
                    sessions[session_key].u = username;
                    sessions[session_key].date = new Date();
                    
                    writeJSON("data/sessions", sessions);
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

    readJSON("data/sessions").then(sessions => {
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

app.get('/signup/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: "/signup",
}), (req, res) => {
    const user = req.user;
    const u = user.username;
    const pfp = user.photos[0].value;
    const email = user.emails[0];
    let e = "";
    
    if(email.verified) {
        e = email.value;
    }
    
    res.redirect(`/signup?u=${u}&pfp=${pfp}&e=${e}`);
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
