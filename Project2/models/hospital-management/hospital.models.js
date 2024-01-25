import mongoose from "mongoose"

const hospitalSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    doctors:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Doctor"
    }],

    city:{
        type:String,
        required:true
    },

    state:{
        type:String,
        required:true
    },

    country:{
        type:String,
        required:true
    },

    pincode:{
        type:String,
        required:true
    },

    specializations:[{
        type:String,
        required:true
    }],

    
        
    }
,{timestamps:true})

export const Hospital = mongoose.model("Hospital", hospitalSchema)