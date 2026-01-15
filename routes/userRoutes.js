const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAutMiddleware , generateToken} = require('./../jwt')




//POST route to add a person
router.post('/signup',async(req,res)=>{
    try{
        const data = req.body // Assuming the request body contains the user data

        //check if there is already an admin user
        const adminUser = await User.findOne({role :'admin'});
        if(data.role === 'admin' && adminUser){
            return res.status(400).json({error:'Admin user already exists'});
        } 

        //Validate Aadhar Card Number must have exactly 12 digits
        if(!/^\d{12}$/.test(data.aadharCardNumber)){
            return res.status(400).json({error:'Aadhar Card Number must be exactly 12 digits'});
        }

        //Check if a user with the same aadhar number already exist
        const existUser = await User.findOne({aadharCardNumber:data.aadharCardNumber});
        if(existUser){
            return res.status(400).json({error:'User with same AAdhar card Number is already exist '});
        }
        
        //Create a new user account using mongoose model
        const newUser = new User(data);

        //Save the new user to the database
        const response = await newUser.save();
        console.log('data saved');


        //Generate token
        const payload = {
            id : response.id
        }

        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("Token is : ",token);

        res.status(200).json({response:response,token:token});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "Internal server error"});
    }
    
});

//Login Route
router.post('/login',async(req, res)=>{
    try{
        //Extract aadhar number and password from request body
        const {aadharCardNumber,password} = req.body;

        //If aadhar card number or password is missing
        if(!aadharCardNumber || !password){
            return res.status(401).json({error:'Something is missing'})
        }
        
        //Find the user by aadhar card number
        const user = await User.findOne({aadharCardNumber:aadharCardNumber})

        //If user does not exist or password does not match! return error
        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid credentials'});
        }

        //Generate token
        const payload = {
            id : user.id
        }
        const token = generateToken(payload);
        res.json({token})
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: "Internal server error"});
    }
});

//Profile route
router.get('/profile',jwtAutMiddleware,async (req,res)=>{
    try{
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'Internal server error'});
    }
});

router.put('/profile/password',jwtAutMiddleware,async(req,res)=>{
    try{
        const userId = req.user.id;//Extract the id from the token
        const {currentPassword,newPassword} = req.body;//Extract current and new passwords from request body

        //Find the user by userId
        const user = await User.findById(userId);

        //If  password does not match! return error
        if(!user || !(await user.comparePassword(currentPassword))){
            return res.status(401).json({error: 'Invalid credentials'});
        }

        // Update the user's password
        user.password = newPassword;
        await user.save();
        console.log("Password updated");
        res.status(200).json({message:"Password updated"})
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:'Internal server Error'});
    }
});

module.exports = router;