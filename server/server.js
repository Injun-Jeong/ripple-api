'use strict';

const express = require('express');
const wallet = require('./api/wallet');
const app = express();
const port = 7777

app.use(express.json())
app.use('/wallet', wallet)

app.get('/', (req, res) => {
    return res.send('listening...');
});

app.listen(port, () => {
    console.log('start test listening');
});

module.exports = app;