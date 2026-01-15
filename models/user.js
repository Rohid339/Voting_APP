const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const  userSchema = new mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    age :{
        type : Number,
        required:true
    },
    mobile:{
        type:String
    },
    email:{
        type:String
    },
    aadharCardNumber:{
        type:Number,
        required:true,
        unique:true
    },
    password:{
        required:true,
        type:String
    },
    role:{
        type:String,
        enum:['voter','admin'],
        default:'voter'
    },
    isVoted:{
        type:Boolean,
        default:false
    }
});

userSchema.pre('save',async function(){
    const person = this;
    //Hash the password only if it has been modified or new
    if(!person.isModified('password')) 
        return ;

    try{
        //hash the password generation
        const salt = await bcrypt.genSalt(10);
        //hash password 
        const hashedPassword = await bcrypt.hash(person.password,salt);

        //override the password 
        person.password = hashedPassword;
        ;
    }
    catch(err){
        return (err);
    }

})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        //Use bcrypt to compare the provided password with the hashed password 
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }
    catch(err){
        throw err;
    }
}

const User = mongoose.model('User',userSchema);
module.exports = User;