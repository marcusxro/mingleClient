import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from './FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

import { io } from 'socket.io-client';
import gsap from 'gsap';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewLikes from '../comps/ViewLikes';
import moment from 'moment';




const SearchedPost = () => {


    const [filteredAcc, setFiltered] = useState([]);
    const nav = useNavigate();
    const [userId, setUserId] = useState('');
    const params = useParams()


    useEffect(() => {
        document.title = 'Search';
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                console.log('no user');
                nav('/');
            }
        });

        return () => {
            unsub();
        };
    }, []);

    const [nonFiltered, setNonFiltered] = useState([])

    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                const filteredUsers = res.data.filter((post) => post.Uid === userId);
                setFiltered(filteredUsers);
                setNonFiltered(res.data)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredAcc, nonFiltered]);
    

    const [searchVal, setSearchVal] = useState('')
    const [posts, setPosts] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8080/getPosts')
            .then((res) => {
                setPosts(res.data);
            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });
    }, [])

    const returnPfpOfUser = (userIden) => {

        const filteredUserForProfile = nonFiltered?.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]?.Pfp) {
            return require(`../profiles/${filteredUserForProfile[0] ?
                filteredUserForProfile[0]?.Pfp : ''}`)
        }
    }

    const [filteredPosts, setFilteredPost] = useState([])
    useEffect(() => {

        const filterPosts = posts
            ?.filter((post) => post.TextContent.includes(params.postID))
            .sort((a, b) => {
                // Convert Date to number and sort in descending order
                return Number(b.Date) - Number(a.Date);
            });

        setFilteredPost(filterPosts);

        console.log(filterPosts);
    }, [params.postID, posts]);



    return (
        <div className='SearchedPost'>
            <Header userObj={filteredAcc} />

            <div className="content">
                {
                    filteredAcc[0] && params.postID ?
                        <>
                            {
                                filteredPosts?.map((post) => (
                                    <div
                                        onClick={() => {
                                            nav(`/post/${post._id}`)
                                        }}
                                        className="postItem">


                                        <div className="first">

                                            <div className="pfp">
                                                <img src={returnPfpOfUser(post.userObj.Uid)} alt="" />
                                            </div>

                                            <div className="postContent">
                                                <div className="userInfo">
                                                    <div className="wrapper">
                                                        <div className="firstCon">
                                                            <div className="userName">
                                                                {post?.userObj.Username}
                                                            </div>
                                                            <div className="Date">
                                                                {moment(new Date(parseInt(post?.Date, 10))).fromNow()}
                                                            </div>
                                                        </div>
                                                        <div className="menu">
                                                            <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                                                        </div>
                                                    </div>
                                                    <div className="fullName">
                                                        {post?.userObj.Fullname}
                                                    </div>
                                                </div>
                                                <div className="TextContent">
                                                    {post?.TextContent}
                                                </div>
                                                <div className="actions">
                                                    {
                                                        post.Up && post.Up.some((user) => user?.Uid === userId) ?
                                                            <>
                                                                <div
                                                                    className="actionItem liked">
                                                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                                                </div>
                                                            </>
                                                            :
                                                            <>
                                                                <div className="actionItem">
                                                                    <ion-icon name="arrow-up-outline"></ion-icon>
                                                                </div>
                                                            </>
                                                    }
                                                    <div className="actionItem">
                                                        <ion-icon name="arrow-down-outline"></ion-icon>
                                                    </div>
                                                    <div className="actionItem">
                                                        <ion-icon name="chatbox-outline"></ion-icon>
                                                    </div>
                                                    <div className="actionItem">
                                                        <ion-icon name="open-outline"></ion-icon>
                                                    </div>
                                                </div>

                                                <div className="count">
                                                    <div
                                                        className="likes countBtn">
                                                        {post.Up.length + `${post.Up.length > 1 ? ' Likes' : ' Like'}` + ', ' +
                                                            post.Down.length + `${post.Down.length > 1 ? ' Dislikes' : ' Dislike'}`}
                                                    </div>
                                                    <div className="replies countBtn">
                                                        {", " + post.Comments.length + `${post.Comments.length > 1 ? ' Comments' : ' Comment'}`}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                        :
                        <div className="loadingEl">
                            loading...
                        </div>
                }
            </div>
        </div>
    )
}

export default SearchedPost
