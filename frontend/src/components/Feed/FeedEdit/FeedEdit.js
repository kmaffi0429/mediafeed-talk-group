import React, { Component, Fragment } from 'react';
import { withI18n } from "react-i18next";


import Backdrop from '../../Backdrop/Backdrop';
import Button from '../../Button/Button';
import Modal from '../../Modal/Modal';
import Input from '../../Form/Input/Input';
import InputEmoji from '../../Form/Input/InputEmoji';
import FilePicker from '../../Form/Input/FilePicker';
import Loader from '../../Loader/Loader';
// import Image from '../../Image/Image';
import ImagePreviews from './ImagePreviews';
import { 
  required, 
  length, 
  acceptableFile,
  acceptableFiles,
 } from '../../../util/validators';
import {
  generateBase64FromImage, 
  isImageFile, 
  isVideoFile,
  // resizeImageFile,
  checkFileNumberLimit,
  checkFileSizesLimit,
  isVideoUploaded,
  isPerviousVideoExist,
  generateBase64ImageData,
  createCompressedImage,
}
  from '../../../util/image';
import { BASE_URL } from '../../../App';
import './FeedEdit.css'

const POST_FORM = {
  title: {
    value: '',
    valid: false,
    touched: false,
    validators: [required, length({ min: 1 })]
  },
  image: {
    value: '',
    valid: false,
    touched: false,
    // validators: [required, acceptableFile]
    validators: [acceptableFile]
  },
  content: {
    value: '',
    valid: false,
    touched: false,
    validators: [required, length({ min: 1 })]
  },
  public: {
    // value: 'private',
    value: 'public',
    valid: true,
    touched: false,
    validators: [required]
  },
  imageUrl: {
    value: '',
    valid: true,
    touched: false,
    validators: [required]
  },
  imagePaths: {
    value: [],
    valid: true,
    touched: false,
    validators: [required]
  }
};

class FeedEdit extends Component {

  state = {
    postForm: POST_FORM,
    formIsValid: false,
    imagePreview: null,
    imagePreviews: [],
    publicValue: '',
    showDeleteModal: false,
    contentInput: '',
    contentInputChanged: false,
    // contentChangeNum: 0,
    previousPostForm: POST_FORM,
    formInputChanged: false,
    imageUploading: false,
  };

  componentDidUpdate(prevProps, prevState) {
    console.log('FeedEdit-props', this.props)
    // console.log(prevProps, prevState);
    // console.log(this.state.postForm);
    if (
      this.props.editing &&
      prevProps.editing !== this.props.editing &&
      prevProps.selectedPost !== this.props.selectedPost
    ) {
      const postForm = {
        title: {
          ...prevState.postForm.title,
          value: this.props.selectedPost.title,
          valid: true
        },
        image: {
          ...prevState.postForm.image,
          value: this.props.selectedPost.imagePath,
          valid: true
        },
        content: {
          ...prevState.postForm.content,
          value: this.props.selectedPost.content,
          valid: true
        },
        public: {
          ...prevState.postForm.public,
          value: this.props.selectedPost.public,
          valid: true
        },
        imageUrl: {
          ...prevState.postForm.imageUrl,
          value: this.props.selectedPost.imageUrl,
          valid: true,
        },
        imagePaths: {
          ...prevState.postForm.imagePaths,
          value: this.props.selectedPost.imagePaths,
          valid: true,
        }
      };
      // console.log(postForm);
      this.setState({ 
        postForm: postForm, 
        formIsValid: true,
        previousPostForm: postForm
       });
    }

    if (this.props.imageDeleted) {
      setTimeout(() => {
        console.log('in componentdidupdate');
        this.hideDeleteModalHandler();
        this.props.imageDeletedHandler(null);

      }, 1000 * 3);
    }

  }

  publicChangeHandler = (event) => {
    console.log(event.target);
    this.setState({
      publicValue: event.target.value
    }, () => {
      this.postInputChangeHandler('public', this.state.publicValue);
    });
  }

