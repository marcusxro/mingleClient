import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';


const SeeFollowers = ({ userDetails }) => {

    const [userId, setUserId] = useState('');
    const [filteredAcc, setFilteredAcc] = useState([])


    useEffect(() => {
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid);
            }
        });
        return () => {
            unsub();
        };
    }, []);

    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
                setFilteredAcc(filteredUsers);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredAcc]);

    const [tabTitle, setTabTitle] = useState('Followers')
    const isInitialSet = useRef(false);

    const [nonFiltered, setNonFiltered] = useState([])

    useEffect(() => {
        console.log(userDetails?.view ? true : false)

        if (!isInitialSet.current && (userDetails?.tabTitle === "Followers" || userDetails?.tabTitle === "Following")) {
            setTabTitle(userDetails.tabTitle);
            isInitialSet.current = false;
        }

    }, [userDetails.tabTitle]);



    const handleTabChange = (newTabTitle) => {

        setTabTitle(newTabTitle);
        isInitialSet.current = true; // Mark that manual change has occurred
    };



    useEffect(() => {
        axios.get('http://localhost:8080/getAccs')
            .then((res) => {
                setNonFiltered(res.data)
            }).then((err) => {
                console.log(err)
            })
    }, [])


    const returnPfpOfUser = (userIden) => {
        const filteredUserForProfile = nonFiltered.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]?.Pfp) {
            return require(`../profiles/${filteredUserForProfile[0] ? filteredUserForProfile[0].Pfp : ''}`)
        }
    }

    const nav = useNavigate()

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
        const returnFollowBack = (paramsUid) => {
            if (userDetails?.view) {
                return filteredAcc[0]?.Following.some((user) => user.Uid === paramsUid) ?
                    <>Follow Back</> : <>Follow</>
            }
        }

        if (filteredAcc[0]) {
            return filteredAcc[0].Following.some((user) => user.Uid === userIden) ?
                <button onClick={() => { unfollowUser(userIden) }}
                    className='unfollow'>
                    Unfollow
                </button>
                :
                filteredAcc[0]?.Uid === userIden ?
                    <div className="you">
                        You
                    </div>
                    :
                    <button onClick={() => { followUser(userIden) }}
                        className={`follow ${userDetails?.Uid === userId && "FollowBack"}`}>
                        {userDetails?.view ? returnFollowBack(userIden) :
                            filteredAcc[0]?.Uid === userId ? "Follow Back" : "Follow"}
                    </button>
        }
    }

    return (
        <div
            onClick={(e) => { e.stopPropagation() }}
            className='SeeFollowers'>

            {
                nonFiltered[0] && userDetails ?
                    <React.Fragment>
                        <div className="tabinationTitle">
                            <div
                                onClick={() => {
                                    handleTabChange("Followers")
                                }}
                                className={`tabItem ${tabTitle === "Followers" ? "ActiveTab " : ''} `}>
                                Followers
                            </div>
                            <div
                                onClick={() => {
                                    handleTabChange("Following")
                                }}
                                className={`tabItem ${tabTitle === "Following" ? "ActiveTab" : ""} `}>
                                Following
                            </div>
                        </div>


                        {
                            tabTitle === "Followers" ?
                                (
                                    <React.Fragment>
                                        {
                                            nonFiltered[0] && userDetails.Followers.length === 0 &&

                                            <div className="noUsers">
                                                No Followers
                                            </div>
                                        }
                                        {
                                            userDetails?.Followers &&
                                            <div className="userDetailsCon">
                                                {
                                                    userDetails?.Followers.map((user) => (
                                                        <div className="userItem">

                                                            <div className="firstCon">
                                                                <div className="pfp">
                                                                    <img src={returnPfpOfUser(user.Uid)} alt="" />
                                                                </div>
                                                                <div className="userDetails">
                                                                    <div
                                                                        onClick={() => {
                                                                            nav(user.Uid === userId ? `/profile` :
                                                                                `/SearchedUser/${user?.Uid}`)
                                                                        }}
                                                                        className="userName">
                                                                        @{user.Username}
                                                                    </div>
                                                                    <div className="fullName">
                                                                        {user.Fullname}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="menu">
                                                                {
                                                                    returnFollowing(user?.Uid)
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        }
                                    </React.Fragment>
                                )
                                :
                                (
                                    <React.Fragment>
                                        {
                                            nonFiltered[0] && userDetails.Following.length === 0 &&

                                            <div className="noUsers">
                                                No Following
                                            </div>
                                        }
                                        {
                                            userDetails?.Following &&
                                            <div className="userDetailsCon">
                                                {
                                                    userDetails?.Following.map((user) => (
                                                        <div className="userItem">
                                                            <div className="firstCon">
                                                                <div className="pfp">
                                                                    <img src={returnPfpOfUser(user.Uid)} alt="" />
                                                                </div>
                                                                <div className="userDetails">

                                                                    <div
                                                                        onClick={() => {
                                                                            nav(user.Uid === userId ? `/profile` :
                                                                                `/SearchedUser/${user?.Uid}`)
                                                                        }}
                                                                        className="userName">
                                                                        @{user.Username}
                                                                    </div>
                                                                    <div className="fullName">
                                                                        {user.Fullname}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="menu">
                                                                {
                                                                    returnFollowing(user?.Uid)
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        }
                                    </React.Fragment>
                                )
                        }
                    </React.Fragment>
                    :
                    <div className="loading">
                        Loading...
                    </div>
            }
        </div>
    )
}

export default SeeFollowers
