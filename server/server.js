'use strict';

const express = require('express');
const wallets = require('./api/wallets');
const app = express();
const port = 7777

app.use(express.json())
app.use('/wallets', wallets)

app.get('/', (req, res) => {
    return res.send('listening...');
});

app.listen(port, () => {
    console.log('start test listening');
});

module.exports = app;