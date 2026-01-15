const mongoose = require('mongoose');


async function main(){
    await mongoose.connect(process.env.MONGODB_URL)
}

module.exports = main;