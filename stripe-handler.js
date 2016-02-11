var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/stripe/', function (req, res) {
    res.sendFile('index.html', { root : __dirname});
});
app.get('/stripe/tor.png', function (req, res) {
    res.sendFile('tor.png', { root : __dirname});
})
app.post('/stripe/thanks', function (req, res) {
    res.send("received POST " + JSON.stringify(req.body));
});

const PORT = 8888;

var server = app.listen(PORT, function () {
    console.log("started");
});
