const RippleAPI = require('ripple-lib').RippleAPI;

const ripple = new RippleAPI({
    // the address of testnet
    server: 'wss://s.altnet.rippletest.net:51233'
});
ripple.connect();



/**
 * 이름: index
 * 설명: 계좌 정보 조회
 * */
const index = function(req, res) {
    console.log('리플 계좌 정보 조회 API 시작..');
    const account = req.query.account;

    ripple.getAccountInfo(account).then(info => {
        console.log('\n============계좌정보');
        console.log(info);
        console.log('============//계좌정보\n');
        return res.send(info);
    }).catch(() => {
        console.error;
        return res.status(400)
            .send('계좌 조회 중 오류가 발생하였습니다.\n계좌번호 확인 후, 다시 시도해주세요.');
    });
};



/** todo: get 방식을 post 방식으로 수정 필요...(이것도 보안안될거같은데,,, 시크릿 키,,,)
 * 이름: transfer
 * 설명: 송금
 * 입력
 *  -
 * */
const transfer = function(req, res) {
    /* 필수 입력값 체크 todo: 필수 입력값 체크 로직 */
    const account = req.query.account;
    const secret = req.query.secret;
    const destination = req.query.destination;
    const amount = req.query.amount;


    /* 트랜잭션 설정값 */
    const transactionType = 'Payment';


    /* 송금 수행 */
    async function exec() {
        /* prepareTransaction 생성 */
        let preparedTx;
        try {
            preparedTx = await ripple.prepareTransaction({
                "TransactionType": transactionType,
                "Account": account,
                "Amount": ripple.xrpToDrops(amount),
                "Destination": destination
            }, {
                "maxLedgerVersionOffset": 75
            });
        } catch (e) {
            console.log(e);
            return res.send('송금 중 오류가 발생하였습니다. 계좌번호 및 송금액을 확인 후, 다시 시도해주세요.');
        }


        const maxLedgerVersion = preparedTx.instructions.maxLedgerVersion;
        console.log("Prepared transaction instructions:", preparedTx.txJSON);
        console.log("Transaction cost:", preparedTx.instructions.fee, "XRP");
        console.log("Transaction expires after ledger:", maxLedgerVersion);


        /* sign 생성 */
        let signed;
        let txID;
        let tx_blob;
        try {
            signed = ripple.sign(preparedTx.txJSON, secret);
            txID = signed.id;
            tx_blob = signed.signedTransaction;
            console.log("Identifying hash:", txID);
            console.log("Signed blob:", tx_blob);
        } catch (e) {
            console.log(e);
            return res.send('서명 중 오류가 발생하였습니다. 비밀키, 수신 계좌번호 및 송금액을 확인 후, 다시 시도해주세요.');
        }



        const earliestLedgerVersion = (await ripple.getLedgerVersion()) + 1
        const result = await ripple.submit(tx_blob)
        console.log("Tentative result code:", result.resultCode)
        console.log("Tentative result message:", result.resultMessage)


        let has_final_status = false
        ripple.request("subscribe", {accounts: [account]})
        ripple.connection.on("transaction", (event) => {
            if (event.transaction.hash == txID) {
                console.log("Transaction has executed!", event)
                has_final_status = true
                getTranscation();
            }
        });


        /* 아직 뭔지 잘 모르곘음 */
        ripple.on('ledger', ledger => {
            if (ledger.ledgerVersion > maxLedgerVersion && !has_final_status) {
                console.log("Ledger version", ledger.ledgerVersion, "was validated.")
                console.log("If the transaction hasn't succeeded by now, it's expired")
                has_final_status = true
            }
        });


        /* 성공 시, 트랜잭션 결과 반환 */
        async function getTranscation() {
            try {
                const tx = await ripple.getTransaction( txID, { minLedgerVersion: earliestLedgerVersion } )
                console.log("Transaction result:", tx.outcome.result)
                console.log("Balance changes:", JSON.stringify(tx.outcome.balanceChanges))
                return res.send(JSON.stringify(tx.outcome.balanceChanges));
            } catch(error) {
                console.log("Couldn't get transaction outcome:", error)
                return res.send(error);
            }
        }

    }

    exec().then(rtn => { return rtn; });
}


module.exports = { index, transfer };