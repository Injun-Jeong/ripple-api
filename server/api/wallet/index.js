// 기본적인 라우팅 설정 로직
const express = require('express')
const cltr = require('./wallet.ctrl')
const router = express.Router();

// 계좌 정보 조회
router.get('/', cltr.index);

module.exports = router;