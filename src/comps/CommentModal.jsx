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

const CommentModal = ({ postObj, setOpenComm }) => {

    const notif = () => {
        toast.success('Comment successfuly posted!', {
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
        Email: filteredAcc[0] && filteredAcc[0].Email,
        Fullname: filteredAcc[0] && filteredAcc[0].Fullname,
        Username: filteredAcc[0] && filteredAcc[0].Username,
        Uid: filteredAcc[0] && filteredAcc[0].Uid,
        Pfp: filteredAcc[0] ? filteredAcc[0].Pfp : '',
    }

    const commentObj = {
        textContent: textContent,
        Date: Date.now(),
        userObj: userObj,
        Replies: [],
        Likes: [],
        Down: [],
    }

    const handleCommentToPost = (postId) => {

        if (!commentObj && !postId && filteredAcc) {
            return
        }
        console.log(postId)
        console.log(commentObj)
        axios.post('http://localhost:8080/commentToPost', {
            PostID: postId,
            commentObj: commentObj
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

    return (
        <div className='CommentModal' onClick={() => setOpenComm(false)}>
            <ToastContainer />
            {
                filteredAcc[0] ?
                    <>
                        <div className="title">
                            Comment
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation() }}
                            className="commentContent">
                            {
                                postObj.map((itm) => (
                                    <div className="commItem">
                                        <div className="pfp">
                                            <img src={returnPfpOfUser(itm.userObj.Uid)} alt="" />
                                        </div>
                                        <div className="commContent">
                                            <div className="first">
                                                <div className="name">
                                                    {itm.userObj.Username}
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
                                filteredAcc && postObj[0] ?
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
                                                        setTextContent(e.target.value)
                                                    }}
                                                    value={textContent}
                                                    maxLength={300}
                                                    placeholder={`Comment to ${postObj[0].userObj.Username}`}
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
                                    filteredAcc && postObj ?
                                        <button
                                            onClick={() => {
                                                handleCommentToPost(postObj[0]._id)
                                            }}
                                            className='allowedBtn'>
                                            Post
                                        </button> :
                                        <button className='notAllowedBtn'>
                                            Post
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

export default CommentModal
