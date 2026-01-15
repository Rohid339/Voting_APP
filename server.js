const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./db')

app.use(express.json());
// app.use(cookieParser());

//Import the router files
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user', userRoutes);
app.use('/candidate',candidateRoutes);


const PORT = process.env.PORT || 3000;

const InitializeConnection = async()=>{
    try{
        await main();
        console.log("DB Connected");

        app.listen(process.env.PORT,()=>{
            console.log("Server listening at port number: "+process.env.PORT );
        })
    }
    catch(err){
        console.log("Error: "+err);
    }
}
InitializeConnection();