const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
      maxlength: [100, 'Project name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Add index for better query performance
projectSchema.index({ name: 'text', description: 'text' });

// Cascade delete tasks when a project is deleted
projectSchema.pre('remove', async function (next) {
  await this.model('Task').deleteMany({ project: this._id });
  await this.model('Message').deleteMany({ project: this._id });
  next();
});

// Reverse populate with virtuals
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  justOne: false,
});

projectSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'project',
  justOne: false,
});

// Check if user is project member
projectSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

// Check if user is project admin
projectSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() && member.role === 'admin'
  );
};

module.exports = mongoose.model('Project', projectSchema);
