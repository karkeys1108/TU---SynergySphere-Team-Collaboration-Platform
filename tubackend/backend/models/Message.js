const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Please add message content'],
      trim: true,
      maxlength: [1000, 'Message cannot be more than 1000 characters'],
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    parentMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: String,
        name: String,
        type: {
          type: String,
          enum: ['image', 'document', 'other'],
        },
        size: Number,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add index for better query performance
messageSchema.index({ project: 1, createdAt: -1 });

// Add a virtual for replies
messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessage',
  justOne: false,
});

// Cascade delete replies when a message is deleted
messageSchema.pre('remove', async function (next) {
  await this.model('Message').deleteMany({ parentMessage: this._id });
  next();
});

// Populate sender and replies when finding messages
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'name email avatar',
  }).populate({
    path: 'replies',
    populate: {
      path: 'sender',
      select: 'name email avatar',
    },
  });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
