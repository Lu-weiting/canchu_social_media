const express = require('express');
const router = express.Router();
const user_Controller = require('../Controller/user_Controller');
const group_Controller = require('../Controller/group_Controller');
const tool = require('../Others/tool');
router.post('/',user_Controller.authorization,group_Controller.createGroup);
router.delete('/:group_id',user_Controller.authorization,group_Controller.deleteGroup);
router.post('/:group_id/join',user_Controller.authorization,group_Controller.joinGroup);
router.get('/:group_id/member/pending',user_Controller.authorization,group_Controller.pending);
router.post('/:group_id/member/:user_id/agree',user_Controller.authorization,group_Controller.agree);
router.post('/:group_id/post',user_Controller.authorization,group_Controller.post);
router.get('/:group_id/posts',user_Controller.authorization,group_Controller.getPost);



module.exports = router;