  postInputChangeHandler = async (input, value, files) => {
    console.log(input, value, files);

    // if(input ==='content') {
    //   // this.setState({ contentChangeNum: this.state.contentChangeNum + 1 });
    // }

    let image;
    const imageFiles = [];

    if (files) {
      console.log('files', files);
      // if (files[0].type.split('/')[0] === 'image' 
      //   && files[0].size > 300 * 10**3) {
      //   const fileType = files[0].type.split('/')[1];
      //   const imageBlob = await resizeImageFile(files[0], fileType);
      //   image = new File([imageBlob], files[0].name, {type: files[0].type, lastModified: Date.now()});
      // } else {
      //   image = files[0];
      // }
      // console.log(image, files[0]);

      // generateBase64ImageData(image)
      // // generateBase64FromImage(files[0])
      //   .then(data => {
      //     // console.log(data);
      //     this.setState({ imagePreview: data.base64 });
      //   })
      //   .catch(e => {
      //     this.setState({ imagePreview: null });
      //   });


      this.setState({ imageUploading : true });




      const b64Images = [];

      for (const file of files) {

        if (file.type.split('/')[0] === 'image' 
          && file.size > 1000 * 10**3) {
          // const fileType = file.type.split('/')[1];
          // const imageBlob = await resizeImageFile(file, fileType);
          // image = new File([imageBlob], file.name, {type: file.type, lastModified: Date.now()});
          // console.log('resized image', image);


          const compImg = await createCompressedImage(file);
          
          if (compImg && compImg.size < file.size) {
            image = new File([compImg], file.name, {type: file.type, lastModified: Date.now()});
            console.log('compImg', compImg);
            // console.log('compFile', compFile);
          }

          
          
          if (image && image.size >= file.size) {
            image = file;
          }

        } else {
          image = file;
        }

        imageFiles.push(image);

        // generateBase64ImageData(file)
        // generateBase64ImageData(image)
        generateBase64FromImage(image)
          .then(data => {
            // console.log(data);

            b64Images.push(data);
            this.setState({ imagePreviews: b64Images });
          })
          .catch(e => {
            this.setState({ imagePreviews: [] });
          });
      }



    }
    this.setState(prevState => {
      // console.log(prevState);
      let isValid = true;
      for (const validator of prevState.postForm[input].validators) {
        // console.log(validator);
        // console.log(value);
        isValid = isValid && validator(value);
      }
      // console.log(prevState.postForm);
      const updatedForm = {
        ...prevState.postForm,
        [input]: {
          ...prevState.postForm[input],
          valid: isValid,
          // value: files ? files[0] : value
          // value: image ? image : value
          // value: files ? files : value
          value: imageFiles.length > 0 ? imageFiles : value
        },
      };
      // console.log(updatedForm);
      let formIsValid = true;
      for (const inputName in updatedForm) {
        formIsValid = formIsValid && updatedForm[inputName].valid;
      }


      // console.log(input, value, files, acceptableFile(value));
      updatedForm.image.valid = true;

      if (files) {
        updatedForm.image.valid = acceptableFile(value);
        


        const isAcceptableFiles = acceptableFiles(files);
        const passFileSizesLimit = checkFileSizesLimit(files);

        const totalFileNum = files.length + updatedForm.imagePaths.value.length;
        const isFileNumOk = checkFileNumberLimit(totalFileNum);
        

        if (isFileNumOk && isAcceptableFiles && passFileSizesLimit) {
          updatedForm.image.valid = true;
        } else {
          updatedForm.image.valid = false;
        }

        //// video file case, only 1 file accept
        const isVideoExist = isVideoUploaded(files);
        

        let isPreviousVideo = false;

        if (updatedForm.imagePaths && updatedForm.imagePaths.value.length > 0) {
          isPreviousVideo = isPerviousVideoExist(updatedForm.imagePaths.value);
        }

        console.log('isPreviousVideo', isPreviousVideo);

        if ((isVideoExist && files.length > 1) || isPreviousVideo) {
          updatedForm.image.valid = false;
        }
      }

      console.log(updatedForm);
      // formIsValid = true

      this.checkInputChanges(updatedForm);

      return {
        postForm: updatedForm,
        formIsValid: formIsValid,
        imageUploading: false,
      };
    });
  };

  inputBlurHandler = input => {
    this.setState(prevState => {
      return {
        postForm: {
          ...prevState.postForm,
          [input]: {
            ...prevState.postForm[input],
            touched: true
          }
        }
      };
    });
  };

