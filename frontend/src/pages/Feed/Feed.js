import React, { Component, Fragment } from 'react';
import openSocket from 'socket.io-client';
import { withI18n } from "react-i18next";
// import Resizer from 'react-image-file-resizer'; 

import AutoSuggestHook from '../../components/AutoSuggest/AutoSuggestHook';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import FeedImages from '../../components/Feed/UserPost/FeedImages';
// import FeedVideos from '../../components/Feed/UserPost/FeedVideos';
// import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import { getUserLocation, getFavoritePosts } from '../../util/user';
import { postUpdatePushHandler } from '../../util/pushNotification'

import GroupRightElements from '../../components/GroupTalk/GroupAdElements/GroupRightElements/GroupRightElements';
import GroupTopElements from '../../components/GroupTalk/GroupAdElements/GroupTopElements/GroupTopElements';

import './Feed.css';

import { BASE_URL, PUSH_URL } from '../../App';


class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
    userOnly: false,
    userPostPage: 1,
    perUserPostPage: 2,
    userPosts: [],
    perPage: 2,
    geolocation: '',
    imageDeleted: null,
    userPageSelect: 'posts',
    moreClickNum: 0,
    searchPosts: [],
    maxPagePostNumber: 20,
    maxSearchPostNumber: 20, // less than maxPagePostNumber
    // maxPagePostNumber: 2,
    // maxSearchPostNumber: 2, // less than maxPagePostNumber
    searchPostPage: 1,
    searchMoreClickNum: 0,
    selectedCreatorId: '',
    selectedCreatorName: '',
    isFavoritePosts: false,
    // postsForSuggest: [],
    // searchSelectPostId: null,

    postDeleteResult: '',
    isPostDeleting: false,
  };

  componentDidMount() {
    console.log('Feedjs-props', this.props);

    if (this.props.isAuth) {
      fetch(BASE_URL + '/auth/status', {
        headers: {
          Authorization: 'Bearer ' + this.props.token
        }
      })
        .then(res => {
          if (res.status !== 200) {
            throw new Error('Failed to fetch user status.');
          }
          return res.json();
        })
        .then(resData => {
          console.log(resData);
          this.setState({ status: resData.status });
        })
        .catch(this.catchError);
    }

    this.loadPosts();

    const socket = openSocket(BASE_URL);
    socket.on('posts', data => {
      if (data.action === 'create') {
        this.addPost(data.post);
      } else if (data.action === 'update') {
        this.updatePost(data.post);
      } else if (data.action === 'delete') {
        this.loadPosts();
      } else if (data.action === 'action') {
        console.log('IN SOCKET.ON action');
        this.loadPosts();
      }
    })
  }

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 2) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });
  }

  updatePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id);
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts
      }
    })
  }

  selectedPostEditHandler = (postId) => {
    // const pId = localStorage.getItem('selectedPostId');
    this.startEditPostHandler(postId);
    // localStorage.removeItem('selectedPostId');
  }

  morePostHandler = () => {
    // console.log(this.state.moreClickNum * this.state.perPage, this.state.posts.length);
    if (this.state.posts.length && this.state.moreClickNum * this.state.perPage > this.state.posts.length) {
      return;
    } else {
      this.setState({ moreClickNum: this.state.moreClickNum + 1 });
    }
  }

  moreSearchPostHandler = () => {
    // console.log(this.state.searchMoreClickNum * this.state.perPage, this.state.searchPosts.length);
    if (this.state.searchPosts.length && this.state.searchMoreClickNum * this.state.perPage > this.state.searchPosts.length) {
      return;
    } else {
      this.setState({ searchMoreClickNum: this.state.searchMoreClickNum + 1 });
    }
  }

  resetSearchPostPage = () => {
    this.setState({ searchPostPage: 1 });
  }

  getSearchPosts = (posts) => {
    this.setState({ searchPosts: posts }, 
      () => console.log(this.state.searchPosts)
    );
  }

  setSelectedCreatorId = (creatorId, creatorName) => {
    this.setState({ 
      selectedCreatorId: creatorId,
      selectedCreatorName: creatorName
     }, () => {
       console.log(this.state.selectedCreatorId, this.state.selectedCreatorName)
     });

    //  this.props.history.replace('/');
    //  this.props.history.push(`/feed/userposts/${creatorId}`);

     localStorage.removeItem('tempUserName');
  }
  resetSelectedCreatorId = () => {
    this.setState({ 
      selectedCreatorId: '',
      postPage: 1
    }, 
      () => this.loadPosts()
    );

    // this.props.history.replace('/');
    this.props.history.push(`/feed/posts`);
  }

  resetPostPage = () => {
    this.setState({ postPage: 1 }, 
      () => this.loadPosts()
    );
  }

  // setSelectedCreatorPosts = (creatorId) => {
  //   const creatorPosts = this.state.posts.filter(post => {
  //     return post.creatorId === creatorId;
  //   });
  //   this.setState({ selectedCreatorPosts: creatorPosts },
  //     () => console.log(this.state.selectedCreatorPosts));
  // }

  getFavoritePostsHandler = () => {
    this.setState({ postsLoading: true });

    getFavoritePosts(localStorage.getItem('userId'), BASE_URL, this.props.token)
      .then(result => {
        console.log(result);
        this.setState({ 
          posts: result.data,
          totalPosts: result.data.length,
          postsLoading: false
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          posts: [],
          totalPosts: 0, 
          postsLoading: false 
        });
      })
  }

  favoritePostsClickHandler = () => {
      this.setState({ 
        isFavoritePosts: !this.state.isFavoritePosts },
        () => {
          if (this.state.isFavoritePosts) {
            this.getFavoritePostsHandler();
          } else { this.loadPosts(); }
        })
  }

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    let searchPage = this.state.searchPostPage;

    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    if (this.state.searchPosts.length > 0) {
      if (direction === 'searchNext') {
        searchPage++;
        this.setState({ searchPostPage: searchPage });
      }
      if (direction === 'searchPrevious') {
        searchPage--;
        this.setState({ searchPostPage: searchPage });
      }
    }

    const lsUserId = localStorage.getItem('userId');
    let queryEnd;
    queryEnd = BASE_URL + '/feed/posts?page=' + page + `&userpost=${this.state.userOnly.toString()}&userId=${lsUserId}`;
    fetch(queryEnd, {
      headers: {
        Authorization: 'Bearer ' + this.props.token
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        // console.log(resData.posts[0].creator._id)


        let postDataList = resData.posts;

        const pathParts = window.location.pathname.split('/');

        if (this.state.selectedCreatorId) {
          postDataList = postDataList.filter(post => {
            // console.log(post.creatorId, this.state.selectedCreatorId);
            return post.creatorId === this.state.selectedCreatorId;
          });
        }

        if (pathParts[2] === 'userposts' && pathParts[3]) {
          postDataList = postDataList.filter(post => {
            return post.creatorId === pathParts[3];
          });
          if (localStorage.getItem('tempUserName')) {
            this.setSelectedCreatorId(pathParts[3], localStorage.getItem('tempUserName'));
          }
        }

        // console.log(this.state.selectedCreatorId, postDataList)

        this.setState({
          posts: postDataList.map(post => {
            return {
              ...post,
              // imagePath: post.imageUrl
            }
          }),
          // totalPosts: resData.totalItems,
          totalPosts: postDataList.length,
          postsLoading: false
        });

        if (this.state.editPost) {
          this.updateEditPostHandler(this.state.editPost._id);
        }

        //// post edit from singlepost page
        if (localStorage.getItem('selectedPostId')) {
          this.selectedPostEditHandler(localStorage.getItem('selectedPostId'));
        }
        // localStorage.removeItem('selectedPostId');


        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
          console.log(window.innerHeight + window.scrollY, document.body.offsetHeight);
          this.morePostHandler();
          this.moreSearchPostHandler();
        }
        window.onscroll = (ev) => {
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            // console.log(window.innerHeight + window.scrollY, document.body.offsetHeight);
            this.morePostHandler();
            this.moreSearchPostHandler();
          }
        };

      })
      .catch(err => {
        console.log(err);
        // this.catchError;
      })
  };

  // statusUpdateHandler = event => {
  //   event.preventDefault();

  //   let userLocation;
  //   if (this.state.geolocation.coords) {
  //     const geoData = this.state.geolocation
  //     userLocation = {
  //       coords: {
  //         latitude: geoData.coords.latitude,
  //         longitude: geoData.coords.longitude,
  //         altitude: geoData.coords.altitude,
  //         accuracy: geoData.coords.accuracy,
  //         altitudeAccuracy: geoData.coords.altitudeAccuracy,
  //         heading: geoData.coords.heading,
  //         speed: geoData.coords.speed,
  //       },
  //       timestamp: geoData.timestamp,
  //     }
  //   }

  //   fetch(BASE_URL + '/auth/status', {
  //     method: 'PATCH',
  //     headers: {
  //       Authorization: 'Bearer ' + this.props.token,
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       status: this.state.status,
  //       geolocation: userLocation,
  //     })
  //   })
  //     .then(res => {
  //       if (res.status !== 200 && res.status !== 201) {
  //         throw new Error("Can't update status!");
  //       }
  //       return res.json();
  //     })
  //     .then(resData => {
  //       console.log(this.state.geolocation);
  //       console.log(resData);
  //     })
  //     .catch(this.catchError);
  // };

  newPostHandler = () => {
    this.setState({ isEditing: true });

    getUserLocation()
      .then(result => {
        console.log(result);
        // const locationData = result.data;

        // return updateUserLocation(
        //   '', locationData, BASE_URL, this.props.token
        //   )
        //   .then(updateResult => {
        //     console.log(updateResult);
        //   })
        //   .catch(err => {
        //     console.log(err);
        //     this.catchError(err);
        //   })

      })
      .catch(err => {
        console.log(err);
        this.catchError(err);
      })

  };

  onlyUserHandler = () => {
    this.setState({
      userOnly: !this.state.userOnly,
      isFavoritePosts: false
    }, () => { this.loadPosts(); }
    );
  }

  userPostPageHandler = (input) => {
    if (input === 'up') {
      this.setState({
        userPostPage: this.state.userPostPage + 1
      })

    } else {
      this.setState({
        userPostPage: this.state.userPostPage - 1
      })

    }
  }

  perUserPostPageHandler = (input) => {
    this.setState({
      perUserPostPage: input
    })
  }

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      // console.log(loadedPost);

      getUserLocation()
        .then(result => {
          console.log(result);
          // const locationData = result.data;

          // return updateUserLocation(
          //   '', locationData, BASE_URL, this.props.token
          //   )
          //   .then(updateResult => {
          //     console.log(updateResult);
          //   })
          //   .catch(err => {
          //     console.log(err);
          //     this.catchError(err);
          //   })

        })
        .catch(err => {
          console.log(err);
          this.catchError(err);
        })

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  updateEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      console.log(loadedPost);

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    console.log(postData);

    const formData = new FormData();
    // formData.append('title', postData.title);
    // formData.append('content', postData.content);
    // formData.append('public', postData.public);
    // if (!postData.image) {
    //   formData.append('image', postData.imageUrl);
    // } else {
    //   formData.append('image', postData.image);
    // }

    // formData.append('image', postData.image);

    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('public', postData.public);


    if (postData.image.length > 1 || postData.image.length === 1 || !postData.image) {
      
      if (postData.image.length > 0) {
        for (const file of postData.image) {
          formData.append('images', file)
        }
      }

      if (this.state.editPost && postData.imagePaths.length > 0) {
        formData.append('totalFileNumber', postData.image.length + postData.imagePaths.length);
      }
      // formData.append('images', postData.image);

      let url = BASE_URL + `/feed-images/post-images?userLocation=${localStorage.getItem('userLocation')}`;
      let method = 'POST'
      if (this.state.editPost) {
        url = BASE_URL + '/feed-images/post-images/' + this.state.editPost._id + `?userLocation=${localStorage.getItem('userLocation')}`;
        method = 'put'
      }

      fetch(url, {
        method: method,
        headers: {
          Authorization: 'Bearer ' + this.props.token,
        },
        body: formData
      })
        .then(res => {
          console.log(res);
          if (res.status !== 200 && res.status !== 201) {
            throw new Error('Creating or editing a post failed!');
          }
          return res.json();
        })
        .then(resData => {
          console.log(resData);
  
          const updatedPostData = resData.post;
          // console.log(updatedPostData);
  
          // const post = {
          //   _id: resData.post._id,
          //   title: resData.post.title,
          //   content: resData.post.content,
          //   creator: resData.post.creator,
          //   createdAt: resData.post.createdAt,
          //   // b64Simage: b64smallImage,
          // };
          this.setState(prevState => {
            return {
              isEditing: false,
              editPost: null,
              editLoading: false
            };
          }, () => {
            this.loadPosts();
          })
  
          if (updatedPostData.public === 'public') {
            return postUpdatePushHandler(
              // BASE_URL,
              PUSH_URL,
              localStorage.getItem('token'),
              localStorage.getItem('userId'),
              updatedPostData
            )
          }
          
        })
        .then(res => {
          console.log(res);
        })
        .catch(err => {
          console.log(err);
          this.catchError(err);   
          this.setState({
            isEditing: false,
            editPost: null,
            editLoading: false,
            error: err
          });
        })
    
    }


    // this.setState({
    //   editLoading: true
    // });
    // console.log(postData);

    // const formData = new FormData();
    // formData.append('title', postData.title);
    // formData.append('content', postData.content);
    // formData.append('public', postData.public);
    // if (postData.image === postData.imageUrl) {
    //   formData.append('image', postData.imageUrl);
    // } else {
    //   formData.append('image', postData.image);
    // }

    // // formData.append('b64Simage', b64smallImage);

    // console.log(formData);
    // let url = BASE_URL + `/feed/post?userLocation=${localStorage.getItem('userLocation')}`;
    // let method = 'POST'
    // if (this.state.editPost) {
    //   url = BASE_URL + '/feed/post/' + this.state.editPost._id + `?userLocation=${localStorage.getItem('userLocation')}`;
    //   method = 'put'
    // }

    // fetch(url, {
    //   method: method,
    //   body: formData,
    //   headers: {
    //     Authorization: 'Bearer ' + this.props.token
    //   }
    // })
    //   .then(res => {
    //     console.log(res);
    //     if (res.status !== 200 && res.status !== 201) {
    //       throw new Error('Creating or editing a post failed!');
    //     }
    //     return res.json();
    //   })
    //   .then(resData => {
    //     console.log(resData);

    //     const updatedPostData = resData.post;
    //     // console.log(updatedPostData);

    //     // const post = {
    //     //   _id: resData.post._id,
    //     //   title: resData.post.title,
    //     //   content: resData.post.content,
    //     //   creator: resData.post.creator,
    //     //   createdAt: resData.post.createdAt,
    //     //   // b64Simage: b64smallImage,
    //     // };
    //     this.setState(prevState => {
    //       return {
    //         isEditing: false,
    //         editPost: null,
    //         editLoading: false
    //       };
    //     }, () => {
    //       this.loadPosts();
    //     })

    //     if (updatedPostData.public === 'public') {
    //       return postUpdatePushHandler(
    //         // BASE_URL,
    //         PUSH_URL,
    //         localStorage.getItem('token'),
    //         localStorage.getItem('userId'),
    //         updatedPostData
    //       )
    //     }
        
    //   })
    //   .then(res => {
    //     console.log(res);
    //   })
    //   .catch(err => {
    //     console.log(err);
    //     this.setState({
    //       isEditing: false,
    //       editPost: null,
    //       editLoading: false,
    //       error: err
    //     });
    //   });

  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    fetch(BASE_URL + '/feed/post/' + postId, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + this.props.token
      }
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        this.loadPosts();
        // this.setState(prevState => {
        //   const updatedPosts = prevState.posts.filter(p => p._id !== postId);
        //   return { posts: updatedPosts, postsLoading: false };
        // });
      })
      .catch(err => {
        console.log(err);
        this.catchError(err);
        this.setState({ postsLoading: false });
      });
  };


  deleteMultiImagePostHandler = (postId) => {
    this.setState({ isPostDeleting: true });
    this.setState({ postDeleteResult: '' });

    fetch(BASE_URL + `/feed-images/post-images/${postId}?userLocation=${localStorage.getItem('userLocation')}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      },
    })
      .then(res => {
        console.log(res);
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);

        this.setState({ isPostDeleting: false });

        this.setState({ postDeleteResult: 'Post delete success' });
        setTimeout(() => {
          this.setState({ postDeleteResult: '' });
        },1000*5);

        return fetch(BASE_URL + '/feed/action', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + this.props.token,
          },
        })
      })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(err);
        this.setState({ isPostDeleting: false });

        this.setState({ postDeleteResult: 'Post delete failed' });
        setTimeout(() => {
          this.setState({ postDeleteResult: '' });
        },1000*5);
      })
  };



  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  deletePostImageHandler = postId => {
    this.setState({ postsLoading: true });

    return new Promise((resolve, reject) => {
      fetch(BASE_URL + '/feed/postimage/' + postId, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + this.props.token
        }
      })
        .then(res => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error('Deleting a post image failed!');
          }
          return res.json();
        })
        .then(resData => {
          console.log(resData);
  
          if (resData.data.deletePostImage) {
            this.setState({ imageDeleted: true })
          }
          
          this.loadPosts();
          
          resolve(resData);
          // this.setState(prevState => {
          //   const updatedPosts = prevState.posts.filter(p => p._id !== postId);
          //   return { posts: updatedPosts, postsLoading: false };
          // });
        })
        .catch(err => {
          console.log(err);
          this.catchError(err);
          this.setState({ postsLoading: false });
        });
    })
  };

  imageDeletedHandler = (input) => {
    this.setState({ imageDeleted: input });
  };

  render() {

    //// start edit direction from mainNavigation smallmodal
    if (localStorage.getItem('directStartEdit')) {
      this.newPostHandler();
      // localStorage.removeItem('directStartEdit');
    }
    localStorage.removeItem('directStartEdit');


    const { t } = this.props;

    // document.title=`watakura: ${t('title.text01', 'Store, Share Photos. Connect with People, Friends, Family by Talk & Group Talk')}`;

    // console.log('feedjs-props',this.props);
    const start = (this.state.postPage - 1) * this.state.perPage;

    let pagePosts;
    // const feedPost = (
    //   this.state.posts.slice(start, start + this.state.perPage).map(post => {
    //     const postElement = (
    //       <Post
    //         key={post._id}
    //         id={post._id}
    //         author={post.creatorName}
    //         creatorImageUrl={post.creatorImageUrl}
    //         date={new Date(post.createdAt).toLocaleDateString('en-US')}
    //         title={post.title}
    //         image={post.imageUrl}
    //         modifiedImageUrl={post.modifiedImageUrl}
    //         content={post.content}
    //         b64Simage={post.b64Simage}
    //         postCreator_id={post._id}
    //         public={post.public}
    //         onStartEdit={this.startEditPostHandler.bind(this, post._id)}
    //         onDelete={this.deletePostHandler.bind(this, post._id)}
    //       />
    //     );

    //     if (post.creatorId === localStorage.getItem('userId')) {
    //       return postElement;
    //     } else {
    //       if (post.public) {
    //         return postElement;
    //       }
    //     }
    //     return ''
    //   })
    // );
    
    let showPostNumber;
    let start2;
    start2 = (this.state.postPage - 1) * this.state.maxPagePostNumber;
    if (this.state.perPage + this.state.moreClickNum * this.state.perPage > this.state.maxPagePostNumber) {
      showPostNumber = this.state.maxPagePostNumber;
    } else {
      showPostNumber = this.state.perPage + this.state.moreClickNum * this.state.perPage;
    }
    console.log(start2, showPostNumber, this.state.searchPostPage, this.state.postPage);


    if (this.state.searchPosts.length > 0) {
      start2 = (this.state.searchPostPage - 1) * this.state.maxPagePostNumber;
      
      if (this.state.perPage + this.state.searchMoreClickNum * this.state.perPage > this.state.maxPagePostNumber) {
        showPostNumber = this.state.maxPagePostNumber;
      } else {
        showPostNumber = this.state.perPage + this.state.searchMoreClickNum * this.state.perPage;
      }
      console.log(start2, showPostNumber, this.state.searchPostPage, this.state.postPage);
    }

    
    let feedPost2 
    if (this.state.searchPosts.length > 0) {
      feedPost2 = (
        this.state.searchPosts.slice(start2, start2 + showPostNumber).map(post => {
          const postElement = (
            <Post
              key={post._id}
              id={post._id}
              author={post.creatorName}
              creatorImageUrl={post.creatorImageUrl}
              date={new Date(post.createdAt).toLocaleDateString('en-US')}
              postDate={post.createdAt}
              title={post.title}
              image={post.imageUrl}
              modifiedImageUrl={post.modifiedImageUrl}
              thumbnailImageUrl={post.thumbnailImageUrl}
              imageUrls={post.imageUrls}
              modifiedImageUrls={post.modifiedImageUrls}
              thumbnailImageUrls={post.thumbnailImageUrls}
              imagePaths={post.imagePaths}
              modifiedImagePaths={post.modifiedImagePaths}
              thumbnailImagePaths={post.thumbnailImagePaths}
              content={post.content}
              b64Simage={post.b64Simage}
              postCreatorUserId={post.creatorId}
              public={post.public}
              onStartEdit={this.startEditPostHandler.bind(this, post._id)}
              onDelete={this.deletePostHandler.bind(this, post._id)}
              deleteMultiImagePostHandler={this.deleteMultiImagePostHandler.bind(this, post._id)}
              isPostDeleting={this.state.isPostDeleting}
              postDeleteResult={this.state.postDeleteResult}
              setSelectedCreatorId={this.setSelectedCreatorId}
              resetPostPage={this.resetPostPage}
            />
          );
  
          if (post.creatorId === localStorage.getItem('userId')) {
            return postElement;
          } else {
            if (post.public) {
              return postElement;
            }
          }
          return ''
        })
      );

    } else {
      feedPost2 = (
        this.state.posts.slice(start2, start2 + showPostNumber).map(post => {
          const postElement = (
            <Post
              key={post._id}
              id={post._id}
              author={post.creatorName}
              creatorImageUrl={post.creatorImageUrl}
              date={new Date(post.createdAt).toLocaleDateString('en-US')}
              postDate={post.createdAt}
              title={post.title}
              image={post.imageUrl}
              modifiedImageUrl={post.modifiedImageUrl}
              thumbnailImageUrl={post.thumbnailImageUrl}
              imageUrls={post.imageUrls}
              modifiedImageUrls={post.modifiedImageUrls}
              thumbnailImageUrls={post.thumbnailImageUrls}
              imagePaths={post.imagePaths}
              modifiedImagePaths={post.modifiedImagePaths}
              thumbnailImagePaths={post.thumbnailImagePaths}
              content={post.content}
              b64Simage={post.b64Simage}
              postCreatorUserId={post.creatorId}
              public={post.public}
              onStartEdit={this.startEditPostHandler.bind(this, post._id)}
              onDelete={this.deletePostHandler.bind(this, post._id)}
              deleteMultiImagePostHandler={this.deleteMultiImagePostHandler.bind(this, post._id)}
              isPostDeleting={this.state.isPostDeleting}
              postDeleteResult={this.state.postDeleteResult}
              setSelectedCreatorId={this.setSelectedCreatorId}
              resetPostPage={this.resetPostPage}
            />
          );
  
          if (post.creatorId === localStorage.getItem('userId')) {
            return postElement;
          } else {
            if (post.public) {
              return postElement;
            }
          }
          return ''
        })
      );
    }




    if (!this.state.postsLoading && !this.state.userOnly) {
      console.log(this.state.posts);

      let favoriteButton;
      if (this.props.isAuth && this.state.isFavoritePosts) {
       favoriteButton = (
        <Button mode="flat" type="submit" onClick={this.favoritePostsClickHandler}>
          {/* posts */}
          {t('general.text19')}
        </Button>
       );
      }
      if (this.props.isAuth && !this.state.isFavoritePosts) {
        favoriteButton = (
          <Button mode="flat" type="submit" onClick={this.favoritePostsClickHandler}>
            {/* favorite posts */}
            {t('general.text18')}
          </Button>
        );
      }

      // console.log(this.state.postsLoading, this.state.userOnly)
      pagePosts = (
        <div>
          {/* <Paginator
            onPrevious={this.loadPosts.bind(this, 'previous')}
            onNext={this.loadPosts.bind(this, 'next')}
            lastPage={Math.ceil(this.state.totalPosts / this.state.perPage)}
            currentPage={this.state.postPage}
          >
            {feedPost}
          </Paginator> */}

          {/* {feedPost2} */}

          <div className="feed__favoriteButton">
            {favoriteButton}
          </div>


          {/* <AutoSuggestHook
              posts={this.state.posts}
              getSearchPosts={this.getSearchPosts}
              darkMode={this.props.darkMode}
              resetSearchPostPage={this.resetSearchPostPage}
              // maxSearchPostNumber={this.state.maxSearchPostNumber}
          /> */}
          
          
          {this.state.selectedCreatorId ? 
            <div>
              {this.state.selectedCreatorName}'s posts     
              <Button mode="flat" type="submit" onClick={this.resetSelectedCreatorId}>
                back to posts
              </Button>
            </div>
          : null
          }


          {this.state.searchPosts.length > 0 ? 
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'searchPrevious')}
              onNext={this.loadPosts.bind(this, 'searchNext')}
              lastPage={Math.ceil(this.state.searchPosts.length / this.state.maxPagePostNumber)}
              currentPage={this.state.searchPostPage}
            >
              {feedPost2}
            </Paginator>
          :
          <Paginator
            onPrevious={this.loadPosts.bind(this, 'previous')}
            onNext={this.loadPosts.bind(this, 'next')}
            lastPage={Math.ceil(this.state.posts.length / this.state.maxPagePostNumber)}
            currentPage={this.state.postPage}
          >
            {feedPost2}
          </Paginator>
        }



          {/* {this.state.moreClickNum * this.state.perPage < this.state.posts.length ?
            <button onClick={this.morePostHandler}>show-more-post-button</button>          
            :null
          } */}
        </div> 
      );
    }
    else if (!this.state.postsLoading && this.state.userOnly) {
      // console.log(this.state.postsLoading, this.state.userOnly)
      const selectButtons = (
        <div className="feed__selectButtons">
          
          <Button mode="flat" type="submit" onClick={() => {
            this.setState({ userPageSelect: 'posts'});
            }}
          >
            {/* posts */}
            {t('general.text19')}
          </Button>
          <Button mode="flat" type="submit" onClick={() => {
            this.setState({ userPageSelect: 'images'})
            }}
          >
            {/* Images */}
            {t('general.text20')}
          </Button>
          <Button mode="flat" type="submit" onClick={() => {
            this.setState({ userPageSelect: 'videos'})
            }}
          >
            {/* Videos */}
            {t('general.text21')}
          </Button>

        </div>
      );

      if (this.state.userPageSelect === 'posts') {
        pagePosts = (
        <div>
          {selectButtons}
          {/* <Paginator
            onPrevious={this.loadPosts.bind(this, 'previous')}
            onNext={this.loadPosts.bind(this, 'next')}
            lastPage={Math.ceil(this.state.totalPosts / this.state.perPage)}
            currentPage={this.state.postPage}
          >
            {feedPost}
          </Paginator> */}

          {/* {feedPost2} */}

          <AutoSuggestHook
            posts={this.state.posts}
            getSearchPosts={this.getSearchPosts}
            // darkMode={this.props.darkMode}
            resetSearchPostPage={this.resetSearchPostPage}
            // maxSearchPostNumber={this.state.maxSearchPostNumber}
          />

          {this.state.searchPosts.length > 0 ? 
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'searchPrevious')}
              onNext={this.loadPosts.bind(this, 'searchNext')}
              lastPage={Math.ceil(this.state.searchPosts.length / this.state.maxPagePostNumber)}
              currentPage={this.state.searchPostPage}
            >
              {feedPost2}
            </Paginator>
          :
          <Paginator
            onPrevious={this.loadPosts.bind(this, 'previous')}
            onNext={this.loadPosts.bind(this, 'next')}
            lastPage={Math.ceil(this.state.posts.length / this.state.maxPagePostNumber)}
            currentPage={this.state.postPage}
          >
            {feedPost2}
          </Paginator>
        }



          {/* {this.state.moreClickNum * this.state.perPage < this.state.posts.length ?
            <button onClick={this.morePostHandler}>show-more-post-button</button>          
            :null
          } */}
        </div> 
      );

      }
      if (this.state.userPageSelect === 'images') {
        pagePosts = (
          <div>
            {selectButtons}
            <FeedImages 
              posts={this.state.posts} 
              fileType="images"
              maxPagePostNumber={this.state.maxPagePostNumber}
              perPage={this.state.perPage}
            />
          </div>
        );
      }

      if (this.state.userPageSelect === 'videos') {
        pagePosts = (
          <div>
            {selectButtons}
            <FeedImages 
              posts={this.state.posts} 
              fileType="videos"
              maxPagePostNumber={this.state.maxPagePostNumber}
              perPage={this.state.perPage}
            />          </div>
        );
      }
      // console.log(this.state.postsLoading, this.state.userOnly)

    }

    return (
      <Fragment>
        <div className="feed-container">
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />

        <GroupTopElements />
        <GroupRightElements />

        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
          deletePostImageHandler={this.deletePostImageHandler}
          imageDeleted={this.state.imageDeleted}
          imageDeletedHandler={this.imageDeletedHandler}
          postsLoading={this.state.postsLoading}
          history={this.props.history}
        />

        {this.props.isAuth ?
          <div>
            {/* <section className="feed__status">
            <form onSubmit={this.statusUpdateHandler}>
              <Input
                type="text"
                placeholder="Your status"
                control="input"
                onChange={this.statusInputChangeHandler}
                value={this.state.status}
              />
              <Button mode="flat" type="submit">
                Update
              </Button>
            </form>
          </section> */}
            <section className="feed__control">
              <Button mode="raised" design="accent" onClick={this.newPostHandler}>
                {/* New Post */}
                {t('feed.text1')}
              </Button>
            </section>
            <Button mode="flat" design="" onClick={() => {
                this.onlyUserHandler();
                this.resetSelectedCreatorId();
              }}
            >
              {/* {this.state.userOnly ? 'Show Posts' : 'Show User Posts'} */}
              {this.state.userOnly ? t('feed.text3') : t('feed.text2')}
            </Button>

            {/* <AutoSuggestHook
              posts={this.state.posts}
              getSearchPosts={this.getSearchPosts}
              darkMode={this.props.darkMode}
              resetSearchPostPage={this.resetSearchPostPage}
              // maxSearchPostNumber={this.state.maxSearchPostNumber}
            /> */}

          </div>
          : null
        }

        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}

          {pagePosts}

        </section>

        {/* <div>
          ImageUpload///
        <ImageUpload 
          token={this.props.token}
        />
        </div> */}
      </div>
      </Fragment>
    );
  }
}

export default withI18n()(Feed);
// export default Feed;
