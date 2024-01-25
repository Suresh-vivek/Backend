import mongoose from 'mongoose'

const medicalRecordSchema = new mongoose.Schema({},{timestamps:true})

export const MedicalRecords = mongoose.model("MedicalRecords",medicalRecordSchema)