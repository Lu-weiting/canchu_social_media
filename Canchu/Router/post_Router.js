const express = require('express');
const router = express.Router();
const user_Controller = require('../Controller/user_Controller');
const post_Controller = require('../Controller/post_Controller');


router.post('/',user_Controller.redis,user_Controller.authorization,post_Controller.createPost);
router.put('/:id',user_Controller.redis,user_Controller.authorization,post_Controller.updatePost);
router.post('/:id/like',user_Controller.redis,user_Controller.authorization,post_Controller.postLike);
router.delete('/:id/like',user_Controller.redis,user_Controller.authorization,post_Controller.deleteLike);
router.post('/:id/comment',user_Controller.redis,user_Controller.authorization,post_Controller.createComment);
router.get('/search',user_Controller.redis,user_Controller.authorization,post_Controller.findPost);
router.get('/generateFakePost',post_Controller.fakePost);

router.get('/:id',user_Controller.redis,user_Controller.authorization,post_Controller.postDetail);


module.exports = router;
