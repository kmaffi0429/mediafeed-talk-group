const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const io = require('../../socket');
const Post = require('../../models/feed/post.js');
const User = require('../../models/user/user');
const Comment = require('../../models/feed/comment');


exports.commentAction = async (req, res, next) => {
    // console.log(req.body);
    io.getIO().emit('comments', { action: 'comment-action' });
    res.json({ message: "response from commentAction controllers for socket" });
}

exports.getPostComments = async (req, res, next) => {
    // console.log(req.params.postId, 'req.body.content',req.body.content);
    // const postId = req.params.postId;
    const postId = req.query.postId;
    console.log('postId:', postId);

    try {
        // const post = await Post.findById(postId);
        // // const user = await User.findById(req.userId);
        // // console.log('user', user);

        // if (!post) {
        //     const error = new Error('Could not find post.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        const comments = await Comment.find({ postId: postId }).sort({ createdAt: -1 });
        // console.log('comments', comments);

        // io.getIO().emit('posts', { action: 'delete', post: postId });
        res.status(200).json({ message: 'Get comment successfully', comments: comments });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getPostComment = async (req, res, next) => {
    // console.log(req.params.postId, req.params.commentId, 'req.body.content',req.body.content);
    const postId = req.query.postId;
    const commentId = req.params.commentId;

    try {
        // const post = await Post.findById(postId);
        // // const user = await User.findById(req.userId);
        // // console.log('user', user);

        // if (!post) {
        //     const error = new Error('Could not find post.');
        //     error.statusCode = 404;
        //     throw error;
        // }
        // if (!comment) {
        //     const error = new Error('Could not find comment.');
        //     error.statusCode = 404;
        //     throw error;
        // }
        const comment = await Comment.findById(commentId);

        // io.getIO().emit('posts', { action: 'delete', post: postId });
        res.status(200).json({ message: 'Get Comment Successfully', comment: comment });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.createPostComment = async (req, res, next) => {
    console.log('req.body', req.body);
    console.log('req.query.postId', req.query.postId, 'req.body.content', req.body.content);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    const postId = req.query.postId;
    const parentCommentId = req.body.parentCommentId;
    const language = req.headers['accept-language'];
    const headers = req.headers;
    const location = JSON.parse(req.body.locationData);
    console.log('ParentCommentId', parentCommentId);
    
    try {
        const post = await Post.findById(postId);
        // const user = await User.findById(req.userId);
        const user = await User.findOne({ userId: req.userId });
        // console.log('user', user);

        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }

        const commentInput = req.body.content;
        const comment = new Comment({
            content: commentInput,
            // creator: user,
            // creatorId: user._id.toString(),
            creatorId: req.userId,
            creator_id: user._id.toString(),
            creatorName: user.name,
            creatorImageUrl: user.imageUrl,
            postId: postId,
            language: language,
            parentCommentId: parentCommentId,
            geolocation: location,
            headers: headers
        });
        await comment.save();
        // post.comments.push(comment);

        io.getIO().emit('comments', { action: 'comment-action', comment: comment });

        res.status(200).json({ message: 'Comment Created.', data: comment });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deletePostComment = async (req, res, next) => {
    // console.log(req.query.postId, req.query.commentId, 'req.body.content', req.body.content);
    const postId = req.query.postId;
    const commentId = req.params.commentId;

    try {
        const post = await Post.findById(postId);
        const comment = await Comment.findById(commentId);
        // const user = await User.findById(req.userId);
        // console.log('user', user);

        // if (!post) {
        //     const error = new Error('Could not find post.');
        //     error.statusCode = 404;
        //     throw error;
        // }
        console.log('comment creator', comment.creatorId, comment.creator);
        console.log('post creator', post.creatorId.toString());

        if (!comment) {
            const error = new Error('Could not find comment.');
            error.statusCode = 404;
            throw error;
        }

        if (comment.creatorId === req.userId || post.creatorId.toString() === req.userId) {
            if (!comment.parentCommentId) {
                await Comment.deleteMany({ parentCommentId: commentId });
            }

            await Comment.findByIdAndRemove(commentId);
        } else {
            const error = new Error('not Authorized.');
            error.statusCode = 403;
            throw error;
        }

        io.getIO().emit('comments', { action: 'comment-action', deleteCommentId: commentId });
        res.status(200).json({ message: 'Comment Deleted' });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

