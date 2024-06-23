import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmojiPicker from 'emoji-picker-react';

const PostModal = ({ onClose }) => {
  const [userId, setUserId] = useState('')
  const nav = useNavigate()

  const handleClickInside = (e) => {
    e.stopPropagation(); // Prevent click event propagation
  };


  const [textContent, setText] = useState('')
  const [boolText, setBooltext] = useState(false)

  useEffect(() => {
    if (textContent) {
      setBooltext(true)
    } else {
      setBooltext(false)
    }
  }, [textContent])


  useEffect(() => {
    document.title = 'Feed';
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



  const userObj = {
    Email: filteredAcc[0] && filteredAcc[0].Email,
    Fullname: filteredAcc[0] && filteredAcc[0].Fullname,
    Username: filteredAcc[0] && filteredAcc[0].Username,
    Uid: filteredAcc[0] && filteredAcc[0].Uid,
    Pfp: filteredAcc[0] ? filteredAcc[0].Pfp : '',
  }

  const notif = () => {
    toast.success('Activity successfuly posted!', {
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

  const Post = () => {

    if (!textContent) {
      return
    }
    console.log(userId)
    axios.post(`http://localhost:8080/Post`, {
      userObj: userObj,
      Date: Date.now(),
      TextContent: textContent,
      Up: [],
      Down: [],
      Comments: [],
      Shares: [],
      PostID: userId,
    }).then(() => {
      notif()
      console.log('content posted!')
      setText('')
    }).catch((err) => {
      console.log(err)
    })

  }



  return (
    <div className='PostModal' onClick={handleClickInside}>
      <ToastContainer />
      <div className="title">
        Post a new thought
      </div>
      <div className="content">
        <div className="upper">
          <div className="pfp"></div>
          <div className="text">
            <div className="name">
              {filteredAcc[0] ? filteredAcc[0].Username : 'loading'}
            </div>
            <textarea
              name=""
              id=""
              value={textContent}
              onChange={(e) => { setText(e.target.value) }}
              maxLength={300}
              placeholder='Start writing'>

            </textarea>
          </div>
        </div>
        <div className="bottomNav">
          <div className="privacy">
            privacy
          </div>
          {boolText && filteredAcc[0] ?
            <button
              onClick={() => { Post() }}
              className='val'>Post</button> :
            <button className='noVal'>Post</button>}
        </div>
      </div>
    </div>
  )
}

export default PostModal