  cancelPostChangeHandler = () => {
    console.log('this.state.formInputChanged',this.state.formInputChanged)

    const selectedPostId = localStorage.getItem('selectedPostId');

    if (this.state.formInputChanged) {
      const closeConfirm = window.confirm(
        `
        Your inputs are changed.
        Is it no problem to close without saving inputs? 
        `)

      if (closeConfirm) {
        this.setState({
          postForm: POST_FORM,
          formIsValid: false,
          imagePreview: null,
          imagePreviews: [],
        });
        this.props.onCancelEdit();

        //// delete selectedId, edit from single postpage
        if (selectedPostId) {
          this.props.history.push(`/feed/${selectedPostId}`);
          localStorage.removeItem('selectedPostId');
        }
      }
      
    } else {
      this.setState({
        postForm: POST_FORM,
        formIsValid: false,
        imagePreview: null,
        imagePreviews: [],
      });
      this.props.onCancelEdit();

      //// delete selectedId, edit from single postpage
      if (selectedPostId) {
        this.props.history.push(`/feed/${selectedPostId}`);
        localStorage.removeItem('selectedPostId');
      }
    }



    // this.setState({
    //   postForm: POST_FORM,
    //   formIsValid: false,
    //   imagePreview: null,
    //   imagePreviews: [],
    // });
    // this.props.onCancelEdit();
  };

  acceptPostChangeHandler = () => {
    const post = {
      title: this.state.postForm.title.value,
      image: this.state.postForm.image.value,
      imageUrl: this.state.postForm.imageUrl.value,
      content: this.state.postForm.content.value,
      public: this.state.postForm.public.value,
      imagePaths: this.state.postForm.imagePaths.value,
    };
    this.props.onFinishEdit(post);
    this.setState({
      postForm: POST_FORM,
      formIsValid: false,
      imagePreview: null,
      imagePreviews: [],
    });

    // delete selectedId, edit from single postpage
    const selectedPostId = localStorage.getItem('selectedPostId');
    if (selectedPostId) {
      localStorage.removeItem('selectedPostId');
    }
  };

  showDeleteModalHandler = () => {
    this.setState({ showDeleteModal: !this.state.showDeleteModal });
  };
  hideDeleteModalHandler = () => {
    this.setState({ showDeleteModal: false });
  };

  // contentInputChangeHandler = (input, value) => {
  //   this.setState({ contentInput: value }, () => {
  //     console.log(this.state.contentInput);
  //   });
  //   // console.log(commentInput);
  // }
  getInputHandler = (input) => {
    if (this.props.selectedPost) {
      // console.log(this.props.selectedPost.content);
      console.log(input);
      // const previousContent = this.props.selectedPost.content;
      
      if (input || (!input && this.state.contentInputChanged)) {
        this.setState({ 
          contentInput: input,
          contentInputChanged: true
        }, () => {
          console.log(this.state.contentInput);
          this.postInputChangeHandler('content', this.state.contentInput);
        });
      }
    } else {
      this.setState({ 
        contentInput: input,
        contentInputChanged: true
      }, () => {
        console.log(this.state.contentInput);
        this.postInputChangeHandler('content', this.state.contentInput);
      });
    }

  }

  checkInputChanges = (postForm) => {
    const previousForm = this.state.previousPostForm;
    if (previousForm.title.value !== postForm.title.value ||
        previousForm.image.value !== postForm.image.value ||
        previousForm.content.value !== postForm.content.value ||
        previousForm.public.value !== postForm.public.value
    ) {
      this.setState({
        formInputChanged: true
      });
      // return true;
    }
    else {
      this.setState({
        formInputChanged: false
      });
      // return false;
    }
  }


