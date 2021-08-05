// script opening
'use strict';
const RippleAPI = require('ripple-lib').RippleAPI;

// instantiating the api
const api = new RippleAPI({
    // the address of testnet
    server: 'wss://s.altnet.rippletest.net:51233'
});

// connecting and promises
api.connect().then(() => {
    // begin custom code
    const address = process.argv[2];
    console.log('getting account info for ', address);
    return api.getAccountInfo(address);
}).then(info => {
    console.log(info);
    console.log('getAccountInfo done');
    // end custom code
}).then(() => {
    return api.disconnect();
}).then(() => {
    console.log('done and disconnected.');
}).catch(console.error);