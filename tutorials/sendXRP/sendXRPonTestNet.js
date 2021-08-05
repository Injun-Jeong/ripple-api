'use strict';

const ripple = require('ripple-lib');
const api = new ripple.RippleAPI({
    // the address of public testnet server
    server: 'wss://s.altnet.rippletest.net:51233'
});

// Example credentials
let address = "rBncBM7eSJ1b3SkQNb7SdNhZcBEBF4WE3x";
let secret = "snuEG6qWYxREsBTgw2QzfAJe3RzCL";

// Connect ---------------------------------------------------------------------
api.connect();
api.on('connected', async () => {
    // Prepare transaction -------------------------------------------------------
    // Typically, we create XRP Ledger transactions as objects in the JSON transaction format.
    // The following example shows a minimal Payment specification:
    // If you're using ripple-lib for JavaScript,
    //    you can use the prepareTransaction() method to automatically fill in good defaults for the remaining fields of a transaction.
    const preparedTx = await api.prepareTransaction({
        "TransactionType": "Payment",                           // An indicator that this is a payment. ("TransactionType": "Payment")
        "Account": address,                                     // The sending address. ("Account")
        "Amount": api.xrpToDrops("22"),                         // Same as "Amount": "22000000". Typically, this is specified as an integer in "drops" of XRP, where 1,000,000 drops equals 1 XRP.
        "Destination": "r1n9H7hAoWudCUAw5Go1ziW7ToZHj5jUE"     // The address that should receive the XRP ("Destination"). This can't be the same as the sending address.
    }, {
        // Expire this transaction if it doesn't execute within ~5 minutes:
        "maxLedgerVersionOffset": 75
    });
    const maxLedgerVersion = preparedTx.instructions.maxLedgerVersion;
    console.log("Prepared transaction instructions:", preparedTx.txJSON);
    console.log("Transaction cost:", preparedTx.instructions.fee, "XRP");
    console.log("Transaction expires after ledger:", maxLedgerVersion);


    // Sign prepared instructions ------------------------------------------------
    // Signing a transaction uses your credentials to authorize the transaction on your behalf.
    // Use the sign() method to sign the transaction with ripple-lib.
    // The first argument is a string version of the JSON transaction (= preparedTx.txJSON) to sign.
    // The output is a binary blob containing the instructions and a signature from the sender.
    const signed = api.sign(preparedTx.txJSON, secret);
    const txID = signed.id;
    const tx_blob = signed.signedTransaction;
    console.log("Identifying hash:", txID);
    console.log("Signed blob:", tx_blob);


    // Submit signed blob --------------------------------------------------------
    // Now that you have a signed transaction,
    //    you can submit it to an XRP Ledger server,
    //    and that server will relay it through the network.
    // The earliest ledger a transaction could appear in is the first ledger
    // after the one that's already validated at the time it's *first* submitted.
    // Use the getLedgerVersion() method to get the latest validated ledger index.
    // Use the submit() method to submit a transaction to the network.
    const earliestLedgerVersion = (await api.getLedgerVersion()) + 1
    const result = await api.submit(tx_blob)
    console.log("Tentative result code:", result.resultCode)
    console.log("Tentative result message:", result.resultMessage)


    // Wait for validation -------------------------------------------------------
    // Most transactions are accepted into the next ledger version after they're submitted,
    //    which means it may take 4-7 seconds for a transaction's outcome to be final.
    // If the XRP Ledger is busy or poor network connectivity delays a transaction from being relayed throughout the network,
    //    a transaction may take longer to be confirmed.
    // Use an account subscription to listen for an event when the transaction is confirmed.
    // Use the ledger event type to trigger your code to run whenever there is a new validated ledger version so that you can know if the transaction can no longer be confirmed.
    let has_final_status = false
    api.request("subscribe", {accounts: [address]})
    api.connection.on("transaction", (event) => {
        if (event.transaction.hash == txID) {
            console.log("Transaction has executed!", event)
            has_final_status = true
        }
    })
    api.on('ledger', ledger => {
        if (ledger.ledgerVersion > maxLedgerVersion && !has_final_status) {
            console.log("Ledger version", ledger.ledgerVersion, "was validated.")
            console.log("If the transaction hasn't succeeded by now, it's expired")
            has_final_status = true
        }
    })


    // Check transaction results -------------------------------------------------
    // Use the getTransaction() method to check the status of a transaction.
    try {
        // The RippleAPI getTransaction() method only returns success,
        //     if the transaction is in a validated ledger version.
        // Otherwise, the await expression raises an exception.
        const tx = await api.getTransaction( txID, { minLedgerVersion: earliestLedgerVersion } )
        console.log("Transaction result:", tx.outcome.result)
        console.log("Balance changes:", JSON.stringify(tx.outcome.balanceChanges))
    } catch(error) {
        console.log("Couldn't get transaction outcome:", error)
    }
});