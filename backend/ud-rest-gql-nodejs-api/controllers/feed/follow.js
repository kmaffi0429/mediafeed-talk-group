// const fs = require('fs');
// const path = require('path');

const { validationResult } = require('express-validator');
const aws = require('aws-sdk');

// const io = require('../socket');
const Post = require('../../models/feed/post.js');
const User = require('../../models/user/user');
// const Comment = require('../models/comment');
const Follow = require('../../models/feed/follow');
const FollowerTable = require('../../models/feed/follower-table');
const FavoritePost = require('../../models/feed/favarite-post');
const { update } = require('../../models/user/user');
const { KnownTypeNames } = require('graphql/validation/rules/KnownTypeNames');


const spacesEndpoint = new aws.Endpoint(process.env.DO_SPACE_ENDPOINT);
aws.config.setPromisesDependency();
aws.config.update({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACE_ACCESSKEYID,
    secretAccessKey: process.env.DO_SPACE_SECRETACCESSKEY,
    region: process.env.DO_SPACE_REGION
});
const s3 = new aws.S3();


exports.getFollowingUsers = async (req, res, next) => {
    console.log('req.query', req.query);

    const userId = req.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });

        // if (!follow) {
        //     const error = new Error('follow of userId could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const userInfoList = [];
        // let userInfo;
        // for (let i=0; i<follow.followingUsers.length; i++) {
        //     userInfo = await User.findById(follow.followingUsers[i].userId);
        //     // console.log(userInfo);
        //     if (userInfo) {
        //         userInfoList.push({
        //             userId: userInfo._id.toString(),
        //             name: userInfo.name,
        //             imageUrl: userInfo.imageUrl,
        //             addAt: follow.followingUsers[i].addAt
        //         });
        //     }
        // }


        //// get from follwer-table
        const followerElements = await FollowerTable.find({
            userId: userId
        });
        console.log('followerElements', followerElements);

        const returnUserList = [];
        if (followerElements.length > 0) {
            const users = await User.find({});

            for (const element of followerElements) {
                const addUser = users.find(user => {
                    return user.userId === element.followingUserId;
                });

                if (addUser) {
                    returnUserList.push({
                        _id: addUser._id.toString(),
                        userId: addUser.userId,
                        name: addUser.name,
                        imageUrl: addUser.imageUrl,
                        createdAt: addUser.createdAt
                    })
                }
            }
        }
        // console.log('returnUserList', returnUserList);
        
        // res.status(200).json({ message: 'followingUsers of userId found.', data: userInfoList });
        res.status(200).json({ message: 'followingUsers of userId found.', data: returnUserList });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFollowingUser = async (req, res, next) => {
    console.log('req.query', req.query);

    const userId = req.userId;
    const followingUserId = req.query.followingUserId;
    if (userId === followingUserId) {
        console.log('cannot get yourself');
        // const error = new Error('cannot get yourself.');
        // error.statusCode = 400;
        // throw error;
        return res.status(400).json({ message: 'cannot get yourself.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });

        // if (!follow || follow.followingUsers.length === 0) {
        //     // return res.status(404).json({ message: 'followingUser of userId could not find.' });
        //     const error = new Error('followingUser of userId could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const followingUserIndex = follow.followingUsers.findIndex(ele => {
        //     return ele.userId === followingUserId;
        // });

        // if (followingUserIndex < 0) {
        //     const error = new Error('followingUser could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const userInfo = follow.followingUsers[followingUserIndex];
        // const returnUserAllInfo = await User.findById(userInfo.userId);
        // if (!allUserInfo) {
        //     const error = new Error('user could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // } 

        // const returnUInfo = {
        //     userId: allUserInfo._id.toString(),
        //     name: allUserInfo.name,
        //     imageUrl: allUserInfo.imageUrl,
        //     addAt: userInfo.addAt
        // };


        ///// get from followerTable
        const followerElement = await FollowerTable.findOne({
            userId: userId,
            followingUserId: followingUserId,
        });

        if (!followerElement) {
            // return;
            const error = new Error('following user could not find in follower-table.');
            error.statusCode = 404;
            throw error;
        }

        const returnUserAllInfo = await User.findOne({ userId: followingUserId });
        // const returnUserAllInfo = await User.find({ _id: followingUserId });
        // console.log(returnUserAllInfo);

        const returnUserInfo = {
            _id: returnUserAllInfo._id.toString(),
            userId: returnUserAllInfo.userId,
            name: returnUserAllInfo.name,
            imageUrl: returnUserAllInfo.imageUrl,
            createdAt: returnUserAllInfo.createdAt
        }

        // res.status(200).json({ message: 'followingUser of userId found.', data: returnUInfo });
        res.status(200).json({ message: 'followingUser of userId found.', data: returnUserInfo });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.addFollowingUser = async (req, res, next) => {
    console.log('req.body', req.body);

    const userId = req.userId;
    const followingUserId = req.body.followingUserId;
    if (userId === followingUserId) {
        console.log('cannot add yourself');
        const error = new Error('cannot add yourself.');
        error.statusCode = 400;
        throw error;
        // return res.status(400).json({ message: 'cannot add yourself.' });
    }

    // console.log('req.puery.postId', req.query.postId, 'req.body.content', req.body.content);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });
        // const followUser = await User.findById(followingUserId);

        // if (!followUser) {
        //     const error = new Error('following user not found.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const content = {
        //     userId: followUser._id.toString(),
        //     addAt: Date.now()
        //     // xuserId: followUser._id
        //     // name: followUser.name,
        //     // imageUrl: followUser.imageUrl ? followUser.imageUrl : null
        // };
        
        // if (!follow) {
        //     const newFollow = new Follow({
        //         userId: userId,
        //         followingUsers: [],
        //         // followedUserIds: [],
        //         favoritePostIds: []
        //     });
        //     await newFollow.save();
        //     // newFollow.followingUserIds.push(followingUserId);
        //     newFollow.followingUsers.push(content);
        //     await newFollow.save();
        // }
        // else {
        //     const followUserFind = follow.followingUsers.findIndex(user => {
        //         return user.userId === followingUserId;
        //     });
        //     console.log('followUserFind: ', followUserFind);

        //     if (follow && followUserFind < 0) {
        //         // follow.followingUserIds.push(followingUserId);
        //         follow.followingUsers.push(content);
        //         await follow.save();
        //     }

        //     if (follow && followUserFind >= 0) {
        //         const error = new Error('followingUser is already exist.');
        //         error.statusCode = 400;
        //         throw error;
        //         // return res.status(400).json({ message: 'followingUserId is already exist.' });
        //     }
        // }


        //// add in followerTable
        const user = await User.findOne({ userId: req.userId });

        let followerElement = await FollowerTable.findOne({
            userId: userId,
            followingUserId: followingUserId,
        });

        if (!followerElement) {
            followerElement = new FollowerTable({
                userId: userId,
                user_id: user._id.toString(),
                followingUserId: followingUserId,
            });
            await followerElement.save();
            console.log('followElement', followerElement);

        } else {
            const error = new Error('followingUser is already exist in followerTable.');
            error.statusCode = 400;
            throw error;
        }



        // res.status(200).json({ message: 'followingUser added.', data: content });
        res.status(200).json({ message: 'followingUser added.', data: followerElement });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteFollowingUser = async (req, res, next) => {
    console.log('req.body', req.body);

    const userId = req.userId;
    const followingUserId = req.body.followingUserId;
    if (userId === followingUserId) {
        console.log('cannot delete yourself');
        const error = new Error('cannot delete yourself.');
        error.statusCode = 400;
        throw error;
        res.status(400).json({ message: 'cannot add yourself.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });

        // if (!follow) {
        //     const error = new Error('follow of userId could not find or followingUserId is not exist.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }

        // const followUserFind = follow.followingUsers.findIndex(user => {
        //     return user.userId === followingUserId;
        // });
        // console.log('followUserFind: ', followUserFind);

        // if (follow && followUserFind < 0) {
        //     const error = new Error('following user could not find.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }

        // if (follow && followUserFind >= 0) {

        //     const deleted = follow.followingUsers.filter(element => {
        //         return element.userId !== followingUserId;
        //     });

        //     follow.followingUsers = deleted;
        //     await follow.save();
        // }


        //// delete from followerTable
        const followerElement = await FollowerTable.findOne({
            userId: userId,
            followingUserId: followingUserId,
        });

        if (followerElement) {
            await FollowerTable.deleteMany({
                userId: userId,
                followingUserId: followingUserId
            });
        } else {
            // const error = new Error('followingElement does not exist.');
            // error.statusCode = 400;
            // throw error;
        }





        res.status(200).json({ message: 'followingUserId is deleted' });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFollowedUserList = async (req, res, next) => {
    // console.log('req.query', req.query);

    const userId = req.query.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const user = await User.findById(userId);
        // if (!user) {
        //   const error = new Error('user not found.');
        //   error.statusCode = 404;
        //   throw error;
        // }

        // const follow = await Follow.find();

        // if (!follow) {
        //     const error = new Error('follow not found.');
        //     error.statusCode = 404;
        //     throw error;
        // }
        // // console.log('follow', follow);

        // const followingUserList = [];

        // for (let i=0; i<follow.length; i++) {
        //     if (follow[i].followingUsers && follow[i].followingUsers.length > 0) {
        //         // console.log('userfollow', follow[i].followingUsers);
                
        //         const userInfo = await User.findById(follow[i].userId);
        //         const userfollow = follow[i].followingUsers;
    
        //         for (let k=0; k<userfollow.length; k++) {
        //             // console.log('userfollow[k]', userfollow[k].userId);
        //             if (userfollow[k].userId === userId) {
                        
        //                 followingUserList.push({
        //                     userId: follow[i].userId,
        //                     name: userInfo.name,
        //                     imageUrl: userInfo.imageUrl,
        //                     addAt: userfollow[k].addAt
        //                   });
        //             }
        //         }
                
        //     }
            
        // }
        // // console.log('followingUserList', followingUserList);
        // const returnData = {
        //     userId: userId,
        //     followedByList: followingUserList 
        // };


        //// get from follower-table
        console.log('userId', req.userId);
        const followerElements = await FollowerTable.find({
            followingUserId: req.userId
        });
        // console.log('followerElements', followerElements);

        const returnUserList = [];

        if (followerElements.length > 0) {
            const users = await User.find({});

            for (const element of followerElements) {
                const addUser = users.find(user => {
                    return user.userId === element.userId;
                });

                if (addUser) {
                    returnUserList.push({
                        _id: addUser._id.toString(),
                        userId: addUser.userId,
                        name: addUser.name,
                        imageUrl: addUser.imageUrl,
                        createdAt: addUser.createdAt
                    })
                }
            }
        }
        // console.log('returnUserList', returnUserList);



        // res.status(200).json({ message: 'followedBy users list found.', data: returnData });
        res.status(200).json({ message: 'followedBy users list found.', data: returnUserList });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.getFavoritePosts = async (req, res, next) => {
    console.log('req.query', req.query);

    const userId = req.query.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });

        // if (!follow) {
        //     const error = new Error('follow of userId could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const postInfoList = [];
        // const updateFollowPosts = [];
        // let postInfo;
        // for (let i=0; i<follow.favoritePosts.length; i++) {
        //     postInfo = await Post.findById(follow.favoritePosts[i].postId);
        //     // console.log(userInfo);
        //     if (postInfo) {
        //         updateFollowPosts.push({
        //             postId: postInfo._id.toString()
        //         });

        //         if(postInfo.public === 'public') {
        //             postInfoList.push(postInfo);
        //           }
        //     }
        // }

        // follow.favoritePosts = updateFollowPosts;
        // await follow.save();

        // // console.log('postInfoList', postInfoList);

        // const returnPosts = postInfoList.map(post => {
        //     return {
        //         ...post._doc,
        //         imagePath: post.imageUrl,
        //         imageUrl: post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
        //             ? s3.getSignedUrl('getObject', {
        //                 Bucket: process.env.DO_SPACE_BUCKET_NAME,
        //                 Key: post.imageUrl,
        //                 Expires: 60 * 60
        //             })
        //             : 'undefined',
        //         modifiedImageUrl: post.modifiedImageUrl && post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
        //             ? s3.getSignedUrl('getObject', {
        //                 Bucket: process.env.DO_SPACE_BUCKET_NAME,
        //                 Key: post.modifiedImageUrl,
        //                 Expires: 60 * 60
        //             })
        //             : undefined,
        //         thumbnailImageUrl: post.thumbnailImageUrl && post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
        //             ? s3.getSignedUrl('getObject', {
        //                 Bucket: process.env.DO_SPACE_BUCKET_NAME,
        //                 Key: post.thumbnailImageUrl,
        //                 Expires: 60 * 60
        //                 })
        //             : undefined,
        //         // creatorImageUrl: post.creatorImageUrl
        //         //     ? s3.getSignedUrl('getObject', {
        //         //         Bucket: process.env.DO_SPACE_BUCKET_NAME,
        //         //         Key: post.creatorImageUrl ? post.creatorImageUrl : 'dummy-key',
        //         //         Expires: 60 * 60
        //         //       }) 
        //         //     : null
        //     }
        // })
        // .reverse();

        // console.log('retunposts', returnPosts);




        //// get from favoritePost
        const favoritePostElements = await FavoritePost.find({ userId: req.userId });
        // console.log('favoritePostElements', favoritePostElements);

        const favoritePostElementList = [];
        for (const element of favoritePostElements) {
            const favoritePostElement = await Post.findById(element.postId);
            
            if (favoritePostElement && favoritePostElement.public === 'public') {
                favoritePostElementList.push(favoritePostElement);
            }
        }
        // console.log('favoritePostElementList', favoritePostElementList);

        const returnPostList = favoritePostElementList.map(post => {
            return {
                ...post._doc,
                imagePath: post.imageUrl,
                imageUrl: post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
                    ? s3.getSignedUrl('getObject', {
                        Bucket: process.env.DO_SPACE_BUCKET_NAME,
                        Key: post.imageUrl,
                        Expires: 60 * 60
                    })
                    : 'undefined',
                modifiedImageUrl: post.modifiedImageUrl && post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
                    ? s3.getSignedUrl('getObject', {
                        Bucket: process.env.DO_SPACE_BUCKET_NAME,
                        Key: post.modifiedImageUrl,
                        Expires: 60 * 60
                    })
                    : undefined,
                thumbnailImageUrl: post.thumbnailImageUrl && post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl !== 'deleted'
                    ? s3.getSignedUrl('getObject', {
                        Bucket: process.env.DO_SPACE_BUCKET_NAME,
                        Key: post.thumbnailImageUrl,
                        Expires: 60 * 60
                        })
                    : undefined,
                creatorImageUrl: post.creatorImageUrl
                    ? s3.getSignedUrl('getObject', {
                        Bucket: process.env.DO_SPACE_BUCKET_NAME,
                        Key: post.creatorImageUrl ? post.creatorImageUrl : 'dummy-key',
                        Expires: 60 * 60
                      }) 
                    : null
            }
        })
        .reverse();


        // res.status(200).json({ message: 'favoritePosts of userId found.', data: returnPosts });
        res.status(200).json({ message: 'favoritePosts of userId found.', data: returnPostList });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFavoritePost = async (req, res, next) => {
    console.log('req.query', req.query);

    const userId = req.userId;
    const postId = req.query.postId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });

        // if (!follow || follow.favoritePosts.length === 0) {
        //     // return res.status(404).json({ message: 'followingUser of userId could not find.' });
        //     const error = new Error('favoritePost of userId could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const favoritePostIndex = follow.favoritePosts.findIndex(ele => {
        //     return ele.postId === postId;
        // });

        // if (favoritePostIndex < 0) {
        //     const error = new Error('favoritePost could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // const postInfoIndex = follow.favoritePosts[favoritePostIndex];
        // const postInfo = await Post.findById(postInfoIndex.postId);
        
        // if (!postInfo) {
        //     const updateFollowPosts = follow.favoritePosts.filter(post => {
        //         return post.postId !== postId;
        //     });

        //     follow.favoritePosts = updateFollowPosts;
        //     await follow.save();

        //     const error = new Error('post could not find.');
        //     error.statusCode = 404;
        //     throw error;
        // }

        // if (postInfo && postInfo.public !== 'public') {
        //     const error = new Error('post could not find.');
        //     error.statusCode = 404;
        //     throw error;
        //   }




        //// get from favoritePost
        const favoritePostElement = await FavoritePost.findOne({ 
            userId: req.userId,
            postId: postId
        });

        if (!favoritePostElement) {
            const error = new Error('favoritePostElement not find.');
            error.statusCode = 404;
            throw error;
        }

        
        const favoritePostData = await Post.findById(favoritePostElement.postId);
        // console.log('favoritePostElements', favoritePostElement);
        if (favoritePostData && favoritePostData.public !== 'public') {
            const error = new Error('post could not find.');
            error.statusCode = 404;
            throw error;
          }

        // console.log('favoritePostData', favoritePostData);
        // res.status(200).json({ message: 'favoritePost of userId found.', data: postInfo });
        res.status(200).json({ message: 'favoritePost of userId found.', data: favoritePostData });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.addFavoritePost = async (req, res, next) => {
    console.log('req.body', req.body);

    const postId = req.body.postId;
    const userId = req.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });
        // // const followUser = await User.findById(followingUserId);
        // const favoritePost = await Post.findById(postId);
        // if (!favoritePost) {
        //     const error = new Error('Post not found.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }

        // const content = {
        //     postId: favoritePost._id.toString(),
        //     addAt: Date.now()
        //     // title: favoritePost.title,
        //     // imageUrl: favoritePost.imageUrl,
        //     // modifiedImageUrl: favoritePost.modifiedImageUrl,
        //     // thumbnailImageUrl: favoritePost.thumbnailImageUrl,
        //     // public: favoritePost.public,
        //     // creatorId: favoritePost.creatorId
        // };

        // if (!follow) {
        //     const newFollow = new Follow({
        //         userId: userId,
        //         followingUsers: [],
        //         // followedUserIds: [],
        //         favoritePosts: []
        //     });
        //     await newFollow.save();
        //     // newFollow.followingUserIds.push(followingUserId);
        //     newFollow.favoritePosts.push(content);
        //     await newFollow.save();
        // }
        // else {
        //     const postFind = follow.favoritePosts.findIndex(post => {
        //         return post.postId === postId;
        //     });
        //     console.log('postFind: ', postFind);

        //     if (follow && postFind < 0) {
        //         // follow.followingUserIds.push(followingUserId);
        //         follow.favoritePosts.push(content);
        //         await follow.save();
        //     }

        //     if (follow && postFind >= 0) {
        //         const error = new Error('favoritepost is already exist in favoritePosts.');
        //         error.statusCode = 400;
        //         throw error;
        //         // return res.status(400).json({ message: 'followingUserId is already exist.' });
        //     }
        // }





        //// add in favoritePost
        const user = await User.findOne({ userId: req.userId });

        if (!user) {
            const error = new Error('user not found.');
            error.statusCode = 404;
            throw error;
        }

        let favoritePostElement = await FavoritePost.findOne({
            userId: userId,
            postId: postId,
            // user_id: user._id.toString(),
            // postCreatorUserId: postElement.creatorId,
        });

        if (!favoritePostElement) {
            favoritePostElement = new FavoritePost({
                userId: userId,
                postId: postId,
                user_id: user._id.toString(),
                // postCreatorUserId: postElement.creatorId,

            });
            await favoritePostElement.save();

        } else {
            const error = new Error('favoritePostElement is already exist.');
            error.statusCode = 400;
            throw error;
        }

        // res.status(200).json({ message: 'favorite post added.', data: content });
        res.status(200).json({ message: 'favorite post added.', data: favoritePostElement });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteFavoritePost = async (req, res, next) => {
    console.log('req.body', req.body);

    const userId = req.userId;
    const postId = req.body.postId;
    // const followingUserId = req.body.followingUserId;
    // if (userId === followingUserId) {
    //     console.log('cannot delete yourself');
    //     const error = new Error('cannot delete yourself.');
    //     error.statusCode = 400;
    //     throw error;
    //     res.status(400).json({ message: 'cannot add yourself.' });
    // }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data incorrect.');
        error.statusCode = 422;
        throw error;
    }

    try {
        // const follow = await Follow.findOne({ userId: userId });
        // const favoritePost = await Post.findById(postId);
        // if (!follow) {
        //     const error = new Error('follow of userId could not find or followingUserId is not exist.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }
        // if (!favoritePost) {
        //     const error = new Error('Post not found.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }

        // const postFind = follow.favoritePosts.findIndex(post => {
        //     return post.postId === postId;
        // });
        // console.log('postFind: ', postFind);

        // if (follow && postFind < 0) {
        //     const error = new Error('favorite post could not find.');
        //     error.statusCode = 404;
        //     throw error;
        //     // res.status(404).json({ message: 'follow of userId could not find.' });
        // }

        // if (follow && postFind >= 0) {

        //     const deleted = follow.favoritePosts.filter(element => {
        //         return element.postId !== postId;
        //     });
        //     // console.log('deleted', deleted);
        //     follow.favoritePosts = deleted;
        //     await follow.save();
        // }



        //// delete from favoritePost
        const favoritePostElement = await FavoritePost.findOne({
            userId: userId,
            postId: postId,
            // postCreatorUserId: postElement.creatorId,
        });

        if (favoritePostElement) {
            await FavoritePost.deleteOne({
                userId: userId,
                postId: postId,
                // postCreatorUserId: postElement.creatorId,
            });
        } else {
            const error = new Error('favoritePostElement does not exist.');
            error.statusCode = 400;
            throw error;
        }


        res.status(200).json({ message: 'favorite post is deleted' });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFavoritePostUserList = async (req, res, next) => {
        // console.log('req.query', req.query);

        const postId = req.query.postId;
        // const postId = '5f052f8dd778373b73c889fe'

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data incorrect.');
            error.statusCode = 422;
            throw error;
        }
    
        try {
            // const post = await Post.findById(postId);
            // if (!post) {
            //     const error = new Error('post not found.');
            //     error.statusCode = 404;
            //     throw error;
            // }
            // const follow = await Follow.find();
            // if (!follow) {
            //     const error = new Error('follow not found.');
            //     error.statusCode = 404;
            //     throw error;
            // }
            // console.log('follow', follow);
    
            // const favoriteUserList = [];
    
            // for (let i=0; i<follow.length; i++) {
            //     if (follow[i].favoritePosts && follow[i].favoritePosts.length > 0) {
            //         // console.log('userfollow', follow[i].followingUsers);

            //         const userInfo = await User.findById(follow[i].userId);
            //         const userfollow = follow[i].favoritePosts;
        
            //         for (let k=0; k<userfollow.length; k++) {
            //             // console.log('userfollow[k]', userfollow[k].userId);
            //             if (userfollow[k].postId === postId) {

            //                 favoriteUserList.push({
            //                     userId: follow[i].userId,
            //                     name: userInfo.name,
            //                     imageUrl: userInfo.imageUrl,
            //                     addAt: userfollow[k].addAt
            //                 });
            //             }
            //         }            
            //     }        
            // }
            // console.log('favoriteUserList', favoriteUserList);
            // const returnData = {
            //     postId: postId,
            //     favoritedByList: favoriteUserList 
            // };



            //// get from favoritePost
            const favoritePostElements = await FavoritePost.find({ 
                postId: postId 
            });

            // console.log('favoritePosetElements', favoritePostElements);
            
            const users = await User.find({});

            const favoriteUserList = [];

            for (const element of favoritePostElements) {
                // const userInfo = await User.findOne({ userId: element.userId });
                const userInfo = users.find(user => user.userId === element.userId);
                // console.log('userInfo', userInfo);
                if (userInfo) {
                    favoriteUserList.push({
                        _id: userInfo._id.toString(),
                        userId: userInfo.userId,
                        name: userInfo.name,
                        // imageUrl: userInfo.imageUrl,
                        imageUrl: userInfo.imageUrl && userInfo.imageUrl !== 'undefined' && userInfo.imageUrl !== 'deleted'
                        ? s3.getSignedUrl('getObject', {
                            Bucket: process.env.DO_SPACE_BUCKET_NAME,
                            Key: userInfo.imageUrl,
                            Expires: 60 * 60
                        })
                        // : 'undefined',
                        : null,
                        createdAt: userInfo.createdAt,
                    });
                }
            }

            const returnData = {
                postId: postId,
                favoritedByList: favoriteUserList 
            };


            res.status(200).json({ message: 'post favorite users list found.', data: returnData });
    
        } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        }
}