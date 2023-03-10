const express = require("express");
const app = express();
const { join } = require("node:path");
const frontend = (...args) => {
  return join(__dirname, "..", "..", "frontend", ...args);
}

app.use(express.static(frontend("assets")));

app.get("/api/v1/channels", (_, res) => {
  res.send([{name: "sam"}, {name: "james"}]);
});

app.get("/app", (_, res) => res.redirect("/app/home"));
app.get("/app/*", (_, res) => res.sendFile(frontend("src", "app.html")));

app.listen(8080);
