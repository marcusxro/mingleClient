import React, { useState } from 'react'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import gsap from 'gsap'
import { authentication } from './FirebaseKey';
import { useNavigate } from 'react-router-dom';

import axios from 'axios'


const Register = () => {

    const [email, setEmail] = useState('')
    const [fullname, setFullname] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [Reppassword, setRepPassword] = useState('')

    const clearInputs = () => {
        setEmail('')
        setFullname('')
        setUsername('')
        setPassword('')
        setRepPassword('')
    }
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
    const nav = useNavigate()
    const CreateAccountForUser = (ev) => {
        ev.preventDefault()
        if (!email) {
            gsap.to('.Register .email', {
                outline: '1px solid red'
            })
        }
        if (!fullname) {
            gsap.to('.Register .fullname', {
                outline: '1px solid red'
            })
        }
        if (!username) {
            gsap.to('.Register .username', {
                outline: '1px solid red'
            })
        }
        if (!username) {

            gsap.to('.Register .email', {
                outline: '1px solid red'
            })
        }

        if (!username || !fullname || !email) {
            errorModal('Input fields cannot be empty')
        }
        if (!password || !Reppassword) {
            errorModal('Password fields cannot be empty')
            gsap.to(['.Register .repPass', '.Register .password'], {
                outline: '1px solid red'
            })
        }
        if (password != Reppassword) {
            errorModal('Password input are not matched')
            gsap.to(['.Register .repPass', '.Register .password'], {
                outline: '1px solid red'
            })
            setPassword('')
            setRepPassword('')
        }

        if (password.length <= 8 && Reppassword.length <= 8) {
            errorModal('Please make it longer')
            return
        }

        createUserWithEmailAndPassword(authentication, email, password)
            .then((userCred) => {
                if (userCred) {
                    sendEmailVerification(authentication.currentUser) //verifiy users so they can't spam accounts to server
                        .then(() => {
                            const user = authentication.currentUser;
                            if (user && !user.emailVerified) {

                                notif()

                                axios.post('http://localhost:8080/GetAcc', {
                                    Email: email,
                                    Fullname: fullname,
                                    Username: username,
                                    Password: password,
                                    Uid: user.uid,
                                    isBanned: false
                                }).then(() => {
                                    console.log("details sent")
                                    clearInputs()
                                    gsap.to(['.Register .repPass',
                                        '.Register .password',
                                        '.Register .email',
                                    '.Register .username',
                                    '.Register .fullname',
                                     '.Register .repPass'],
                                        
                                        {
                                        outline: 'none'
                                    })
                                }).catch((err) => {
                                    console.log(err)
                                })
                            } else {
                                nav('/')
                            }
                        }).catch((err) => {
                            console.log("errors: " + err)
                        })
                } else {
                    nav("/")
                }
            }).catch((err) => {
                if (err.code === 'auth/email-already-in-use') {
                    errorModal('Email already in use');
                    gsap.to('.Register .email', {
                        outline: '1px solid red'
                    })
                }
            })
    }


    return (
        <div className='Register'>
            <ToastContainer />
            <form onSubmit={CreateAccountForUser}>
                <div className="title">
                    Create your Mingle account
                </div>
                <input className='email' type="email" placeholder='Email'
                    value={email} onChange={(e) => { setEmail(e.target.value) }} />
                <input className='fullname' type="text" placeholder='Fullname'
                    value={fullname} onChange={(e) => { setFullname(e.target.value) }} />
                <input className='username' type="text" placeholder='Username'
                    value={username} onChange={(e) => { setUsername(e.target.value) }} />
                <input className='password' type="password" placeholder='Password'
                    value={password} onChange={(e) => { setPassword(e.target.value) }} />
                <input className='repPass' type="password" placeholder='Repeat Password'
                    value={Reppassword} onChange={(e) => { setRepPassword(e.target.value) }} />
                <button>Create Account</button>
                <div className="nav">
                    Already have account? <span onClick={() => {nav('/Login')}}>Log in</span>
                </div>
            </form>

            <div className="absoCon">
                Developed by Marcus
            </div>
        </div>
    )
}

export default Register
