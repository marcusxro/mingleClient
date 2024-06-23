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

const ReplyToReply = ({ CommentObj, setOpenReply, commentPostId, replyId }) => {
    const [textContent, setTextContent] = useState('')
    const [userName, setUsername] = useState()
    const [viewedRep, setViewedRep] = useState(null)

    useEffect(() => {
        if (CommentObj?.[0]?.Replies) {
            const filteredComm = CommentObj[0].Replies.filter((reply) => reply.Date === replyId);
            setViewedRep(filteredComm);
            
            // Ensure viewedRep is defined before accessing its properties
            if (filteredComm?.[0]?.userObj) {
                setUsername(`@${filteredComm[0].userObj.Username}`);
            }
        }
    }, [replyId, CommentObj]);
    

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

    const noVal = () => {
        toast.error('Please type something!', {
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



    const error = () => {
        toast.error('Problem occured!', {
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





    const userObj = {
        Email: filteredAcc[0]?.Email || '',
        Fullname: filteredAcc[0]?.Fullname || '',
        Username: filteredAcc[0]?.Username || '',
        Uid: filteredAcc[0]?.Uid || '',
        Pfp: filteredAcc[0]?.Pfp || '',
    };



    const finalizedTxt = userName + " " + textContent


    const repliedSchema = {
        PostID: commentPostId,
        commentObj: CommentObj,
        userObj: userObj,
        Date: Date.now(),
        TextContent: finalizedTxt,
        Incrementor: 1,
        Likes: [],
        Dislikes: [],
        Replies: [],
        DateUid: CommentObj[0].Date,
    }


    const handleReplyToPost = (postId) => {
        if (!textContent) {
            return noVal();
        }
    
        if (!CommentObj && !postId && filteredAcc) {
            return;
        }
    
        const payloadSize = JSON.stringify(repliedSchema).length;
        console.log(`Payload size: ${payloadSize} bytes`);
    
        if (payloadSize > 50 * 1024 * 1024) { // 50MB limit
            error()
            return;
        }
    
        axios.post('http://localhost:8080/replyToPost', { repliedSchema })
            .then(() => {
                setTextContent('');
                console.log("comment sent successfully");
                notif();
            })
            .catch((err) => {
                console.log(err);
                error()
            });
    };
    


    const deleteReplyToPost = (postId) => {


        axios.post('http://localhost:8080/deleteReplyToPost', { repliedSchema })
            .then(() => {
                setTextContent('');
                console.log("comment sent successfully");
                notif();
            })
            .catch((err) => {
                console.log(err);
                error()
            });
    };
    

    const returnPfpOfUser = (userIden) => {
        const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]) {
            return require(`../profiles/${filteredUserForProfile[0] ? filteredUserForProfile[0].Pfp : ''}`)
        }
    }



    const [finalVal, setFinalVal] = useState('')

    useEffect(() => {
        const userName = '@'

        setFinalVal(`@ ${textContent}`)




    }, [textContent, finalVal, viewedRep])





    return (
        <div className='CommentModal' onClick={() => { setOpenReply('') }}>
            <ToastContainer />
            {
                filteredAcc[0] ?
                    <>
                        <div className="title">
                            Reply to @{CommentObj[0] && CommentObj[0].userObj.Username}
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation() }}
                            className="commentContent">
                            {
                                viewedRep.map((itm) => (
                                    <div className="commItem">
                                        <div className="pfp">
                                            <img src={returnPfpOfUser(itm?.userObj.Uid)} alt="" />
                                        </div>
                                        <div className="commContent">
                                            <div className="first">
                                                <div className="name">
                                                    {itm?.userObj.Username}
                                                </div>
                                                <div className="Date">
                                                    {moment(new Date(parseInt(itm.Date, 10))).fromNow()}
                                                </div>
                                            </div>
                                            <div className="textContent">
                                                {itm.TextContent}
                                            </div>

                                        </div>
                                    </div>
                                ))
                            }

                            {
                                filteredAcc && viewedRep[0] ?
                                    filteredAcc.map((itm) => (
                                        <div className="urComment">

                                            <div className="pfp">
                                                <img src={returnPfpOfUser(itm.Uid)} alt="" />
                                            </div>
                                            <div className="first">
                                                <div className="name">
                                                    {itm.Username}
                                                </div>
                                                <textarea
                                                    onChange={(e) => {
                                                        setTextContent(e.target.value.replace(`@${CommentObj[0]?.userObj.Username} `, '')); // Update textContent state, removing static prefix
                                                    }}
                                                    value={textContent} // Static @user prefix and dynamic textContent
                                                    maxLength={300}
                                                    placeholder={`Reply to ${CommentObj[0]?.userObj.Username}`}
                                                    name="" id="">

                                                </textarea>
                                            </div>
                                        </div>
                                    ))
                                    : <><h1>loading</h1></>
                            }

                            <div className="privacy">
                                <div className="priv">
                                    Edit privacy
                                </div>
                                {
                                    filteredAcc && CommentObj ?
                                        <button
                                            onClick={() => {
                                                handleReplyToPost(commentPostId)
                                            }}
                                            className='allowedBtn'>
                                            Reply
                                        </button> :
                                        <button className='notAllowedBtn'>
                                            Reply
                                        </button>
                                }

                            </div>
                        </div>

                    </>

                    : <>loading..</>
            }
        </div>
    )
}

export default ReplyToReply
