import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from './FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SIdebar from '../comps/SIdebar';
import PostModal from '../comps/PostModal';
import moment from 'moment'

import { io } from 'socket.io-client';
import ViewPost from '../comps/ViewPost';
import CommentModal from '../comps/CommentModal';
import gsap from 'gsap';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewLikes from '../comps/ViewLikes';

const socket = io('http://localhost:8080', {
  reconnection: true
})






const System = () => {
  const nav = useNavigate();
  const [userId, setUserId] = useState('');



  useEffect(() => {
    document.title = 'Feed';
    const unsub = onAuthStateChanged(authentication, (user) => {
      if (user) {
        setUserId(user.uid);
        nav('/feed')
      } else {
        console.log('no user');
        nav('/');
      }
    });

    return () => {
      unsub();
    };
  }, []);


  const [filteredAcc, setFiltered] = useState([]);
  const [nonFiltered, setNonFiltered] = useState([])

  useEffect(() => {
    axios
      .get('http://localhost:8080/getAccs')
      .then((res) => {
        const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
        setFiltered(filteredUsers);
        setNonFiltered(res.data)
      })
      .catch((err) => {
        console.log(err);
      });
  }, [filteredAcc]);

  const [boolRender, setBoolRend] = useState(false);

  const handlePostModalClose = () => {
    setBoolRend(false);
  };

  //posts endpoint
  const [posts, setPosts] = useState([])

  useEffect(() => {
    axios.get('http://localhost:8080/getPosts')
      .then((res) => {
        const randomizedData = res.data.slice().sort(() => Math.random() - 0.5);
        setPosts(randomizedData);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });

    const handlePostLiked = (data) => {
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post._id === data.PostID) {
            return {
              ...post,
              Up: [...post.Up, { Uid: userId }]
            };
          }
          return post;
        });
      });
    };

    const handlePostUnliked = (data) => {
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post._id === data.PostID) {
            return {
              ...post,
              Up: post.Up.filter(user => user.Uid !== userId)
            };
          }
          return post;
        });
      });
    };



    const DownLiked = (data) => {
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post._id === data.PostID) {
            return {
              ...post,
              Down: [...post.Down, { Uid: userId }]
            };
          }
          return post;
        });
      });
    };

    const unlikeDown = (data) => {
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post._id === data.PostID) {
            return {
              ...post,
              Down: post.Down.filter(user => user.Uid !== userId)
            };
          }
          return post;
        });
      });
    };



    const handlePostDeletion = (data) => {
      const { itemId } = data;

      setPosts((prevPosts) => prevPosts.filter(post => post._id !== itemId));
    };




    // Set up event listeners for 'postLiked' and 'postUnliked' events
    socket.on('postLiked', handlePostLiked, DownLiked);
    socket.on('postUnliked', handlePostUnliked, DownLiked);
    socket.on('DownLiked', DownLiked, handlePostLiked);
    socket.on('downUnliked', unlikeDown, handlePostLiked);

    socket.on('deletePost', handlePostDeletion);
    // Clean up event listeners
    return () => {
      socket.off('postLiked', handlePostLiked);
      socket.off('postUnliked', handlePostUnliked);
      socket.off('DownLiked', DownLiked);
      socket.off('downUnliked', unlikeDown);

      socket.off('deletePost', handlePostDeletion);
    };
  }, [userId]);





  const userObj = {
    Email: filteredAcc[0] && filteredAcc[0].Email,
    Fullname: filteredAcc[0] && filteredAcc[0].Fullname,
    Username: filteredAcc[0] && filteredAcc[0].Username,
    Uid: filteredAcc[0] && filteredAcc[0].Uid,
  }



  const [likeNum, setLikeNum] = useState(0);
  const [prevPostId, setPrevPostId] = useState('');
  const [lastLikeTime, setLastLikeTime] = useState(0);
  const likeThrottleTime = 2000; // Time in milliseconds to wait before allowing another like

  const likePost = (postId) => {
    const currentTime = Date.now();

    // Check if the user is trying to like the same post within the throttle time
    if (postId === prevPostId && currentTime - lastLikeTime < likeThrottleTime) {
      console.log('You are liking too fast! Please wait a moment.');
      return;
    }

    // Update the last like time and the post ID
    setLastLikeTime(currentTime);
    setPrevPostId(postId);
    setLikeNum((prevNum) => prevNum + 1);

    axios.post('http://localhost:8080/likePost', {
      userObj: userObj,
      PostID: postId,
    })
      .then(() => {
        console.log('Liked successfully');
      })
      .catch((err) => {
        console.log(err);
      });
  };


  const unLikePost = (postId) => {
    axios.post('http://localhost:8080/unlikePost', {
      userID: userObj.Uid,
      PostID: postId
    }).then(() => {
      console.log('unliked successfully')
    }).catch((err) => {
      console.log(err)
    })
  }


  const [likeNums, setLikeNums] = useState(0);
  const [prevPostIds, setPrevPostIds] = useState('');
  const [lastLikeTimes, setLastLikeTimes] = useState(0);
  const likeThrottleTimes = 2000; // Time in milliseconds to wait before allowing another like



  const downLike = (postId) => {

    const currentTime = Date.now();

    // Check if the user is trying to like the same post within the throttle time
    if (postId === prevPostIds && currentTime - lastLikeTimes < likeThrottleTimes) {
      console.log('You are liking too fast! Please wait a moment.');
      return;
    }

    // Update the last like time and the post ID
    setLastLikeTimes(currentTime);
    setPrevPostIds(postId);
    setLikeNums((prevNum) => prevNum + 1);

    axios.post('http://localhost:8080/DownLike', {
      userObj: userObj,
      PostID: postId,
    })
      .then(() => {
        console.log('Down Liked successfully');
      })
      .catch((err) => {
        console.log(err);
      });
  };


  const downUnliked = (postId) => {
    axios.post('http://localhost:8080/unlikeDown', {
      userID: userObj.Uid,
      PostID: postId
    }).then(() => {
      console.log('unliked successfully')
    }).catch((err) => {
      console.log(err)
    })
  }

  const [postIdForModal, setPostId] = useState('')

  const handleTransferId = (transferedId) => {
    nav(`/post/${transferedId}`)
  }

  const [openComm, setOpenComm] = useState(false)
  const [postObjs, setPostObj] = useState([])

  const handleTransferPost = (itm) => {

    setPostObj(
      posts.filter((postItem =>
        postItem.postId === itm.postId)
      ))
    setOpenComm(true)

  }
  const pfpPath = filteredAcc[0] && filteredAcc[0].Pfp ? require(`../profiles/${filteredAcc[0].Pfp}`) : null;


  const returnPfpOfUser = (userIden) => {
    const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)

    if (filteredUserForProfile[0]) {
      return require(`../profiles/${filteredUserForProfile[0] ? filteredUserForProfile[0].Pfp : ''}`)
    }
  }


  const deleteNotif = () => {
    toast.success('Post Successfully Deleted!', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }


  const deletePost = (postId) => {
    axios.delete(`http://localhost:8080/deletePost/${postId}`)
      .then(() => { deleteNotif() })
      .catch((err) => { console.log(err) })
  }


  const [openMenuEl, setOpenMenuEl] = useState('')
  const [closeMenuEl, setCloseMenuEl] = useState(false)
  const [isDelete, setDelete] = useState(false)

  const menuEL = useRef(null)

  const openMenu = (postId) => {
    setOpenMenuEl(postId)
    setCloseMenuEl(true)
  }

  useEffect(() => {
    if (openMenuEl) {
      gsap.to(menuEL.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      })
    }

  }, [openMenuEl, closeMenuEl])

  const removeMenuEl = () => {
    if (closeMenuEl) {

      gsap.to(menuEL.current, {
        scale: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          setOpenMenuEl('')
        }
      })

    }
  }

  const openConfirmation = () => {
    setDelete(true)
  }


  const [postIDForLike, setPostIdForLike] = useState('')
  const [LikeAndDislikesObj, setLikesAndDislikes] = useState({ Likes: [], Dislikes: [] });


  useEffect(() => {

    const filteredPost = posts.find((itm) => itm._id === postIDForLike);
    if (filteredPost) {
      setLikesAndDislikes(({
        Likes: filteredPost?.Up,
        Dislikes: filteredPost?.Down,
      }));
    } else {
      console.log("Post not found");
    }


  }, [postIDForLike]);


  const handlePostModalCloseForLikes = () => {
    setPostIdForLike('')
  }

  return (


    <div
      onClick={() => { removeMenuEl() }}
      className="System closer">
      <Header userObj={filteredAcc} />
      <ToastContainer />
      {
        openComm ?
          <CommentModal
            setOpenComm={setOpenComm}
            postObj={postObjs}
          />
          :
          <></>
      }

      <div className="content">
        <SIdebar />
        <div className="feed">

          {boolRender && (
            <div className="con" onClick={handlePostModalClose}>
              <PostModal onClose={handlePostModalClose} />
            </div>
          )}


          {postIDForLike && (
            <div className="con" onClick={() => { setPostIdForLike('') }}>
              <ViewLikes
                LikesAndDislikes={LikeAndDislikesObj}
                onClose={handlePostModalCloseForLikes} />
            </div>
          )}

          {
            filteredAcc[0] && posts ?
              <>
                <div className="urPost">
                  <div className="first">
                    <div className="pfp">
                      <img src={pfpPath} alt="" />
                    </div>
                    <input
                      readOnly
                      type="text"
                      placeholder="What's on your mind?"
                      onClick={() => {
                        setBoolRend((prevRen) => !prevRen);
                      }}
                    />
                  </div>
                  <button>post</button>
                </div>

                <div className="postCon">

                  {posts.length === 0 &&
                    <div className="noPost">
                      No post yet
                    </div>
                  }
                  {filteredAcc && posts.map((itm) => (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTransferId(itm._id)
                      }}
                      className="postItem"
                      key={itm._id}
                    >


                      {/* menu ellipsis */}
                      {
                        itm._id === openMenuEl &&
                        <div
                          ref={menuEL}
                          onClick={
                            (e) => {

                              e.stopPropagation()
                              setOpenMenuEl(itm._id)
                            }}
                          className="menuEl">
                          {itm.userObj.Uid === userId ?
                            <>

                              {
                                isDelete ?
                                  <div
                                    onClick={(e) => { e.stopPropagation() }}
                                    className="deleteCon">
                                    <div
                                      onClick={() => { deletePost(itm._id) }}
                                      className="delBtn">
                                      <ion-icon name="checkmark-outline"></ion-icon>  Confirm
                                    </div>
                                    <div
                                      onClick={() => { setDelete(false) }}
                                      className="delBtn">
                                      <ion-icon name="close-outline"></ion-icon> Cancel
                                    </div>
                                  </div>
                                  :
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openConfirmation()
                                    }}
                                    className="del menuElBtn">
                                    <ion-icon name="trash-outline"></ion-icon>Delete
                                  </div>
                              }
                              {
                                !isDelete &&
                                <div
                                  onClick={() => { alert("In development, Please wait") }}
                                  className="edit menuElBtn">
                                  <ion-icon name="create-outline"></ion-icon>Edit
                                </div>
                              }
                            </>
                            :
                            <></>
                          }
                          {
                            !isDelete &&
                            <div
                              onClick={() => { alert("In development, Please wait") }}
                              className="report menuElBtn">
                              <ion-icon name="document-lock-outline"></ion-icon>Report
                            </div>
                          }
                        </div>
                      }



                      <div
                        className="upperPost"
                      >
                        <div className="pfp">
                          <img src={returnPfpOfUser(itm.userObj.Uid)} alt="" />
                        </div>
                        <div className="PostContent">
                          <div className="first">
                            <div className="firstContainer">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  nav(`/SearchedUser/${itm.userObj.Uid}`)

                                }}
                                className="userName">
                                {itm.userObj && itm.userObj.Username}
                              </div>
                              <div className="Date">
                                {moment(new Date(parseInt(itm.Date, 10))).fromNow()}
                              </div>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                openMenu(itm._id)
                              }}
                              className="menuOpen">
                              <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                            </div>
                          </div>
                          <div className="name">
                            {itm.userObj && itm.userObj.Fullname}
                          </div>
                          <div className="textContent">
                            {itm && itm.TextContent}
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents event from reaching the parent
                        }}
                        className="lowerPost"
                      >
                        {itm.Up && itm.Up.some(user => user.Uid === userId) ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents event from reaching the parent
                              unLikePost(itm._id);
                              downUnliked(itm._id); // Ensure Down like is removed if present
                            }}
                            className={`Up liked lowerPostItem`}
                          >
                            <ion-icon name="arrow-up-outline"></ion-icon>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents event from reaching the parent
                              likePost(itm._id);
                              downUnliked(itm._id); // Remove Down like if Up is clicked
                            }}
                            className={`Up lowerPostItem`}
                          >
                            <ion-icon name="arrow-up-outline"></ion-icon>
                          </div>
                        )}

                        {itm.Down && itm.Down.some(user => user.Uid === userId) ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents event from reaching the parent
                              downUnliked(itm._id);
                              unLikePost(itm._id); // Ensure Up like is removed if present
                            }}
                            className={`Down liked lowerPostItem`}
                          >
                            <ion-icon name="arrow-down-outline"></ion-icon>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents event from reaching the parent
                              downLike(itm._id);
                              unLikePost(itm._id); // Remove Up like if Down is clicked
                            }}
                            className={`Down lowerPostItem`}
                          >
                            <ion-icon name="arrow-down-outline"></ion-icon>
                          </div>
                        )}

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransferPost(itm)
                          }}
                          className="Comment lowerPostItem"
                        >
                          <ion-icon name="chatbox-outline"></ion-icon>
                        </div>


                        <div
                          className="Repost lowerPostItem"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents event from reaching the parent
                            // Add logic for repost click if needed
                          }}
                        >
                          <ion-icon name="open-outline"></ion-icon>
                        </div>
                      </div>
                      <div className="count">
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            setPostIdForLike(itm._id)
                          }}
                          className="likes countBtn">
                          {itm.Up.length + `${itm.Up.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                            itm.Down.length + `${itm.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                        </div>
                        <div className="replies countBtn">
                          {", " + itm.Comments.length + `${itm.Comments.length > 1 ? ' Comments' : ' Comment'}`}
                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              </>
              :
              <div className="systemLoading">
                <div className="smallCon"></div>
                <div className="largeCons"></div>
                <div className="largeCons"></div>
                <div className="largeCons"></div>
              </div>
          }
        </div>
        <div className="friends">
          Chat with your followers
        </div>
      </div>
    </div>
  );
};

export default System;
