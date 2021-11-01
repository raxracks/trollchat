const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get('/api/v1/fetch_keys', (req, res) => {
    /* TODO
    Fetch user(s) from database and send array of public keys
    */ 

    res.send("Unimplemented");
});

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
