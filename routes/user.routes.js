import {Router} from  'express';
import {verifyAndResetPassword,forgotPassword,getUserProfile, loginUser, logoutUser, refreshAccessToken, registerUser, VerfiyEmail} from  "../controllers/user.controller.js";
import {upload} from  "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();

router.route('/register').post(
    registerUser)
router.route('/login').post(loginUser)
router.route('/verifyEmail').post(VerfiyEmail)
router.route('/forgot-password').post(forgotPassword)
router.route('/new-password').post(verifyAndResetPassword)
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route( '/userProfile/:username' ).get(verifyJWT,getUserProfile );
export default router


//kya tuuh iska fronted ek baar apne backend backend se connect kar sakta taaki isk event page dekh sku 
