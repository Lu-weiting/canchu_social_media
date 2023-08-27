const user = require('../Model/user_Model');
const error = require('../Others/error');
const tool = require('../Others/tool');
const redisClient = require('../redisClient');
const fs = require('fs');
const path = require('path');
module.exports = {
    signup: async (req, res) => {
        try {
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const { name, email, password } = req.body;
            return await user.signup(res, name, email, password);
        } catch (error1) {
            console.error(error1);
            error.dbConnection(res);
        }
    },
    signin: async (req, res) => {
        try {
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const { provider, email, password } = req.body;
            if (!provider || provider.trim() === '') {
                return error.input(res);
            }
            if (provider == 'native') {
                await user.signin(res, provider, email, password);
            } else if ('facebook') {

            } else {
                return error_message.wrongProvider(res);
            }

        } catch (error1) {
            console.error(error1);
            error.dbConnection(res);
        }
    },
    authorization: async (req, res, next) => {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader || authorizationHeader.trim() === '' || typeof authorizationHeader === 'undefined') {
            return error.noToken(res);
        }
        try {
            const token = authorizationHeader.split(' ')[1];
            const payload = await tool.decodeToken(token);
            const { userId } = payload;
            req.userData = { userId: userId };
            return next();

        } catch (error1) {
            console.error(error1);
            return error.wrongToken(res);
        }
    },
    redis: async (req, res, next) => {
        req.redisClient = redisClient;
        return next();
    },
    profile: async (req, res) => {
        // ??
        const actualUserId = parseInt(req.params.id);
        try {
            if (!actualUserId) {
                return error.input(res);
            }
            const { userId } = req.userData;
            const { redisClient } = req;
            await user.profile(res, redisClient, actualUserId, userId);
        } catch (error1) {
            console.error(error1);
            error.dbConnection(res);
        }


    },
    profileUpdate: async (req, res) => {
        try {
            if (req.headers['content-type'] != 'application/json') return error_message.contentType(res);
            const { name, introduction, tags } = req.body;
            const { userId } = req.userData;
            const { redisClient } = req;
            await user.profileUpdate(res, redisClient, name, introduction, tags, userId)
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    pictureUpdate: async (req, res) => {
        try {
            if (!req.headers['content-type']) return error.input(res);
            if (!req.headers['content-type'].includes('multipart/form-data')) return error.contentType(res);
            const { userId } = req.userData;
            const { redisClient } = req;
            console.log(req.file.filename);
            console.log(__dirname);
            //            const absoluteFilePath = path.join(__dirname, '..','..',static, req.file.filename);
            // const absoluteFilePath = '/home/ubuntu/my-member-system/students/wei-ting/Canchu/static/'+req.file.filename;

            console.log('before fs error');
            await user.pictureUpdate(res, redisClient, userId, req.file.filename);
            //         
            // fs.rename(req.file.path, absoluteFilePath, (err) => {
            //     if (err) {
            //         return error.cannotSaveImg(res);
            //     } else {
            // console.log('else error');
            //         user.pictureUpdate(res,redisClient, userId, req.file.filename);
            //         return;
            //     }
            // });
        } catch (error1) {
            error.dbConnection(res);
        }
    },
    search: async (req, res) => {
        try {
            const keyword = req.query.keyword;
            const { userId } = req.userData;
            await user.search(res, keyword, userId);

        } catch (error1) {
            error.dbConnection(res);
        }
    }

}
