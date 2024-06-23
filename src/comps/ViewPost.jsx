import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SIdebar from '../comps/SIdebar';
import PostModal from '../comps/PostModal';
import moment from 'moment'

const ViewPost = ({ postId }) => {
    const nav = useNavigate()
    const [userId, setUserId] = useState('')
    const [feedName, setFeedName] = useState('')


    useEffect(() => {
        document.title = feedName
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid);
                nav('/feed')
            } else {
                console.log('no user');
                nav('/');
            }
        });

        return () => {
            unsub();
        };
    }, []);


    const [filteredAcc, setFiltered] = useState([]);
    useEffect(() => {
        axios
            .get('http://localhost:8080/getAccs')
            .then((res) => {
                const filteredUsers = res.data.filter((itm) => itm.Uid === userId);
                setFiltered(filteredUsers);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [filteredAcc]);




    const [post, setPost] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8080/getPosts')
        .then((res) => {
          const filteredPostById = res.data.filter(itm => itm._id === postId)
          setPost(filteredPostById);
          setFeedName("@" + post[0] && post[0].userObj.Username | post[0].TextContent)
         
        })
        .catch((error) => {
          console.error('Error fetching posts:', error);
        });
    }, [postId, post, feedName])

    return (
        <div className='ViewPost'>

            <div className="postContent">
                <SIdebar />
                {
                    post.map((itm) => (
                        <div className="viewedPost">
                            {itm.TextContent}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default ViewPost
