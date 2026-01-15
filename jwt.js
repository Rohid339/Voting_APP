const jwt = require('jsonwebtoken');

const jwtAutMiddleware =(req,res,next)=>{
    // First check request headers has authorizations or not
    const authorization = req.headers.authorization;
    if(!authorization)
        return res.status(401).json({error:'Token not found'});
     
    //Extract the jwt 
    const token = req.headers.authorization.split(" ")[1];
    if(!token)
        return res.status(401).json({error:'unauthorized'});

    try{
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Attach user informaiton to the request object
        req.user = decoded;
        next();
    }
    catch(err){
        console.error(err);
        res.status(401).json({error:'Invalid token'});
    } 
}

//Function to generate token
const generateToken =(userData)=>{
    //Generate a new token user data
    return jwt.sign(userData,process.env.JWT_SECRET,{expiresIn: 30000});
}

module.exports = {jwtAutMiddleware,generateToken};
