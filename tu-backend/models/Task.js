const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    status: {
      type: String,
      enum: ['To-Do', 'In Progress', 'In Review', 'Done'],
      default: 'To-Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Add index for better query performance
taskSchema.index({ title: 'text', description: 'text' });

// Add a pre-save hook to set completedAt when status is set to 'Done'
taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Done' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

// Reverse populate with virtuals
taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  justOne: false,
});

// Static method to get tasks by project
// taskSchema.statics.getProjectTasks = async function(projectId) {
//   return await this.find({ project: projectId });
// };

module.exports = mongoose.model('Task', taskSchema);
