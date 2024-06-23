import React, { useEffect, useState } from 'react';
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
import EditUser from '../comps/EditUser';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UrProfile = () => {
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
                nav(`/profile`)
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
                const filteredPostById = res.data.filter(itm => itm.PostID === userId)
                setPost(filteredPostById);

            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });
    }, [post])


    const [isActive, setActive] = useState('Posts')

    const [isRenderPostModal, setIsRender] = useState(false)
    const [showModalEdit, setShowModal] = useState(false)

    const handlePostModalClose = () => {
        setIsRender(false)
    }

    const handleShowModalClose = () => {
        setShowModal(false)
    }

    const pfpPath = filteredAcc[0] && filteredAcc[0].Pfp ? require(`../profiles/${filteredAcc[0].Pfp}`) : null;



    return (
        <div className='UrProfile closer'>
            <Header userObj={filteredAcc} />
            <ToastContainer />
            {
                isRenderPostModal ?
                    <div className="con" onClick={handlePostModalClose}>
                        <PostModal onClose={handlePostModalClose} />
                    </div>
                    : <></>
            }

            {
                showModalEdit ?
                    <div className="con" onClick={handleShowModalClose}>
                        <EditUser onClose={handleShowModalClose} />
                    </div>
                    : <></>
            }


            <div className="content">
                {
                    filteredAcc[0]
                        ?
                        <>
                            <div className="firstCon">
                                <div className="first">
                                    <div className="nameCon">
                                        <div className="name">
                                            {filteredAcc[0] && filteredAcc[0].Fullname}
                                        </div>
                                        <div className="userName">
                                            @{filteredAcc[0] && filteredAcc[0].Username}
                                        </div>
                                    </div>
                                    <div className="pfp">
                                        <img src={pfpPath} alt="" />
                                    </div>
                                </div>
                            </div>
                            <div className="secCon">
                                <div className="followers btnForProf">
                                    {filteredAcc[0] && filteredAcc[0].Followers.length + ' Followers'}
                                </div>
                                <div className="following btnForProf">
                                    {filteredAcc[0] && filteredAcc[0].Following.length + ' Following'}
                                </div>
                                <div className="posts btnForProf">
                                    {post && post.length + `${parseInt(post.length) > 1 ? ' Posts' : ' Post'}`}
                                </div>
                            </div>
                            <div className="btnCon">
                                <button
                                    onClick={() => { setShowModal(true) }}>
                                    Edit Profile
                                </button>
                            </div>
                            <div className="history">
                                <div className="navigation">
                                    <div
                                        onClick={() => { setActive('Posts') }}
                                        className={`navItem ${isActive === 'Posts' && 'activeNav'}`}>
                                        Posts
                                    </div>
                                    <div
                                        onClick={() => { setActive('Reposts') }}
                                        className={`navItem ${isActive === 'Reposts' && 'activeNav'}`}>
                                        Reposts
                                    </div>
                                </div>
                                {
                                    isActive === 'Posts' ?
                                        <div className="renderedItem">
                                            {post.length === 0 ?
                                                <div
                                                    onClick={() => {
                                                        setIsRender(true)
                                                    }}
                                                    className="noPosts">
                                                    Write your first thougth!
                                                </div>
                                                :
                                                <div className="renderedPost">
                                                    {
                                                        post.slice().reverse().map((itm) => (
                                                            <div
                                                                key={itm._id}
                                                                className="postItem">


                                                                <div className="pfp">
                                                                <img src={pfpPath} alt="" />
                                                                </div>
                                                                <div className="userInf">
                                                                    <div className="first">
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
                                                                            {itm.Comments.length > 0 ? "View" : ""} {itm.Comments.length + `${itm.Comments.length > 1 ? ' Replies' : ' Reply'}` + ', '}
                                                                        </div>
                                                                        <div className="LikeCount countDivt">
                                                                            {itm.Up.length + `${itm.Up.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                                                itm.Down.length + `${itm.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            }
                                            { }
                                        </div>
                                        :
                                        <div className="renderedItem">

                                        </div>
                                }
                            </div>
                        </>
                        :

                        <div className="profileLoader">
                            loading...
                        </div>

                }
            </div>
        </div>
    )
}

export default UrProfile
