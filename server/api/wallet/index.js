// 기본적인 라우팅 설정 로직
const express = require('express')
const cltr = require('./wallet.ctrl')
const router = express.Router();

/* 계좌 정보 조회 */
router.get('/', cltr.index);

/* 계좌 송금 */
router.get('/transfer', cltr.transfer);

module.exports = router;