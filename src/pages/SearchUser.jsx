import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from './FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { io } from 'socket.io-client';
import gsap from 'gsap';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewLikes from '../comps/ViewLikes';




const SearchUser = () => {

    const [filteredAcc, setFiltered] = useState([]);
    const nav = useNavigate();
    const [userId, setUserId] = useState('');

    useEffect(() => {
        document.title = 'Search';
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid);
                nav('/Search')
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
                const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
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
    const [searchedUsers, setSearchedUsers] = useState([])

    useEffect(() => {
        const filterAccounts = nonFiltered?.filter((user) =>
            user.Username.toLowerCase().includes(searchVal.toLowerCase()) ||
            user.Fullname.toLowerCase().includes(searchVal.toLowerCase())
        );
        

        const filterPosts =
            posts?.filter((post) => post.TextContent.includes(searchVal))

        setFilteredPost(filterPosts)
        setSearchedUsers(filterAccounts)

    }, [searchVal])


    return (
        <div className='SearchUser closer'>
            <Header userObj={filteredAcc} />
            <ToastContainer />

        
            <div className="content">
                <div className="inputCon">
                    <div className="iconOne">
                        <ion-icon name="search-outline"></ion-icon>
                    </div>
                    <input
                        value={searchVal}
                        onChange={(e) => { setSearchVal(e.target.value) }}
                        type="text" placeholder='Search' />
                    {searchVal &&
                        <div
                            onClick={() => {
                                setSearchVal('')
                            }}
                            className="iconTwo">
                            <ion-icon name="close-circle-outline"></ion-icon>
                        </div>
                    }
                </div>
                <div className="searchedItem">
                    <div className="postCon">
                        {
                            searchVal &&
                            <div
                                onClick={() => {
                                    nav(`/SearchedPost/${searchVal}`)
                                }}
                                className="postItem">
                                <div className="first">
                                    <div className="textContent">
                                        {searchVal.length > 10 ? searchVal.slice(0, 20) + '...' : searchVal}
                                    </div>
                                </div>
                                <div className="seePost">
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </div>
                            </div>
                        }
                        {searchVal && filteredPosts.length === 0 && 'loading'}
                        {
                            searchVal && filteredPosts?.slice(0, 3).map((post) => (
                                <div
                                    onClick={() => {
                                        nav(`/SearchedPost/${post.TextContent}`)
                                    }}
                                    className="postItem">
                                    <div className="first">
                                        <div className="textContent">

                                            {post.TextContent.length > 10 ? post.TextContent.slice(0, 20) + '...' : post.TextContent}
                                        </div>
                                    </div>
                                    <div className="seePost">
                                        <ion-icon name="chevron-forward-outline"></ion-icon>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div className="userCon">
                        {
                            searchVal && searchedUsers?.map((user) => (
                                <div
                                    onClick={() => {
                                        nav(`/SearchedUser/${user.Uid}`)
                                    }}
                                    className="searchedUsers">
                                    <div className="first">
                                        <div className="pfp">
                                            <img src={returnPfpOfUser(user.Uid)} alt="" />
                                        </div>
                                        <div className="infoContent">
                                            <div className="userName">
                                                {user.Username}
                                            </div>
                                            <div className="fullName">
                                                {user.Fullname}
                                            </div>
                                            <div className="count">
                                                <div className="following info">
                                                    Following {user.Following.length}
                                                </div>
                                                <div className="followers info">
                                                    Followers {user.Followers.length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button>
                                        Follow
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchUser
