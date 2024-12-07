import mongoose from 'mongoose'

const connectdb= async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/test`)
        console.log(`\n mongodb connected \n ${connectionInstance.connection.host}`);
    }catch(error){
        console.log(error);
        process.exit(1);
    }   
}

export default connectdb

