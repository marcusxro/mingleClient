import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from './FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import SIdebar from '../comps/SIdebar';
import PostModal from '../comps/PostModal';
import moment from 'moment'
import { io } from 'socket.io-client';
import CommentModal from '../comps/CommentModal';
import ReplyModal from '../comps/ReplyModal';
import ViewReplies from '../comps/ViewReplies';
import ReplyToReply from '../comps/ReplyToReply';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import gsap from 'gsap';
import ViewLikes from '../comps/ViewLikes';
const socket = io('http://localhost:8080', {
    reconnection: true
})

const ViewedPost = () => {

    const nav = useNavigate();
    const [userId, setUserId] = useState('');
    const paramsNav = useParams()
    const [feedName, setFeedName] = useState('')
    const [post, setPost] = useState([])

    useEffect(() => {
        document.title = feedName
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid);
                nav(`/post/${paramsNav.ID}`)
            } else {
                console.log('no user');
                nav('/');
            }
        });

        return () => {
            unsub();
        };
    }, [feedName]);


    const [filteredAcc, setFiltered] = useState([]);
    const [nonFiltered, setNonFiltered] = useState([])

    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                setNonFiltered(res.data)
                const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
                setFiltered(filteredUsers);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredAcc]);

    useEffect(() => {
        axios.get('http://localhost:8080/getPosts')
            .then((res) => {
                const filteredPostById = res.data.filter(itm => itm._id === paramsNav.ID)
                setPost(filteredPostById);
                setFeedName(`@ ${post[0]?.userObj.Username} | ${post[0]?.TextContent}`)

            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });
    }, [paramsNav.ID, post, feedName])

    useEffect(() => {
        const handlePostLiked = (data) => {
            setPost(prevPosts => {
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
            setPost(prevPosts => {
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
            setPost(prevPosts => {
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
            setPost(prevPosts => {
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
        const handleNewReply = (data) => {
            setPost(prevPosts => {
                return prevPosts.map(post => {
                    if (post._id === data.PostID) {
                        const updatedComments = post.Comments.map(comment => {
                            if (comment.Date === data.DateUid) {
                                return {
                                    ...comment,
                                    Replies: [...comment.Replies, data.repliedSchema]
                                };
                            }
                            return comment;
                        });
                        return {
                            ...post,
                            Comments: updatedComments
                        };
                    }
                    return post;
                });
            });
        };
        const replyDeleted = (data) => {
            setPost(prevPosts => {
                return prevPosts.map((post) => {
                    if (post._id === data.postID) {
                        // Map through the comments to find the correct comment and update it
                        const updatedComments = post.Comments.map(comment => {
                            if (comment.Date === data.commentID) {
                                // Filter out the deleted reply
                                const updatedReplies = comment.Replies.filter((reply) => reply.Date !== data.replyID);
                                return {
                                    ...comment,
                                    Replies: updatedReplies
                                };
                            }
                            return comment;
                        });
                        return {
                            ...post,
                            Comments: updatedComments
                        };
                    }
                    return post;
                });
            });
        };
        // Set up event listeners for 'postLiked' and 'postUnliked' events
        socket.on('postLiked', handlePostLiked, DownLiked);
        socket.on('replyToPost', handleNewReply);

        socket.on('postUnliked', handlePostUnliked, DownLiked);
        socket.on('DownLiked', DownLiked, handlePostLiked);
        socket.on('downUnliked', unlikeDown, handlePostLiked);

        socket.on('deleteReply', replyDeleted);
        // Clean up event listeners
        return () => {
            socket.off('postLiked', handlePostLiked);
            socket.off('replyToPost', handleNewReply);
            socket.off('postUnliked', handlePostUnliked);
            socket.off('DownLiked', DownLiked);
            socket.off('downUnliked', unlikeDown);


            socket.off('deleteReply', replyDeleted);
        };
    }, [userId]);

    const userObj = {
        Email: filteredAcc[0]?.Email || '',
        Fullname: filteredAcc[0]?.Fullname || '',
        Username: filteredAcc[0]?.Username || '',
        Uid: filteredAcc[0]?.Uid || '',
        Pfp: filteredAcc[0]?.Pfp || '',
    };

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
            userID: userObj?.Uid,
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
            userID: userObj?.Uid,
            PostID: postId
        }).then(() => {
            console.log('unliked successfully')
        }).catch((err) => {
            console.log(err)
        })
    }

    const [openComm, setOpenComm] = useState(false)

    const commentLike = (params, commentID) => {
        console.log(commentID)
        axios.post('http://localhost:8080/commentLike', {
            userObj: userObj,
            PostID: params,
            commentID: commentID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const commentDown = (params, commentID) => {
        console.log(commentID)
        axios.post('http://localhost:8080/commentDown', {
            userObj: userObj,
            PostID: params,
            commentID: commentID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const unlikeCommentLike = (params, commentID) => {
        console.log(commentID)
        axios.post('http://localhost:8080/unlikeCommentLike', {
            userObj: userObj,
            PostID: params,
            commentID: commentID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const unlikeCommentDown = (params, commentID) => {
        console.log(commentID)
        axios.post('http://localhost:8080/unlikeCommentDown', {
            userObj: userObj,
            PostID: params,
            commentID: commentID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const renderPfp = (itm) => {
        // Check if the profile picture path exists and is valid
        if (itm?.userObj && itm?.userObj.Pfp) {
            // Construct the full path to the profile picture
            return require(`../profiles/${itm?.userObj.Pfp}`);
        }
        // Return a default or placeholder image if no profile picture is set
        return '/profiles/default.png'; // Make sure this path points to a valid default image
    };

    const returnPfpOfUser = (userIden) => {
        const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]) {
            return require(`../profiles/${filteredUserForProfile[0] ? filteredUserForProfile[0].Pfp : ''}`)
        }
    }

    const [openReply, setOpenReply] = useState('')
    const [commentObj, setCommentObj] = useState()
    const [commentPostId, setCommentPostId] = useState('')

    const findSpecificComment = (paramsDate, postIden) => {
        setOpenReply(paramsDate)
        setCommentPostId(postIden)

        axios.get('http://localhost:8080/getPosts')
            .then((res) => {
                const posts = res.data;
                const targetDate = parseInt(paramsDate, 10);

                // Filter comments based on the date provided in paramsDate
                const foundComments = [];

                for (const post of posts) {
                    if (post.Comments) {
                        for (const comment of post.Comments) {
                            if (comment.Date === targetDate) {
                                foundComments.push(comment);
                            }
                        }
                    }
                }

                setCommentObj(foundComments);

            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });

    }

    const [replyModalUid, setReplyModal] = useState('')

    const findSpecificCommentForReply = (paramsDate, postIden) => {
        setReplyModal(paramsDate)
        setCommentPostId(postIden)

        axios.get('http://localhost:8080/getPosts')
            .then((res) => {
                const posts = res.data;
                const targetDate = parseInt(paramsDate, 10);

                // Filter comments based on the date provided in paramsDate
                const foundComments = [];

                for (const post of posts) {
                    if (post.Comments) {
                        for (const comment of post.Comments) {
                            if (comment.Date === targetDate) {
                                foundComments.push(comment);
                            }
                        }
                    }
                }
                setCommentObj(foundComments);

            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });

    }

    const [postIdToView, setPostIdToView] = useState([])

    const togglePostIdToView = (commentId, postId) => {
        setPostIdToView(prevState => {
            // Check if the item already exists in the array
            const itemExists = prevState.some(
                item => item.postIdOfPost === postId && item.commentIdDate === commentId
            );

            if (itemExists) {
                // Remove the item if it exists
                return prevState.filter(
                    item => !(item.postIdOfPost === postId && item.commentIdDate === commentId)
                );
            } else {
                // Add the item if it doesn't exist
                return [...prevState, { postIdOfPost: postId, commentIdDate: commentId }];
            }
        });
    };

    const likeToReply = (params, commentID, replyID) => {

        axios.post('http://localhost:8080/likeToReply', {
            userObj: userObj,
            PostID: params,
            commentID: commentID,
            replyID: replyID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const unlikeToReply = (params, commentID, replyID) => {

        axios.post('http://localhost:8080/unlikeToReply', {
            userObj: userObj,
            PostID: params,
            commentID: commentID,
            replyID: replyID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const disikeToReply = (params, commentID, replyID) => {

        axios.post('http://localhost:8080/disikeToReply', {
            userObj: userObj,
            PostID: params,
            commentID: commentID,
            replyID: replyID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const RemDisikeToReply = (params, commentID, replyID) => {

        axios.post('http://localhost:8080/RemDislikeToReply', {
            userObj: userObj,
            PostID: params,
            commentID: commentID,
            replyID: replyID
        }).catch(() => {
            console.log("sent")
        }).then((err) => {
            console.log(err)
        })
    }

    const [replyId, setReplyId] = useState('')

    const deleteNotif = () => {
        toast.success('Post has been Successfully Deleted!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });

        setTimeout(() => {
            nav("/feed")
        }, 3000)
        //navigate to /feed afterwards
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

    const deleteCommentNotif = () => {
        toast.success('Comment has been Successfully Deleted!', {
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

    const deleteComment = (postID, commID) => {
        console.log('postID:', postID, "commentID:", commID)

        axios.post('http://localhost:8080/deleteComment', {
            postID: postID,
            commentID: commID
        }).then(() => {
            console.log("comment pulled successfully!")
            deleteCommentNotif()
        }).catch((err) => {
            console.log(err)
        })
    }

    const [replyFromId, setReplyFromId] = useState(null)

    const ReplyDeleteNotif = () => {
        toast.success('Reply has been Successfully Deleted!', {
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

    const deleteReply = async () => {
        if (!replyFromId) {
            console.log('No reply to delete');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8080/deleteReply', {
                postID: replyFromId.postInfo.postID,
                commentID: replyFromId.postInfo.commentID,
                replyID: replyFromId.postInfo.replyID
            });
            console.log('Reply pulled:', res.data);
            // Refresh or update state with this
            fetchReplies(replyFromId.postInfo.postID, replyFromId.postInfo.commentID);
            ReplyDeleteNotif()
        } catch (err) {
            console.error('Error deleting reply:', err);
        }
    };

    const getSpecificReply = (PostId, commentID, replyID) => {
        if (PostId && commentID && replyID) {
            setReplyFromId({
                postInfo: { postID: PostId, commentID: commentID, replyID: replyID }
            });
        }
    };

    useEffect(() => {
        if (replyFromId) {
            deleteReply();
        }
    }, [replyFromId]);

    const fetchReplies = async (postId, commentId) => {
        console.log('Fetching updated replies for post:', postId, 'comment:', commentId);
    };

    const [openMenuElForReply, setOpenMenuElForReply] = useState('')
    const [closeMenuElForReply, setCloseMenuElForReply] = useState(false)
    const [isDeleteForReply, setDeleteForReply] = useState(false)

    const menuELForReply = useRef(null)

    const openMenuForReply = (postId) => {
        setOpenMenuElForReply(postId)
        setCloseMenuElForReply(true)
        console.log(postId)

    }

    useEffect(() => {
        if (openMenuElForReply) {
            gsap.to(menuELForReply.current, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.inOut',
            })
        }

    }, [openMenuElForReply, closeMenuElForReply])

    const removeMenuElForReply = () => {
        if (closeMenuElForReply) {
            setOpenMenuElForReply('')
            setDeleteForReply(prevBool => !prevBool)
            gsap.to(menuELForReply.current, {
                scale: 0,
                duration: 0.3,
                ease: 'power2.inOut',
                onComplete: () => {
                    setOpenMenuEl('')
                }
            })

        }
    }

    const openConfirmationForReply = () => {
        setDeleteForReply(true)
    }

    const [postIDForLike, setPostIdForLike] = useState('')
    const [commentIden, setCommentPostIdForComm] = useState('')
    const [replyIden, setReplyIden] = useState('')
    const [LikeAndDislikesObj, setLikesAndDislikes] = useState({ Likes: [], Dislikes: [] });

    useEffect(() => {
        const filteredPost = post?.find((itm) => itm._id === postIDForLike);

        if (filteredPost && postIDForLike) {
            const filteredComments =
                filteredPost?.Comments?.filter((comms) => comms.Date === commentIden)

            const filteredReply =
                filteredComments[0]?.Replies?.filter((comms) => comms.Date === replyIden)

            const returnLikeObj = () => {

                if (postIDForLike && !commentIden && !replyIden) {
                    if (postIDForLike === filteredPost._id) {
                        return filteredPost.Up;
                    }
                }
                if (postIDForLike && commentIden && !replyIden) {
                    if (commentIden === filteredComments[0]?.Date &&
                        postIDForLike === filteredPost?._id &&
                        filteredComments[0]) {
                        return filteredComments[0]?.Likes;
                    }
                }
                if (postIDForLike && commentIden && replyIden) {
                    if (replyIden === filteredReply[0].Date &&
                        postIDForLike === filteredPost?._id &&
                        commentIden === filteredComments[0]?.Date &&
                        filteredReply[0].Likes) {

                        return filteredReply[0].Likes;
                    }
                }
            }
            const returnDislikeObj = () => {

                if (postIDForLike && !commentIden && !replyIden) {
                    if (postIDForLike === filteredPost._id) {
                        return filteredPost.Down;
                    }
                }
                if (postIDForLike && commentIden && !replyIden) {
                    if (commentIden === filteredComments[0]?.Date &&
                        postIDForLike === filteredPost?._id &&
                        filteredComments[0]) {
                        return filteredComments[0]?.Down;
                    }
                }
                if (postIDForLike && commentIden && replyIden) {
                    if (replyIden === filteredReply[0].Date &&
                        postIDForLike === filteredPost?._id &&
                        commentIden === filteredComments[0]?.Date &&
                        filteredReply[0].Dislikes) {

                        return filteredReply[0].Dislikes;
                    }
                }

            }


            console.log(returnLikeObj())
            
            setLikesAndDislikes(({
                Likes: returnLikeObj() || 0,
                Dislikes: returnDislikeObj() || 0
            }));


        } else {
            console.log("Post not found");
        }
    }, [postIDForLike, commentIden, replyIden]);



    return (
        <div
            onClick={() => {
                removeMenuEl()
                removeMenuElForReply()
            }}
            className='ViewedPost closer'>
            <Header userObj={filteredAcc} />
            <ToastContainer />
            <div className="content">
                {postIDForLike && (
                    <div className="con" onClick={() => {
                        setPostIdForLike('')
                        setCommentPostIdForComm('')
                        setReplyIden('')
                    }}>
                        <ViewLikes
                            LikesAndDislikes={LikeAndDislikesObj} />
                    </div>
                )}
                <SIdebar />
                {
                    openComm === true ?
                        <CommentModal
                            setOpenComm={setOpenComm}
                            postObj={post} />
                        :
                        <></>
                }

                {
                    openReply != '' && commentObj ?
                        <ReplyModal
                            CommentObj={commentObj}
                            setOpenReply={setOpenReply}
                            commentPostId={commentPostId} />
                        :
                        <></>
                }

                {
                    replyId != '' && commentObj ?
                        <ReplyToReply
                            CommentObj={commentObj}
                            setOpenReply={setReplyId}
                            commentPostId={commentPostId}
                            replyId={replyId}
                        />
                        :
                        <></>
                }


                <div className="midContent">
                    {
                        post[0]
                            && filteredAcc[0] ?
                            <>
                                <div
                                    className="postItem">
                                    {post.map((itm) => (
                                        <>
                                            <div className="upperPart">
                                                <div className="wrapper">
                                                    <div className="pfp">
                                                        <img src={returnPfpOfUser(itm?.userObj.Uid)} alt="" />
                                                    </div>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            nav(`/SearchedUser/${itm.userObj.Uid}`)

                                                        }}
                                                        className="name">
                                                        {itm?.userObj.Username}
                                                    </div>
                                                    <div className="Date">
                                                        {moment(new Date(parseInt(itm?.Date, 10))).fromNow()}

                                                    </div>
                                                </div>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openMenu(itm._id)
                                                    }}
                                                    className="menuOpen">
                                                    <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                </div>
                                            </div>
                                            <div className="lowerPart">
                                                {itm?.TextContent}
                                            </div>
                                            <div className="lowerPost">
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

                                                {itm.Down && itm?.Down.some(user => user.Uid === userId) ? (
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
                                                    className="Comment lowerPostItem"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenComm(true)
                                                    }}>
                                                    <ion-icon name="chatbox-outline"></ion-icon>
                                                </div>
                                                <div
                                                    className="Repost lowerPostItem"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}>
                                                    <ion-icon name="open-outline"></ion-icon>
                                                </div>
                                            </div>
                                            <div className="count">
                                                {itm.Comments.length +
                                                    `${itm?.Comments.length > 1 ? ' Comments' : ' Reply'}` + ', '}
                                                <div
                                                    onClick={() => { setPostIdForLike(itm._id) }}
                                                    className="likes">
                                                    {itm.Up.length +
                                                        `${itm?.Up.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                        itm?.Down.length +
                                                        `${itm?.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                </div>
                                            </div>
                                        </>


                                    ))}
                                </div>
                                <div className="commentSection">


                                    {post && post.map((itmz) => (
                                        itmz.Comments.length === 0 ?
                                            <div className="noComments">
                                                No comments yet <ion-icon name="chatbox3-outline"></ion-icon>
                                            </div>
                                            :
                                            itmz.Comments.map((itm) => (
                                                <div className="commentItem">
                                                    {/* menu ellipsis for comment */}

                                                    {
                                                        parseInt(itm.Date) === parseInt(openMenuElForReply) &&


                                                        <div
                                                            ref={menuELForReply}
                                                            onClick={
                                                                (e) => {

                                                                    e.stopPropagation()

                                                                }}
                                                            className="menuEl">

                                                            {itm.userObj.Uid === userId ?
                                                                <>

                                                                    {
                                                                        isDeleteForReply ?
                                                                            <div
                                                                                onClick={(e) => { e.stopPropagation() }}
                                                                                className="deleteCon">
                                                                                <div
                                                                                    onClick={() => {
                                                                                        deleteComment(post[0]._id, itm.Date)
                                                                                        setOpenMenuElForReply('')
                                                                                    }}
                                                                                    className="delBtn">
                                                                                    <ion-icon name="checkmark-outline"></ion-icon>  Confirm
                                                                                </div>
                                                                                <div
                                                                                    onClick={() => { setDeleteForReply(false) }}
                                                                                    className="delBtn">
                                                                                    <ion-icon name="close-outline"></ion-icon> Cancel
                                                                                </div>
                                                                            </div>
                                                                            :
                                                                            <div
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    openConfirmationForReply()
                                                                                }}
                                                                                className="del menuElBtn">
                                                                                <ion-icon name="trash-outline"></ion-icon>Delete
                                                                            </div>
                                                                    }
                                                                    {
                                                                        !isDeleteForReply &&
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
                                                                !isDeleteForReply &&
                                                                <div
                                                                    onClick={() => { alert("In development, Please wait") }}
                                                                    className="report menuElBtn">
                                                                    <ion-icon name="document-lock-outline"></ion-icon>Report
                                                                </div>
                                                            }
                                                        </div>
                                                    }
                                                    <div className="pfp">
                                                        <img
                                                            src={returnPfpOfUser(itm.userObj.Uid && itm.userObj.Uid)}
                                                            alt="" />
                                                    </div>
                                                    <div className="commentUserContent">
                                                        <div className="first">
                                                            <div className="nameCon">
                                                                <div className="name">

                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            nav(`/SearchedUser/${itm.userObj.Uid}`)

                                                                        }}
                                                                    >
                                                                        {itm?.userObj.Username}
                                                                    </span>
                                                                    <span>

                                                                        {itm?.userObj.Uid === post[0]?.userObj.Uid ? 'Author' : ""}
                                                                    </span>
                                                                </div>
                                                                <div className="Date">
                                                                    {moment(new Date(parseInt(itm?.Date, 10))).fromNow()}
                                                                </div>
                                                            </div>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    openMenuForReply(itm.Date)

                                                                }}
                                                                className="menu">
                                                                <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                            </div>
                                                        </div>
                                                        <div className="textContent">
                                                            {itm.textContent}
                                                        </div>
                                                        <div className="actions">


                                                            {itm?.Likes && itm?.Likes.some((userFind) => userFind.Uid === userId) ?
                                                                <div
                                                                    onClick={() => {
                                                                        unlikeCommentLike(post[0]._id, itm?.Date)
                                                                    }}
                                                                    className="liked actionsItem">
                                                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                                                </div>
                                                                :
                                                                <div
                                                                    onClick={() => {
                                                                        commentLike(post[0]._id, itm?.Date)
                                                                    }}
                                                                    className="actionsItem">
                                                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                                                </div>
                                                            }



                                                            {itm.Down && itm.Down.some((userFind) => userFind.Uid === userId) ?
                                                                <div
                                                                    onClick={() => {
                                                                        unlikeCommentDown(post[0]._id, itm?.Date)
                                                                    }}
                                                                    className="liked actionsItem">
                                                                    <ion-icon name="arrow-down-outline"></ion-icon>
                                                                </div>

                                                                :
                                                                <div
                                                                    onClick={() => {
                                                                        commentDown(post[0]._id, itm?.Date)
                                                                    }}
                                                                    className="actionsItem">
                                                                    <ion-icon name="arrow-down-outline"></ion-icon>
                                                                </div>
                                                            }
                                                            <div
                                                                onClick={() => {
                                                                    findSpecificComment(itm?.Date, post[0]._id)
                                                                }}
                                                                className="actionsItem">
                                                                <ion-icon name="chatbox-outline"></ion-icon>
                                                            </div>
                                                        </div>
                                                        <div className="count">
                                                            <div
                                                                onClick={() => {
                                                                    // findSpecificCommentForReply(itm?.Date, post[0]._id)

                                                                    togglePostIdToView(itm?.Date, post[0]._id)
                                                                }}
                                                                className="Replies countDiv">
                                                                {itm.Replies.length > 0 ?
                                                                    postIdToView.some((itmz) =>
                                                                        itmz.postIdOfPost === post[0]._id &&
                                                                        itmz.commentIdDate === itm?.Date

                                                                    ) ? "Close " : "View " : ""}
                                                                {itm.Replies.length + `${itm.Replies.length > 1 ? ' Replies' : ' Reply'}` + ', '}
                                                            </div>
                                                            <div
                                                                onClick={() => {
                                                                    setPostIdForLike(post[0]?._id)
                                                                    setCommentPostIdForComm(itm.Date)
                                                                }}
                                                                className="LikeCount countDivt">
                                                                {itm?.Likes.length + `${itm?.Likes.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                                    itm?.Down.length + `${itm.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="replyCon">

                                                            {
                                                                postIdToView.some((itmz) =>
                                                                    itmz.postIdOfPost === post[0]._id &&
                                                                    itmz.commentIdDate === itm?.Date

                                                                ) && itm.Replies.map((replies) => (
                                                                    <div className="replyItem">

                                                                        <div
                                                                            onClick={() => {
                                                                                getSpecificReply(post[0]?._id, itm?.Date, replies?.Date)
                                                                            }}
                                                                            className="dels">
                                                                            Delte
                                                                        </div>
                                                                        <div className="pfp">
                                                                            <img src={returnPfpOfUser(replies?.userObj.Uid)} alt="" />
                                                                        </div>
                                                                        <div className="userCon">
                                                                            <div className="firstCon">
                                                                                <div className="nameCon">
                                                                                    <div
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            nav(`/SearchedUser/${replies?.userObj.Uid}`)

                                                                                        }}
                                                                                        className="name">
                                                                                        {replies?.userObj.Username}
                                                                                    </div>
                                                                                    <div className="Date">
                                                                                        {moment(new Date(parseInt(replies?.Date, 10))).fromNow()}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="menu">
                                                                                    <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                                                </div>
                                                                            </div>

                                                                            <div className="textCon">
                                                                                {replies?.TextContent}
                                                                            </div>
                                                                            {itm?.TextContent}
                                                                            <div className="actions">

                                                                                {

                                                                                    replies?.Likes.some((likeuser) => likeuser.Uid === userId)
                                                                                        ?
                                                                                        <div
                                                                                            onClick={() => { unlikeToReply(post[0]._id, itm?.Date, replies?.Date) }}
                                                                                            className="actionItem liked">
                                                                                            <ion-icon name="arrow-up-outline"></ion-icon>
                                                                                        </div>
                                                                                        :
                                                                                        <div
                                                                                            onClick={() => { likeToReply(post[0]._id, itm?.Date, replies?.Date) }}
                                                                                            className="actionItem">
                                                                                            <ion-icon name="arrow-up-outline"></ion-icon>
                                                                                        </div>
                                                                                }
                                                                                {

                                                                                    replies?.Dislikes.some((likeuser) => likeuser.Uid === userId)
                                                                                        ?
                                                                                        <div

                                                                                            onClick={() => { RemDisikeToReply(post[0]._id, itm?.Date, replies?.Date) }}
                                                                                            className="actionItem liked">
                                                                                            <ion-icon name="arrow-down-outline"></ion-icon>
                                                                                        </div>
                                                                                        :
                                                                                        <div

                                                                                            onClick={() => { disikeToReply(post[0]._id, itm?.Date, replies?.Date) }}
                                                                                            className="actionItem">
                                                                                            <ion-icon name="arrow-down-outline"></ion-icon>
                                                                                        </div>
                                                                                }


                                                                                <div
                                                                                    onClick={() => {
                                                                                        findSpecificCommentForReply(itm?.Date, post[0]._id,)
                                                                                        setReplyId(replies?.Date)
                                                                                    }}
                                                                                    className="actionItem">
                                                                                    <ion-icon name="chatbox-outline"></ion-icon>
                                                                                </div>
                                                                            </div>
                                                                            <div className="count">
                                                                                <div

                                                                                    className="Replies countDiv">
                                                                                    {replies?.Replies.length + `${replies?.Replies.length > 1 ? ' Replies' : ' Reply'}` + ', '}
                                                                                </div>
                                                                                <div
                                                                                    onClick={() => {
                                                                                        setPostIdForLike(post[0]?._id)
                                                                                        setCommentPostIdForComm(itm.Date)
                                                                                        setReplyIden(replies?.Date)
                                                                                    }}
                                                                                    className="LikeCount countDivt">
                                                                                    {replies?.Likes.length + `${replies?.Likes.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                                                        replies?.Dislikes
                                                                                            .length + `${replies?.Dislikes
                                                                                                .length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ))
                                    }
                                </div>
                            </>
                            :
                            <div className="loadingForViewed">
                                <div className="topDiv"></div>
                                <div className="repliedDivs"></div>
                                <div className="repliedDivs"></div>
                                <div className="repliedDivs"></div>
                                <div className="repliedDivs"></div>
                                <div className="repliedDivs"></div>
                            </div>
                    }
                </div>
                <div className="friends">
                    Chat with your followers
                </div>
            </div>
        </div >
    )
}

export default ViewedPost
