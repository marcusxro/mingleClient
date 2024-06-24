import React, { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { authentication } from './FirebaseKey'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../comps/Header'
import moment from 'moment'
import SeeFollowers from '../comps/SeeFollowers'

const SearchedUserShow = () => {

    const params = useParams()


    const [nonFiltered, setNonFiltered] = useState([])
    const [filteredUser, setFiltered] = useState([])
    const [userId, setUserId] = useState('');
    const [feedName, setFeedName] = useState('')
    const nav = useNavigate()


    useEffect(() => {
        document.title = "@" + filteredUser[0]?.Username + ' | ' + filteredUser[0]?.Fullname
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
    }, [feedName]);

    const [filteredAcc, setFilteredAcc] = useState([]);


    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                const filteredUsers =
                    res.data.filter((post) => post.Uid === params.userUID);
                setFiltered(filteredUsers);


                const filteredUsersByUid = res.data.filter((itm) => itm.Uid === userId);
                setFilteredAcc(filteredUsersByUid);

                setNonFiltered(res.data)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredUser]);


    const returnPfpOfUser = (userIden) => {

        const filteredUserForProfile = nonFiltered?.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]?.Pfp) {
            return require(`../profiles/${filteredUserForProfile[0] ?
                filteredUserForProfile[0]?.Pfp : ''}`)
        }
    }


    const [post, setPost] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8080/getPosts')
            .then((res) => {
                const filteredPostById =
                    res.data.filter(itm => itm.PostID === params.userUID)

                setPost(filteredPostById)
            })
            .catch((error) => {
                console.error('Error fetching posts:', error);
            });
    }, [post])

    const [isActive, setActive] = useState('Posts')
    const pfpPath = filteredUser[0] && filteredUser[0].Pfp ? require(`../profiles/${filteredUser[0].Pfp}`) : null;

    const [isRenderPostModal, setIsRender] = useState(false)

    const userObj = {
        Email: filteredAcc[0] && filteredAcc[0].Email,
        Fullname: filteredAcc[0] && filteredAcc[0].Fullname,
        Username: filteredAcc[0] && filteredAcc[0].Username,
        Uid: filteredAcc[0] && filteredAcc[0].Uid,
    }


    const followUser = (userIdToFollow) => {

        axios.post('http://localhost:8080/FollowUser', {
            userUidToFollow: userIdToFollow,
            followerObj: userObj
        }).then(() => {
            console.log("User Followed!")
        }).catch((err) => {
            console.log(err)
        })
    }


    const unfollowUser = (userIdToFollow) => {

        axios.post('http://localhost:8080/UnfollowUser', {
            userUidToFollow: userIdToFollow,
            followerObj: userObj
        }).then(() => {
            console.log("User unollowed!")
        }).catch((err) => {
            console.log(err)
        })
    }

    const [openFollowerAndFollowing, setFollowerAndFollowing] = useState({})
    const [tabTitle, setTabTitle] = useState('Followers')
    const [userUid, setUserUid] = useState('')
    const isInitialSet = useRef(false);


    const [openModal, setOpenModal] = useState(false)


    console.log(filteredUser[0]?.Uid)

    
    useEffect(() => {
        const provideInfo = () => {
            setFollowerAndFollowing({
                view: true,
                userIdentification: filteredUser[0]?.Uid,
                Following: filteredUser[0]?.Following,
                Followers: filteredUser[0]?.Followers,
                tabTitle: tabTitle
            })
        }

        provideInfo()


        return () => { provideInfo() }

    }, [openModal, openFollowerAndFollowing, tabTitle])


    const handleTabChange = (newTabTitle) => {
        setTabTitle(newTabTitle);
        isInitialSet.current = true; // Mark that manual change has occurred
    };




    return (
        <div className='SearchedUserShow closer'>
            <Header userObj={filteredAcc} />
            {
                openFollowerAndFollowing && filteredAcc[0] && openModal &&
                <div
                    onClick={() => {
                        setOpenModal(prevClick => !prevClick)
                        setFollowerAndFollowing({})
                    }}
                    className="con">
                    <SeeFollowers userDetails={openFollowerAndFollowing} />
                </div>
            }
            <div className="content">
                {
                    filteredUser[0] ?
                        <>
                            <div className="firstUserCon">
                                <div className="nameCon">
                                    <div className="userName">
                                        {filteredUser[0]?.Fullname}
                                    </div>
                                    <div className="fullName">
                                        @{filteredUser[0]?.Username}
                                    </div>
                                </div>
                                <div className="pfp">
                                    <img src={returnPfpOfUser(filteredUser[0]?.Uid)} alt="" />
                                </div>
                            </div>
                            <div className="secCon">
                                <div
                                    onClick={() => {
                                        setOpenModal(prevClick => !prevClick)
                                        handleTabChange("Followers")
                                    }}
                                    className="followers btnForProf">
                                    {filteredUser[0] && filteredUser[0].Followers.length + ' Followers'}
                                </div>
                                <div
                                    onClick={() => {
                                        setOpenModal(prevClick => !prevClick)
                                        handleTabChange("Following")
                                    }}
                                    className="following btnForProf">
                                    {filteredUser[0] && filteredUser[0].Following.length + ' Following'}
                                </div>
                                <div className="posts btnForProf">
                                    {post && post.length + `${parseInt(post.length) > 1 ? ' Posts' : ' Post'}`}
                                </div>
                            </div>
                            {
                                filteredUser[0]?.Uid === userId ?
                                    <div className="btnCon">
                                        <button
                                        // onClick={() => { setShowModal(true) }}
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                    :
                                    filteredUser[0]?.Followers.some((user) => user.Uid === userId) ?
                                        <div className="btnCon">
                                            <button
                                                onClick={() => {
                                                    unfollowUser(filteredUser[0]?.Uid)
                                                }}
                                                className='unfollow'>
                                                Unfollow
                                            </button>
                                        </div>
                                        :
                                        <div className="btnCon">
                                            <button
                                                onClick={() => {
                                                    followUser(filteredUser[0]?.Uid)
                                                }}
                                            >
                                                Follow
                                            </button>
                                        </div>

                            }
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
                                                    No Posts
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
                                            <div className="noPosts">
                                                No Reposts
                                            </div>
                                        </div>
                                }
                            </div>
                        </>
                        :
                        <div className="loadingDiv">
                            Loading...
                        </div>

                }
            </div>
        </div>
    )
}

export default SearchedUserShow
