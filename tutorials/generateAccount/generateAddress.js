// Do not use the same addresses on Testnet/Devnet and Mainnet.
// You can generate an address and secret
//    that'll work on either production or the Testnet as follows.
// You should only use an address and secret that you generated securely, on your local machine.
// It's also recommended not to use the same address for the Testnet and Mainnet,
//    because transactions that you created for use on one network could potentially also be viable on the other network, depending on the parameters you provided.
// Generating an address and secret doesn't get you XRP directly.

'use strict';

const ripple = require('ripple-lib');
const api = new ripple.RippleAPI({
    // the address of public testnet server
    server: 'wss://s.altnet.rippletest.net:51233'
});

api.connect();
api.on('connected', async () =>{
    const generated = api.generateAddress();
    console.log(generated.address);
    console.log(generated.secret);
});