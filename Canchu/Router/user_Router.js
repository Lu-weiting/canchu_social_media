const express = require('express');
const router = express.Router();
const user_Controller = require('../Controller/user_Controller');
const tool = require('../Others/tool');
router.post('/signup',user_Controller.signup);
router.post('/signin',user_Controller.signin);
router.get('/:id/profile',user_Controller.redis,user_Controller.authorization ,user_Controller.profile);
router.put('/profile',user_Controller.redis,user_Controller.authorization ,user_Controller.profileUpdate);
router.put('/picture',user_Controller.redis, user_Controller.authorization, tool.uploadPicture().single('picture'), user_Controller.pictureUpdate);
router.get('/search', user_Controller.authorization ,user_Controller.search);

module.exports = router;
