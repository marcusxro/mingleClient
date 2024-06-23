import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import { useNavigate } from 'react-router-dom';


const ViewLikes = ({ LikesAndDislikes, onClose }) => {


    const [nonFiltered, setNonFiltered] = useState([])
    const [userId, setUserId] = useState('');
    const [filteredAcc, setFilteredAcc] = useState([])

    useEffect(() => {
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {setUserId(user.uid);}
        });
        return () => {
            unsub();
        };
    }, []);


    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                setNonFiltered(res.data)
                const filtered = res.data.filter((user) => user.Uid === userId)
                setFilteredAcc(filtered)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [nonFiltered, filteredAcc]);

    const returnPfpOfUser = (userIden) => {
        const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)
        if (filteredUserForProfile[0]) {
            return require(`../profiles/${filteredUserForProfile[0] ?
                filteredUserForProfile[0].Pfp : ''}`)
        }
    }

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

    const returnFollowing = (userIden) => {
        if (filteredAcc[0]) {
            return filteredAcc[0].Following.some((user) => user.Uid === userIden) ?
                <button
                    onClick={() => {
                        unfollowUser(userIden)
                    }}
                    className='unfollow'>
                    Unfollow
                </button>
                :
                filteredAcc[0]?.Uid === userIden ?
                    <></>
                    :
                    <button
                        onClick={() => {
                            followUser(userIden)
                        }}
                        className='follow'>
                        Follow
                    </button>
        }
    }


    const [isLikeOrDislike, setIsLikeOrDislike] = useState('Like')

    const nav = useNavigate()

    return (
        <div
            onClick={(e) => { e.stopPropagation() }}
            className='ViewLikes'>


            {
             filteredAcc[0] && LikesAndDislikes && nonFiltered[0] ?
                    <>
                        <div className="titleCon">
                            <div
                                onClick={() => {
                                    setIsLikeOrDislike('Like')
                                }}
                                className={`likesTitle title ${isLikeOrDislike === 'Like' && 'active'}`}>
                                <ion-icon name="arrow-up-outline"></ion-icon>  Likes:
                            </div>
                            <div
                                onClick={() => {
                                    setIsLikeOrDislike('Dislikes')
                                }}
                                className={`likesTitle title ${isLikeOrDislike === 'Dislikes' && 'active'}`}>
                                <ion-icon name="arrow-down-outline"></ion-icon>  Dislikes:
                            </div>
                        </div>
                        {
                            isLikeOrDislike === 'Like' ?
                                <div
                                    className="likes"
                                >
                                    {
                                        LikesAndDislikes?.Likes.length === 0 &&
                                        <div className="noUser">
                                            No Likes at the moment
                                        </div>
                                    }
                                    <div
                                        className="userCon">
                                        {
                                            LikesAndDislikes?.Likes.map((itm) => (
                                                <div className="users">
                                                    <div className="firstContent">
                                                        <div className="pfp">
                                                            <img src={returnPfpOfUser(itm.Uid)} alt="" />
                                                        </div>
                                                        <div className="nameCon">
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    nav(`/SearchedUser/${itm.Uid}`)

                                                                }}
                                                                className="Username">
                                                                {itm.Username}
                                                            </div>
                                                            <div className="Fullname">
                                                                {itm.Fullname}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {
                                                        returnFollowing(itm.Uid)
                                                    }
                                                </div>

                                            ))
                                        }
                                    </div>
                                </div>

                                :
                                <div className="Dislikes">
                                    {
                                        Array.isArray(LikesAndDislikes?.Down) && LikesAndDislikes.Down.length ||
                                        Array.isArray(LikesAndDislikes?.Dislikes) && LikesAndDislikes.Dislikes.length === 0 &&
                                        <div className="noUser">
                                            No Dislikes at the moment
                                        </div>
                                    }
                                    <div className="userCon">
                                        {
                                            Array.isArray(LikesAndDislikes?.Dislikes) && LikesAndDislikes.Dislikes.length > 0 ? (
                                                LikesAndDislikes.Dislikes.map((itm) => (
                                                    <div className="users" key={itm.Uid}>
                                                        <div className="firstContent">
                                                            <div className="pfp">
                                                                <img src={returnPfpOfUser(itm.Uid)} alt="" />
                                                            </div>
                                                            <div className="nameCon">
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        nav(`/SearchedUser/${itm.Uid}`)

                                                                    }}
                                                                    className="Username">
                                                                    {itm.Username}
                                                                </div>
                                                                <div className="Fullname">
                                                                    {itm.Fullname}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {
                                                            returnFollowing(itm.Uid)
                                                        }
                                                    </div>
                                                ))
                                            ) : (
                                                Array.isArray(LikesAndDislikes?.Down) && LikesAndDislikes.Down.map((itm) => (
                                                    <div className="users" key={itm.Uid}>
                                                        <div className="firstContent">
                                                            <div className="pfp">
                                                                <img src={returnPfpOfUser(itm.Uid)} alt="" />
                                                            </div>
                                                            <div className="nameCon">
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        nav(`/SearchedUser/${itm.Uid}`)

                                                                    }}
                                                                    className="Username">
                                                                    {itm.Username}
                                                                </div>
                                                                <div className="Fullname">
                                                                    {itm.Fullname}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {
                                                            returnFollowing(itm.Uid)
                                                        }
                                                    </div>
                                                ))
                                            )
                                        }
                                    </div>

                                </div>
                        }
                    </>
                    :
                    <>Loading...</>
            }


        </div>
    )
}

export default ViewLikes



