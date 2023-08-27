const express = require('express');
const router = express.Router();
const user_Controller = require('../Controller/user_Controller');
const chat_Controller = require('../Controller/chat_Controller');

router.post('/:user_id',user_Controller.authorization,chat_Controller.createChat);
router.get('/:user_id/messages',user_Controller.authorization,chat_Controller.getChat);





module.exports = router;
