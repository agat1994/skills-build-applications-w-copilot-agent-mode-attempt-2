import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  fitnessGoal: { type: String, required: true, trim: true },
});

export const User = model('User', userSchema);
