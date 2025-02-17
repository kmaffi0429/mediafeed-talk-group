import React, { useState, useEffect } from 'react';
import openSocket from 'socket.io-client';

// import Input from '../../../components/Form/Input/Input';
import ErrorHandler from '../../../ErrorHandler/ErrorHandler';
// import Button from '../../../components/Button/Button';
// import Loader from '../../../components/Loader/Loader';
import PostCommentList from './PostCommentList/PostCommentList';
import { commentPushHandler } from '../../../../util/pushNotification';
import { 
  getPostCommentUserReactions, 
  createPostCommentUserReaction
} from '../../../../util/userReaction';

import { BASE_URL, GQL_URL, PUSH_URL } from '../../../../App';
import './PostComment.css';

const PostComments = props => {
  // console.log('postComment-props', props);

  const [postCommentList, setPostCommentList] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [error, setError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  // const [showReplyIndex, setShowReplyIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [allCommentReactions, setAllCommentReactions] = useState([]);
  // const [selectedCommentId, setSelectedCommentId] = useState(null);
  // const [yOffsetValue, setYOffsetValue] = useState(null);

  // useEffect(() => {
  //   // console.log('USEEFFECT');
  //   // console.log(showReplyIndex);
  // }, [showReplyIndex]);

  useEffect(() => {
    commentsGetHandler();

    // getPostCommentUserReactionsHandler('like');
    getPostCommentUserReactionsHandler();
  }, []);

  useEffect(() => {
    const socket = openSocket(BASE_URL);
    socket.on('comments', data => {
      if (data.action === 'comment-add') {
        console.log('IN SOCKET.ON comment-add', data);
        addComment(data.comment);
      }
      if (data.action === 'comment-action') {
        console.log('IN SOCKET.ON comment-action', data);
        commentsGetHandler();
      }
    })
  }, []);

  // useEffect(() => {
  //   window.scrollTo(window.pageXOffset, yOffsetValue);
  // }, [yOffsetValue]);

  const addComment = (commentData) => {
    console.log(postCommentList, commentData);
    const addPosts = postCommentList.unshift(commentData);
    setPostCommentList(addPosts);
  }

  const catchError = error => {
    setError(error);
  };

  const errorHandler = () => {
    setError(null);
  };

  const commentInputChangeHandler = (input, value) => {
    setCommentInput(value);
    // console.log(commentInput);
  }
  const getInputHandler = (input) => {
    setCommentInput(input);
  }

  const replyInputChangeHandler = (input, value) => {
    setReplyInput(value);
    // console.log(commentInput);
  }
  const getReplyInputHandler = (input) => {
    setReplyInput(input);
  }

  // const canDelete = (creatorId) => {
  //   if (
  //     creatorId === localStorage.getItem('userId') ||
  //     props.postCreatorId === localStorage.getItem('userId')
  //   ) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  const showDeleteModalHandler = () => {
    setShowDeleteModal(!showDeleteModal);
  }
  const hideDeleteModalHandler = () => {
    setShowDeleteModal(false);
  }

  const commentsGetHandler = () => {
    setCommentLoading(true);
    const graphqlQuery = {
      query: `
        query FetchComments($postId: ID!) {
        comments(postId: $postId) {
          _id
          content
          postId
          parentCommentId
          creatorId
          creator_id
          creatorName
          creatorImageUrl
          acceptLanguage
          createdAt
        }
      }
      `,
      variables: {
        postId: props.postId
      }
    };
    fetch(GQL_URL, {
      headers: {
        Authorization: 'Bearer ' + props.token,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch status');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        // if (resData.errors) {
        //   throw new Error('Fetching comment failed!')
        // }
        setPostCommentList(resData.data.comments);
        setCommentLoading(false);
      })
      .catch(err => {
        console.log(err);
        // catchError(err);
        setCommentLoading(false);
      });
  }

  const commentPostHandler = (commentContent, parentCommentId) => {
    // console.log('Clicked');
    setCommentLoading(true);

    let graphqlQuery = {
      query: `
          mutation CreateNewComment(
            $content: String!, 
            $postId: ID!,
            $parentCommentId: ID
            $locationData: GeolocationInputData
          ) {
            createPostComment(commentInput: {
              content: $content, 
              postId: $postId,
              parentCommentId: $parentCommentId,
              locationData: $locationData
            }) {
              _id
              content
              postId
              parentCommentId
              creatorId
              creator_id
              creatorName
              creatorImageUrl
              createdAt
            }
        }
        `,
      variables: {
        content: commentContent,
        postId: props.postId,
        parentCommentId: parentCommentId,
        locationData: JSON.parse(localStorage.getItem('userLocation'))
      }
    };

    fetch(GQL_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then(res => {
        console.log(res);

        return res.json();
      })
      .then(resData => {
        console.log(resData);

        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed!"
          );
        }
        if (resData.errors) {
          throw new Error('Comment creation failed!')
        }

        setCommentInput('');
        setReplyInput('');
        setCommentLoading(false);

        const commentData = resData.data.createPostComment;

        return fetch(BASE_URL + '/comment/action', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + props.token,
          },
        })
          .then(res => {
            console.log(res);
            return res.json()
          })
          .then(resData => {
            console.log(resData);

            return commentPushHandler(
              // BASE_URL,
              PUSH_URL,
              localStorage.getItem('token'),
              localStorage.getItem('userId'),
              props.postCreatorId, 
              commentData
            )
          })
      })
      .catch(err => {
        console.log(err);
        catchError(err);
        setCommentLoading(false);
      });

  }

  const commentDeleteHandler = (postId, commentId) => {
    // console.log(commentId);
    setCommentLoading(true);

    const graphqlQuery = {
      query: `
      mutation {
          deletePostComment(commentId: "${commentId}") 
        }
      `
    };

    fetch(GQL_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then(res => {
        // if (res.status !== 200 && res.status !== 201) {
        //   throw new Error('Deleting a post failed!');
        // }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        if (resData.errors) {
          throw new Error('Deletion failed!')
        }

        setCommentLoading(false);
        hideDeleteModalHandler();

        return fetch(BASE_URL + '/comment/action', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + props.token,
          },
        })
          .then(res => {
            console.log(res);
            return res.json()
          })
          .then(resData => {
            console.log(resData);
          })

      })
      .catch(err => {
        console.log(err);
        catchError(err);
        setCommentLoading(false);
        // this.setState({ postsLoading: false });
      });

  }


  const getPostCommentUserReactionsHandler = (type) => {
    setCommentLoading(true);

    getPostCommentUserReactions(
      BASE_URL,
      localStorage.getItem('token'),
      props.userId,
      type,
      props.postId,
    )
      .then(result => {
        console.log(result);

        setAllCommentReactions(result.data);
        setCommentLoading(false);
      })
      .catch(err => {
        console.log(err);
        setCommentLoading(false);
      });
  };

  const createPostCommentUserReactionHandler = (type, commentId) => {
    // if (!isUserLike) {

      setCommentLoading(true);

      createPostCommentUserReaction(
        BASE_URL,
        localStorage.getItem('token'),
        props.userId,
        type,
        commentId,
        props.postId,
      )
        .then(result => {
          console.log(result);
          getPostCommentUserReactionsHandler(type);
          setCommentLoading(false);
        })
        .catch(err => {
          console.log(err);
          setCommentLoading(false);
        });

    // }

};


  return (
    <div>
      <ErrorHandler error={error} onHandle={errorHandler} />
      <PostCommentList
        isAuth={props.isAuth}
        postCommentList={postCommentList}
        commentsGetHandler={commentsGetHandler}
        commentPostHandler={commentPostHandler}
        commentDeleteHandler={commentDeleteHandler}
        showDeleteModal={showDeleteModal}
        hideDeleteModalHandler={hideDeleteModalHandler}
        showDeleteModalHandler={showDeleteModalHandler}
        commentInput={commentInput}
        commentInputChangeHandler={commentInputChangeHandler}
        getInputHandler={getInputHandler}
        replyInput={replyInput}
        replyInputChangeHandler={replyInputChangeHandler}
        getReplyInputHandler={getReplyInputHandler}
        commentLoading={commentLoading}
        postId={props.postId}
        postCreatorId={props.postCreatorId}
        createPostCommentUserReactionHandler={createPostCommentUserReactionHandler}
        allCommentReactions={allCommentReactions}
      />

    </div>
  )
};

export default PostComments;
