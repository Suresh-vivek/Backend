import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    diagonosedWith:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    bloodGroup:{
        type:String,
        enum:["A+","A-","B+","B-","AB+","AB-","O+","O-"],
        required:true
    },
    gender:{
        type:String,
        enum:["MALE", "FEMALE", "OTHER"],
        required:true
    },
    admittedIn:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Hospital",
        required:true
    }
}, { timestamps: true });

export const Patient = mongoose.model("Patient", patientSchemachema);
