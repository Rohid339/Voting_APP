const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAutMiddleware , generateToken} = require('./../jwt')
const Candidate = require('../models/candidate');

const checkAdminRole = async(userId)=>{
    try{
        const user = await User.findById(userId);
        if(user.role=== 'admin')
            return true;
    }
    catch(err){
        return false;
    }
}

//Post route to add a candidate
router.post('/',jwtAutMiddleware,async(req,res)=>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message:'User does not have admin role'});

        const data = req.body; // Assuming the req body contains the candidate data
        //Create a new user document using mongoose model
        const newCandidate = new Candidate(data);

        //save the new user to the database 
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response:response});

    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'Internal server error'});
    }
});


router.put('/:candidateID',jwtAutMiddleware,async(req,res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message:'User does not have admin role'});

        const candidateID = req.params.candidateID;//Extract the id from URL parameter
        const updatedCandidateData = req.body;

        const response = await Candidate.findOneAndUpdate(candidateID,updatedCandidateData,{
            new:true,//Return the updated document
            runValidators:true, // Run mongoose validations
        })

        if(!response){
            return res.status(404).json({error:'Candidate not found'});
        }

        console.log('Candidate data updated');
        res.status(200).json(response);

    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'Internal server error'});
    }
});


//Let's start voting
router.get('/vote/:candidateID',jwtAutMiddleware,async(req,res)=>{
    //no admin can vote
    //user can only vote
    const candidateID = req.params.candidateID;
    const userId  = req.user.id;
    try{
        //Find the candidate document with the specified candidateID
        const candidate =  await Candidate.findById(candidateID);
        if(!candidate)
            return res.status(400).json({message:'Candidate not found'});

        const user = await User.findById(userId);
        if(!user)
            return res.status(404).json({message:'User not found'});
        if(user.role === 'admin')
            return res.status(403).json({message:'Admin is not allowed'});
        if(user.isVoted)
            return res.status(400).json({message:'You have already voted'});

        //Update the candidate document to record the vote
        candidate.votes.push({user:userId});
        candidate.voteCount++;
        await candidate.save();
        

        //Update user document
        user.isVoted = true;
        await user.save();
        return res.status(200).json({message:'Vote recorded successfully'});
    }
    catch(err){ 
        console.log(err);
        return res.status(500).json({error:'Internal server error'});
    }

});

//Vote count 
router.get('/vote/count',async(req,res)=>{
    try{
        //Find all the candidates and sort them by votecount in decreasing order
        const candidate = (await Candidate.find()).sort({voteCount:'desc'});

        // Map the candidate to only return their name and votecount
        const voteRecord = candidate.map((data)=>{
            return {
                party : data.party,
                count : data.voteCount
            }
        });
        return res.status(200).json(voteRecord);
    }
    catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal server error'})
    }
});

//Get list of all candidates with only name and party fields
router.get('/',async(req,res)=>{
    try{
        //Find all the candidates with only the name and party fields , excluding_id
        const candidates = await Candidate.find({},'name party -_id');

        // return the list of candidates 
        res.status(200).json(candidates);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:'Internal server Error'});
    }
});

module.exports = router;