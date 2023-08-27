const express = require('express');
const router = express.Router();
const friendship_Controller = require('../Controller/friendship_Controller');
const user_Controller = require('../Controller/user_Controller');

router.get('/', user_Controller.authorization ,friendship_Controller.getFriend);
router.post('/:user_id/request',user_Controller.redis, user_Controller.authorization ,friendship_Controller.requestFriend);
router.get('/pending', user_Controller.redis,user_Controller.authorization ,friendship_Controller.pending);
router.post('/:friendship_id/agree', user_Controller.redis,user_Controller.authorization ,friendship_Controller.friendAgree);
router.delete('/:friendship_id', user_Controller.redis,user_Controller.authorization ,friendship_Controller.friendDelete);



//ooo


module.exports = router;
