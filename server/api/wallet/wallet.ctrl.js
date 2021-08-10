const RippleAPI = require('ripple-lib').RippleAPI;

const ripple = new RippleAPI({
    // the address of testnet
    server: 'wss://s.altnet.rippletest.net:51233'
});

// 계좌 정보 조회
const index = function(req, res) {
    console.log('리플 계좌 정보 조회 API 시작..');

    // 테스트 계좌번호 todo: 인자로 받을 것
    const address = req.query.address;

    var result = Object;
    // connecting and promises
    ripple.connect().then(() => {
        console.log('전달 받은 계좌번호 ', address);
        return ripple.getAccountInfo(address);
    }).then(info => {
        console.log('\n============계좌정보');
        console.log(info);
        console.log('============//계좌정보\n');
        result = info;
    }).then(() => {
        return ripple.disconnect();
    }).then(() => {
        console.log('done and ripple net disconnected.');
        return res.send(result);
    }).catch(() => {
        return res.status(400)
                  .send('계좌 조회 중 오류가 발생하였습니다.\n계좌번호 확인 후, 다시 시도해주세요.');
        console.error;
    });
};

module.exports = { index }