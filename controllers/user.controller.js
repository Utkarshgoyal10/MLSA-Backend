import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { sendVerificationEamil, senWelcomeEmail } from "../middlewares/Email.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt  from 'jsonwebtoken';
// const registerUser = asyncHandler(async(req,res)=>{
//     // get details
//     const {fullName,email,username,password,year,branch} = req.body
    
//     //validation

//     if([fullName,email,username,password,year,branch].some((field)=>{
//         field?.trim() === "" 
//     }))
//     {
//         return res.status(201).json({ message: "All field are required"});
//     }
//     //check user already exist

//     const existeduser = await User.findOne({
//         $or:[{username},{email}]
//     })
//     if(existeduser)
//     {
//         return res.status(201).json({ message: "Email or  username already exists"});
//     }
//     console.log(req )
//     //check for images,check for profileImage
//     const profileImageLocalpath = req.files?.profileImage?.[0].path;
    

//     //upload them on cloudinary
//     const profileImage = await uploadOnCloudinary(profileImageLocalpath)
//     if(!profileImage)
//     {
//         return res.status(201).json({ message: "Something went wrong while creating the account"});
//     }
    
//     //create user object 

//     // const verificationToken= Math.floor(100000 + Math.random() * 900000).toString()


//     const user = await User.create({
//         fullName,
//         profileImage: profileImage.url,
//         email,
//         password,
//         username : username.toLowerCase(),
//         year,
//         branch,
//         // verificationToken,
//         // verificationTokenExpiresAt:Date.now() + 5 * 60 * 1000
//     })

//     // await sendVerificationEamil(user.email,verificationToken)

//     const createduser = await User.findById(user._id).select(
//         "-password -refreshToken"
//     )

//     if(!createduser){
//         return res.status(201).json({ message: "Something went wrong while creating the account "});
//     }
//     return  res.status(200).json(new ApiResponse(200,createduser,"user created successfully"))
// })

const registerUser = asyncHandler(async(req,res)=>{
    // get details
    console.log(req.body)
    const {fullName,email,password,year,branch} = req.body

    

    const existeduser = await User.findOne({
        $or:[{email}]
    })
    if(existeduser)
    {
        return res.status(201).json({ message: "Email already exists"});
    }
    // console.log(req )
    //check for images,check for profileImage
   
    

    //create user object 
    const verificationToken= Math.floor(100000 + Math.random() * 900000).toString()
    const user = await User.create({
        fullName,
        email,
        password,
        year,
        branch,
        verificationToken,
        verificationTokenExpiresAt:Date.now() + 5 * 60 * 1000
    })

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    await sendVerificationEamil(user.email,verificationToken)
    if(!createduser){
        return res.status(201).json({ message: "Something went wrong while creating the account "});
    }
    return  res.status(200).json(new ApiResponse(200,createduser,"user created successfully"))
})


const VerfiyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;  // Destructuring email and code from the request body
        console.log(email,code)
        // Check if both email and code are provided
        if (!email || !code) {
            return res.status(400).json({ success: false, message: "Email and code are required" });
        }

        // Find the user by email and verification code
        const user = await User.findOne({
            email: email,
            verificationToken: code
        });

        // If no user is found or the code is invalid
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid code or " });
        }

        // Check if the verification code is expired
        if (user.verificationTokenExpiresAt <= Date.now()) {
            // If expired, resend the verification email
            // Generate a new verification token and expiration time
        const verificationToken= Math.floor(100000 + Math.random() * 900000).toString()
        const verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000 // 5 min expiration time

        // Update the user's verification token and expiration date
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = verificationTokenExpiresAt;
        await user.save();
            await sendVerificationEamil(user.email, verificationToken);

            return res.status(400).json({
                success: false,
                message: "Verification code has expired. A new verification email has been sent."
            });
        }

        // If the code is valid and not expired, proceed with verification
        user.isVerified = true;
        user.verificationToken = undefined;  // Clear the verification token
        user.verificationTokenExpiresAt = undefined;  // Clear the expiration date
        await user.save();

        // Send a welcome email
        await senWelcomeEmail(user.email, user.fullName);
        

        // Return a success response
        return res.status(200).json({ success: true, message: "Email verified successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate that the email is provided
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Find the user by email
        const user = await User.findOne({ email: email });

        // If no user is found
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate a new verification token and expiration time
        const verificationToken= Math.floor(100000 + Math.random() * 900000).toString()
        const verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000 // 5 min expiration time

        // Update the user's verification token and expiration date
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = verificationTokenExpiresAt;
        await user.save();

        // Send the verification email with the new code
        await sendVerificationEamil(user.email, verificationToken);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email."
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const generateAcessAndRefreshTokens =  async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return{accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating token")
    }
}


const loginUser = asyncHandler(async(req,res)=>{
    const {email,password}= req.body

    if(!email){
        return res.status(201).json({ message: "=Email is required"});

    }
    if(!password){
        return res.status(201).json({ message: "Password is required"});

    }

    const user = await User.findOne({
        $or:[{email}]
    })
    // console.log(user._id)
    if(!user){
        return res.status(201).json({ message: "Invalid User"});
    }
    
    const isPasswordvalid=await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        return res.status(201).json({ message: 'Incorrect Password'});
    }

    if (!user.isVerified) {
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = otp;
        user.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000;
        await user.save();

        // Resend verification email
        await sendVerificationEamil(email, otp);

        return res.status(200).json({
            message: 'Email not verified. A new OTP has been sent to your email.',
        });
    }

    const {accessToken,refreshToken}=  await generateAcessAndRefreshTokens(user._id)

    const loggedUser =await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }
    // console.log(refreshToken,accessToken)

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json
    (
        new ApiResponse(
            200,
            {
                user:loggedUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})

const forgotPassword = asyncHandler( async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);  // 5 minutes expiration

    // Update user with OTP and expiration
    user.verificationToken = otp;
    user.verificationTokenExpiresAt = otpExpires;
    await user.save();

    // Send OTP email
    await sendVerificationEamil(email, otp);

    res.status(200).json({ message: 'OTP sent to your email. Please check your inbox.' });
});

const verifyAndResetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    // Check if the email exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({ message: 'User not found' });
    }

    // Check if OTP matches and if it's expired
    if (user.verificationToken !== code) {
        return res.status(200).json({ message: 'Invalid OTP' });
    }
    if(user.verificationTokenExpiresAt < Date.now())
    {
        const verificationToken= Math.floor(100000 + Math.random() * 900000).toString()
        const verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000 // 5 min expiration time

        // Update the user's verification token and expiration date
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = verificationTokenExpiresAt;
        await user.save();
            await sendVerificationEamil(user.email, user.name, user.verificationToken);

            return res.status(200).json({
                success: false,
                message: "Verification code has expired. A new verification email has been sent."
            });
    }

    // Hash the new password and update user details
   
    user.password = newPassword;
    user.verificationToken = null;  // Clear OTP after password reset
    user.verificationTokenExpiresAt = null;
    user.isVerified = true;  // Mark the user as verified if this was their first verification
    await user.save();
    res.status(200).json({ message: 'Password reset successfully. Please log in with your new password.' });
};

const logoutUser = asyncHandler(async (req,res)=>{
    console.log(req.user)

    await User.findByIdAndUpdate( req.user?._id,
        {
        $set:{"refreshToken":null}
    },
    {
        new:true
    })
    const user2 = await User.findById(req.user?._id)
    console.log(user2)

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(201)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},'Logged out Successfully'))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,REFRESH_TOKEN_SECRET)
        const  user= await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, 'Invalid Refresh token')
        }
        if(incomingRefreshToken!==user?.refreshAccessToken){
            throw new ApiError(401,"Refresh token is expired of used")
        }
    
        const options = {
            httpOnly:true,
            secure : true
        }
        const {accessToken,newRefreshToken} = await generateAcessAndRefreshTokens(user._id)
    
        return res.status()
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken", newRefreshToken,options)
        .json
        (
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "Acess Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,"invalid refresh token")
    }

})



const getCurrentUser = asyncHandler(async  (req,res)=> {

    return res.status(200).json(new ApiResponse (200,req.user, 'User fetched'))
})

const updateUserDetails = asyncHandler(async (req,res,next)=>{

    const {fullName,email} = req.body

    if(!fullName || !email){
        throw  new ApiError(400,'Please provide full name and email address to update your profile!')
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName:fullName,
            email:email,
        }
    },{new:true}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"Account Details updated"))

})



const getUserProfile = asyncHandler(async (req,res)=> {

    const {username} = req.params
    console.log(username)
     if(!username?.trim()){
        throw  new ApiError(400,"Username is missing")
     }

     const channel =await  User.aggregate([
        {
                $match:{
                    username: username?.toLowerCase()
                }
        },
        {
            $lookup:{
                    from: "subsciptions",
                    localField:"_id",
                    foreignField: "channel",
                    as:"subscribers"
            }
        },
        {
            $lookup:{
                    from: "subsciptions",
                    localField:"_id",
                    foreignField: "subscriber",
                    as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                IsSubscribed:1,
                profileImage:1,
                coverImage:1,
                email:1

            }
        }


    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )




} )


export {forgotPassword,verifyAndResetPassword,resendVerificationCode,registerUser,loginUser,logoutUser,refreshAccessToken,getCurrentUser,updateUserDetails,getUserProfile, VerfiyEmail};

