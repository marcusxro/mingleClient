import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import SIdebar from '../comps/SIdebar';
import PostModal from '../comps/PostModal';
import moment from 'moment'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import { io } from 'socket.io-client';


const socket = io('http://localhost:8080', {
    reconnection: true
})


const ViewReplies = ({ CommentObj, setOpenReply, commentPostId }) => {




    const notif = () => {
        toast.success('Reply successfuly posted!', {
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


    const nav = useNavigate();
    const [userId, setUserId] = useState('');
    const paramsNav = useParams()
    const [feedName, setFeedName] = useState('')


    useEffect(() => {

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
                const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
                setFiltered(filteredUsers);
                setNonFiltered(res.data)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredAcc]);


    const [textContent, setTextContent] = useState('')


    const userObj = {
        Email: filteredAcc[0]?.Email || '',
        Fullname: filteredAcc[0]?.Fullname || '',
        Username: filteredAcc[0]?.Username || '',
        Uid: filteredAcc[0]?.Uid || '',
        Pfp: filteredAcc[0]?.Pfp || '',
    };


    const repliedSchema = {
        PostID: commentPostId,
        commentObj: CommentObj,
        userObj: userObj,
        Date: Date.now(),
        TextContent: textContent,
        Incrementor: 1,
        Likes: [],
        Dislikes: [],
        Replies: [],
        DateUid: CommentObj[0].Date,
    }






    const handleReplyToPost = (postId) => {

        if (!CommentObj && !postId && filteredAcc) {
            return
        }
        axios.post('http://localhost:8080/replyToPost', {
            repliedSchema: repliedSchema
        }).then(() => {
            setTextContent('')
            console.log("comment sent successfuly")
            notif()
        }).catch((err) => {
            console.log(err)
        })

    }



    const returnPfpOfUser = (userIden) => {
        const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]) {
            return require(`../profiles/${filteredUserForProfile[0] ? filteredUserForProfile[0].Pfp : ''}`)
        }
    }






    const commentLike = (params, commentID) => {
        console.log(commentID)
        axios.post('http://localhost:8080/commentLike', {
            userObj: userObj,
            PostID: params,
            commentID: commentID
        }).catch(() => {
            console.log("sent")
            socket.on('postLiked', commentID);
        }).then((err) => {
            console.log(err)
        })
    }

    const commentDown = (params, commentID) => {
        console.log(params)
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


    return (
        <div className='CommentModal ViewReplies' onClick={() => { setOpenReply('') }}>
            <ToastContainer />
            {
                filteredAcc[0] ?
                    <>
                        <div className="title">
                            Replies to @{CommentObj[0] && CommentObj[0].userObj.Username}'s Comment
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation() }}
                            className="commentContent">
                            {
                                CommentObj.map((itm) => (
                                    <div className="commItem">
                                        <div className="pfp">
                                            <img src={returnPfpOfUser(itm?.userObj.Uid)} alt="" />
                                        </div>
                                        <div className="commContent">
                                            <div className="firstConForComment">
                                                <div className="nameCon">
                                                    <div className="name">
                                                        {itm?.userObj.Username}
                                                    </div>
                                                    <div className="Date">
                                                        {moment(new Date(parseInt(itm.Date, 10))).fromNow()}
                                                    </div>
                                                </div>
                                                <div className="menu">
                                                    <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                </div>
                                            </div>
                                            <div className="textContent">
                                                {itm.textContent}
                                            </div>

                                            <div className="actions">
                                                {itm.Likes && itm.Likes.some((userFind) => userFind.Uid === userId) ?
                                                    <div
                                                        onClick={() => {
                                                            unlikeCommentLike(commentPostId, itm.Date)
                                                        }}
                                                        className="liked actionsItem">
                                                        <ion-icon name="arrow-up-outline"></ion-icon>
                                                    </div>
                                                    :
                                                    <div
                                                        onClick={() => {
                                                            commentLike(commentPostId, itm.Date)
                                                        }}
                                                        className="actionsItem">
                                                        <ion-icon name="arrow-up-outline"></ion-icon>
                                                    </div>
                                                }



                                                {itm.Down && itm.Down.some((userFind) => userFind.Uid === userId) ?
                                                    <div
                                                        onClick={() => {
                                                            unlikeCommentDown(commentPostId, itm.Date)
                                                        }}
                                                        className="liked actionsItem">
                                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                                    </div>

                                                    :
                                                    <div
                                                        onClick={() => {
                                                            commentDown(commentPostId, itm.Date)
                                                        }}
                                                        className="actionsItem">
                                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                                    </div>
                                                }
                                            </div>

                                            <div className="count">
                                                <div
                                                    // onClick={() => {
                                                    //     findSpecificCommentForReply(itm.Date, post[0]._id)
                                                    // }}
                                                    className="Replies countDiv">
                                                    {itm.Replies.length > 0 ? "View" : ""} {itm.Replies.length + `${itm.Replies.length > 1 ? ' Replies' : ' Reply'}` + ', '}
                                                </div>
                                                <div className="LikeCount countDivt">
                                                    {itm.Likes.length + `${itm.Likes.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                        itm.Down.length + `${itm.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))
                            }
                            {filteredAcc && CommentObj[0] &&
                                CommentObj[0].Replies.length === 0 &&
                                <div className="noRep">
                                    No Replies
                                </div>
                            }
                            {
                                filteredAcc && CommentObj[0] ?
                                    CommentObj[0].Replies.map((itm) => (
                                        <div
                                            key={itm.Date}
                                            className="urComment replies">
                                            <div className="pfp">
                                                <img src={returnPfpOfUser(itm.userObj.Uid)} alt="" />
                                            </div>
                                            <div className="first">
                                                <div className="firstConForReplies">
                                                    <div className="nameCon">
                                                        <div className="name">
                                                            {itm.userObj.Username}
                                                        </div>
                                                        <div className="Date">
                                                            {moment(new Date(parseInt(itm.Date, 10))).fromNow()}
                                                        </div>
                                                    </div>
                                                    <div className="menu">
                                                        <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                    </div>
                                                </div>

                                                <div className="textContent">
                                                    {itm.TextContent}
                                                </div>
                                                <div className="actions">
                                                    <div className="actionItem">
                                                        <ion-icon name="arrow-up-outline"></ion-icon>
                                                    </div>
                                                    <div className="actionItem">
                                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                                    </div>
                                                    <div className="actionItem">
                                                        <ion-icon name="chatbox-outline"></ion-icon>
                                                    </div>
                                                </div>

                                                <div className="count">
                                                    <div
                                                        // onClick={() => {
                                                        //     findSpecificCommentForReply(itm.Date, post[0]._id)
                                                        // }}
                                                        className="Replies countDiv">
                                                        {itm.Replies.length > 0 ? "View" : ""} {itm.Replies.length + `${itm.Replies.length > 1 ? ' Replies' : ' Reply'}` + ', '}
                                                    </div>
                                                    <div className="LikeCount countDivt">
                                                        {itm.Likes.length + `${itm.Likes.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                            itm.Dislikes.length + `${itm.Dislikes.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    : <><h1>loading</h1></>
                            }


                        </div>
                      <div className="replyDiv">
                      <input onClick={(e) => {e.stopPropagation()}} type="text" />
                      <button>Reply</button>
                      </div>
                    </>

                    : <>loading..</>
           
                    
            }

        </div>
    )
}

export default ViewReplies
