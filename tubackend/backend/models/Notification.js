const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'task_due',
        'project_invite',
        'message_mention',
        'status_change',
        'new_comment',
        'project_update',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
    relatedDocument: {
      kind: String,
      item: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedDocument.kind',
      },
    },
    triggeredBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Add index for better query performance
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Mark notification as read
notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  return await this.save();
};

// Pre-save hook to set the relatedDocument.kind based on the type
notificationSchema.pre('save', function (next) {
  if (this.isNew && this.relatedDocument && !this.relatedDocument.kind) {
    if (this.type.startsWith('task_')) {
      this.relatedDocument.kind = 'Task';
    } else if (this.type.startsWith('project_')) {
      this.relatedDocument.kind = 'Project';
    } else if (this.type.startsWith('message_')) {
      this.relatedDocument.kind = 'Message';
    }
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
