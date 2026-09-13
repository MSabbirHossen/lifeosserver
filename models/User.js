import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      default: function () {
        return this.email ? this.email.split('@')[0] : 'Life OS User';
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    dailyCalorieGoal: {
      type: Number,
      default: 2000,
    },
    weightGoal: {
      type: Number,
      default: 70,
    },
    screenTimeGoalMinutes: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to guarantee a non-empty name before Mongoose validation
userSchema.pre('validate', function () {
  if (!this.name || (typeof this.name === 'string' && !this.name.trim())) {
    this.name = (this.email && this.email.includes('@') && this.email.split('@')[0]) || 'Life OS User';
  }
});

// Method to match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Pre-save hook to hash password before saving
userSchema.pre('save', async function () {
  if (!this.passwordHash || !this.isModified('passwordHash')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

export const User = mongoose.model('User', userSchema);