  render() {
    const { t } = this.props;


    let imagePreviewBody;
    // console.log(this.state.imagePreview);
    if (this.state.imagePreview) {
      if (this.state.imagePreview.split('/')[0] === 'data:image') {
        imagePreviewBody = (
          <div>
            <img src={this.state.imagePreview} height="100" alt=""></img>
          </div>);
      }
      if (this.state.imagePreview.split('/')[0] === 'data:video') {
        imagePreviewBody = (
          <div>
            <video src={this.state.imagePreview} height="100" controls></video>
          </div>);
      }
    } else {
      let selectedImageType;
      if (this.props.selectedPost) {
        // console.log(this.props.selectedPost);
        if (this.props.selectedPost.modifiedImageUrl) {
          // selectedImageType = this.props.selectedPost.modifiedImageUrl.split('.').pop();
          
          const imagePlace = this.props.selectedPost.modifiedImageUrl.split('?')[0];
          selectedImageType = imagePlace.split('.')[imagePlace.split('.').length - 1].toLowerCase();
          console.log(selectedImageType);
        }

        if (isImageFile(selectedImageType)) {
          imagePreviewBody = (
            <div>
              {/* <img src={BASE_URL + '/' + this.props.selectedPost.imageUrl} height="100" alt=""></img> */}
              <img src={this.props.selectedPost.modifiedImageUrl} height="100" alt=""></img>
            </div>
          );
        }

        if (isVideoFile(selectedImageType)) {
          imagePreviewBody = (
            <div>
              {/* <video src={BASE_URL + '/' + this.props.selectedPost.imageUrl} height="100" controls></video> */}
              
              <video src={this.props.selectedPost.imageUrl} height="100" controls></video>
              {/* <video src={this.props.selectedPost.modifiedImageUrl} height="100" controls></video> */}
              {/* <img src={this.props.selectedPost.thumbnailImageUrl} height="100" alt=""></img> */}
            </div>
          );
        }
      }

    }

    // let imagePreviewsBody;
    // if (this.state.imagePreviews.length > 0) {
    //   imagePreviewsBody = (
    //   <ul className="feedEdit__imagePreviews">
    //     {this.state.imagePreviews.map(imagePreview => {
    //       let imagePreviewBody;
    //       if (imagePreview.split('/')[0] === 'data:image') {
    //         imagePreviewBody = (
    //           <span>
    //             <img
    //               src={imagePreview} height="" alt="pictures of previews" 
    //             />
    //           </span>
    //         );
    //       }
    //       if (imagePreview.split('/')[0] === 'data:video') {
    //         imagePreviewBody = (
    //           <span>
    //             <video src={imagePreview} height=""></video>
    //           </span>
    //         );
    //       }

    //       return (imagePreviewBody);
    //     })}
    //   </ul>)
    // }

    let imageDeleteElement;
    if (
      !this.state.postForm.image.value.name &&
      this.state.postForm.image.value  &&
      this.state.postForm.image.value !== 'undefined' &&
      this.state.postForm.image.value !== 'deleted'
    ) {
      imageDeleteElement = (
        <div>
          <Button mode="flat" design="danger"
            disabled={this.props.postsLoading || this.state.showDeleteModal}
            onClick={(event) => {
              event.preventDefault();
              this.showDeleteModalHandler();
            }}
          >
            Delete
            {t('feed.text17')}
          </Button>

        </div>
      );
    }

    let deleteModalElement;
    if (this.state.showDeleteModal) {
      deleteModalElement = (
        <div>
          {
            !this.state.postForm.image.value.name &&
            this.state.postForm.image.value  &&
            this.state.postForm.image.value !== 'undefined' &&
            this.state.postForm.image.value !== 'deleted'
            ?
            <div>
              <div className="feedEdit__deleteConfirm">
                {/* Is it no problem to delete image completely? */}
                {t('feed.text18')}
              </div>

              <Button mode="flat" design="danger"
                disabled={this.props.postsLoading}
                onClick={this.hideDeleteModalHandler}>
                {/* Cancel */}
                {t('general.text1')}
              </Button>
              <Button mode="raised" design=""
                disabled={this.props.postsLoading}
                onClick={(event) => {
                  event.preventDefault();
                  this.props.deletePostImageHandler(this.props.selectedPost._id)
                    .then(result => {
                      console.log(result);
                      this.postInputChangeHandler('image', 'deleted');
                    })
                    .catch(err => {
                      console.log(err);
                    });
                }}
              >
                {/* Delete */}
                {t('feed.text17')}
              </Button>
            </div>
            : null
          }

          {this.props.postsLoading ? <div><Loader /></div> : null}

          {this.props.imageDeleted ?
            <div className="feedEdit__deleteConfirm">
              {/* Deleted */}
              {t('feed.text19')}
            </div>
            : null
          }

        </div>
      );
    }


    return this.props.editing ? (
      <Fragment>
        <Backdrop onClick={this.cancelPostChangeHandler} />
        <Modal
          title=""
          acceptEnabled={this.state.formIsValid}
          onCancelModal={this.cancelPostChangeHandler}
          onAcceptModal={this.acceptPostChangeHandler}
          isLoading={this.props.loading}
        >
          <form>
            <Input
              id="title"
              // label="Title"
              label={t('feed.text10')}
              control="input"
              // placeholder="Title for post"
              placeholder={t('feed.text15')}
              onChange={this.postInputChangeHandler}
              onBlur={this.inputBlurHandler.bind(this, 'title')}
              valid={this.state.postForm['title'].valid}
              touched={this.state.postForm['title'].touched}
              value={this.state.postForm['title'].value}
            />
            <FilePicker
              id="image"
              label="Media File"
              // label={t('feed.text11')}
              control="input"
              onChange={this.postInputChangeHandler}
              onBlur={this.inputBlurHandler.bind(this, 'image')}
              valid={this.state.postForm['image'].valid}
              touched={this.state.postForm['image'].touched}
            />

            <span className="feedEdit__aboutMediaFile">
              {/* think about later about size video and web thing */}
              {/* (Media File should be jpg, jpeg, png, mp4 file, and less than 3MB) */}
              {/* (Media File should be jpg, jpeg, png, mp4 file) */}
              {/* (Media File should be jpg, jpeg, png file, less than 1MB, up to 6 files) */}
              {/* (Image files should be jpg, jpeg, png file, up to 6 files (Image will be resized when file size exceed 1MB)) */}
              (Image files should be jpg, jpeg, png file, less than 5MB, up to 6 files (Images with more than 1400px of width or height will be resized))
            </span>

            {/* <div className="new-post__preview-image">
              {imagePreviewBody}
            </div> */}

            {/* <div className="">
              {imagePreviewsBody}
            </div> */}

            <div>
              <ImagePreviews 
                imagePreviews={this.state.imagePreviews}
                modifiedImageUrls={this.props.selectedPost ? this.props.selectedPost.modifiedImageUrls : []}
                modifiedImagePaths={this.props.selectedPost ? this.props.selectedPost.modifiedImagePaths : []}
              />
            </div>

            {this.state.imageUploading && <Loader />}

            {/* <div className="feedEdit__deleteImageElements">
              {imageDeleteElement}
              {deleteModalElement}
            </div> */}


            {/* <Input
              id="content"
              // label="Content"
              label={t('feed.text12')}
              // placeholder="Content for post"
              placeholder={t('feed.text16')}
              control="textarea"
              rows="4"
              onChange={this.postInputChangeHandler}
              onBlur={this.inputBlurHandler.bind(this, 'content')}
              valid={this.state.postForm['content'].valid}
              touched={this.state.postForm['content'].touched}
              value={this.state.postForm['content'].value}
            /> */}

            <InputEmoji
              id="content"
              // label="Content"
              label={t('feed.text12')}
              // placeholder="Content for post"
              placeholder={t('feed.text16')}
              control="textarea"
              rows="4"
              onChange={this.postInputChangeHandler}
              // onChange={() => {
              //   this.contentInputChangeHandler('', this.state.contentInput);
              // }}
              onBlur={this.inputBlurHandler.bind(this, 'content')}
              valid={this.state.postForm['content'].valid}
              touched={this.state.postForm['content'].touched}
              value={this.state.postForm['content'].value}
              // value={this.state.contentInput}
              getInput={this.getInputHandler}
              previousContentInput={this.props.selectedPost && this.props.selectedPost.content}
              // contentChangeNum={this.state.contentChangeNum}
            />

            <div>
              <input type="radio" id="huey" name="drone" value="public"
                onChange={this.publicChangeHandler}
              // checked  
              />
              <label for="huey">
                {/* public post */}
                {t('feed.text21', 'public post')}
              </label>
              <input type="radio" id="huey" name="drone" value="private"
                onChange={this.publicChangeHandler}
              />
              <label for="huey">
                {/* draft post */}
                {t('feed.text25', 'draft post')}
              </label>
            </div>

          </form>
        </Modal>
      </Fragment>
    ) : null;
  }
}

export default withI18n()(FeedEdit);
// export default FeedEdit;
