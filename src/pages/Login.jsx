import React, { useState, useEffect } from 'react'
import Marquee from "react-fast-marquee";
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { authentication } from './FirebaseKey';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import gsap from 'gsap';
import Spline from '@splinetool/react-spline';



const Login = () => {
  const nav = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState('')

  const errorModal = (textStag) => {
    toast.error(`${textStag}`, {
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

  const notif = () => {
    toast.success('Account successfully created, please verify your account.', {
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
  useEffect(() => {
    document.title = 'Sign in';
    const unsub = onAuthStateChanged(authentication, (user) => {
      if (user) {
        nav('/feed')
      } 
    })
    return () => { unsub() }
  }, [])

  const LoginUser = async (e) => {
    e.preventDefault()

    if (!password || !email) {
      errorModal('Fields cannot be empty.')
      gsap.to(['.login .email', '.login .password'], {
        outline: '1px solid red'
      })
    } else {

      signInWithEmailAndPassword(authentication, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
          
          console.log(isNewUser)
          setUser(user.uid);
          if (user && !user.emailVerified) {
            errorModal("Your email is not verified. Please check your email and verify your account.");
            return;
          } else if (user && user.emailVerified) { // Only navigate to system if email is verified
            nav('/feed');



          }

        }).catch((err) => {
          console.log(err)
          if (err.code === 'auth/invalid-credential') {
            errorModal("Please check your email and password");
            gsap.to(['.login .email', '.login .password'], {
              outline: '1px solid red'
            })
          }

        });
    }



  }

  return (
    <div className='login'>
      <div className="bg">

      <Spline scene="https://prod.spline.design/FAyf1oHw2oQD8uu2/scene.splinecode" />
      </div>
      <ToastContainer />
    
      <form onSubmit={LoginUser}>
        <div className="title">
          Log in with your Mingle account.
        </div>
        <input className='email' type="email" placeholder='Email'
          value={email} onChange={(e) => { setEmail(e.target.value) }} />
        <input className='password' type="password" placeholder='Password'
          value={password} onChange={(e) => { setPassword(e.target.value) }} />
        <button>
          Log in
        </button>
        <div className="forgotPass">
          Forgot Password
        </div>
        <div class="separator">
          <span>or</span>
        </div>
        <button onClick={() => { nav('/Register') }}>
          Create Account
        </button>
      </form>
      <div className="absoCon">
        Developed by Marcus
      </div>
    </div >
  )
}

export default Login
