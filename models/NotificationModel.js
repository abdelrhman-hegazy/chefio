const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    reseiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type:{
        type: String,
        enum: ['like', 'follow', 'new_recipe'],
        required: true
    },
    recipeId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    },
    isRead:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
})

module.exports = mongoose.model('Notification', notificationSchema);