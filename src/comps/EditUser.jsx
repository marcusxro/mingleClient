import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, unlink } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import Header from '../comps/Header';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import SIdebar from '../comps/SIdebar';
import PostModal from '../comps/PostModal';
import moment from 'moment'

import { io } from 'socket.io-client';
import CommentModal from '../comps/CommentModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditUser = ({ onClose }) => {

    const [userId, setUserId] = useState('')


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


    const [showPfpModal, setShowPfpModal] = useState(false)
    const handlePfpClick = (e) => {
        e.stopPropagation();
        setShowPfpModal(true);
    };

    const [pfpImg, setPfpImg] = useState(null)


    useEffect(() => {
        console.log(pfpImg)
    }, [pfpImg])


    const notif = () => {
        toast.success('Pofile details successfully updated!', {
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


    const changePfp = () => {
        if (!pfpImg) {
            console.log('No file selected');
            return;
        }

        const formData = new FormData();
        formData.append("image", pfpImg);
        formData.append("UID", userId)
        axios.post('http://localhost:8080/upload-profile', formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then(() => {
            console.log("Submitted");
            notif()
        }).catch((err) => {
            console.error(err);
        });
    };

    const pfpPath = filteredAcc[0] && filteredAcc[0].Pfp ? require(`../profiles/${filteredAcc[0].Pfp}`) : null;

    const [pfpPreview, setPfpPreview] = useState(null);

    useEffect(() => {
        if (pfpImg) {
            const previewUrl = URL.createObjectURL(pfpImg);
            setPfpPreview(previewUrl);

            return () => {
                URL.revokeObjectURL(previewUrl); // Cleanup the URL object
            };
        }
    }, [pfpImg]);

    

    const getPfp = (pfp) => {
        setPfpImg(pfp)
    }



    return (
        <div className='EditUser' onClick={(e) => {
            <ToastContainer />
            if (showPfpModal) {
                setShowPfpModal(false)
                e.stopPropagation();
            } else {
                e.stopPropagation();
            }
        }}>
            {
                filteredAcc[0] ?
                    <>
                        <div
                            className="pfpCon">
                            <div
                                onClick={() => {
                                    setShowPfpModal(true)
                                }}
                                className="pfp">
                                <img src={pfpPreview || pfpPath} alt="Profile Picture" />                              </div>
                            {
                                showPfpModal ?
                                    <div
                                        onClick={(e) => { e.stopPropagation() }}
                                        className="modal">
                                        <div className="modalItem">
                                            <input
                                                onChange={(e) => { getPfp(e.target.files[0]) }}
                                                placeholder="Upload Profile"
                                                type="file"
                                                accept="image/*"
                                            />

                                        </div>
                                        <div className="modalItem">
                                            Remove Profile
                                        </div>
                                    </div>
                                    : <></>
                            }
                        </div>
                        <div className="name">
                            <div className="title">
                                Fullname
                            </div>
                            <div className="inputCon">
                                <input
                                    readOnly
                                    placeholder={`${filteredAcc[0] && filteredAcc[0].Fullname}`}
                                    type="text" />
                            </div>
                        </div>
                        <div className="infoCon">
                            <div className="title">
                                Username
                            </div>
                            <div className="inputCon">
                                <input
                                    placeholder={`${filteredAcc[0] && filteredAcc[0].Username}`}
                                    type="text" />
                            </div>
                        </div>
                        <div className="infoCon">
                            <div className="title">
                                Bio
                            </div>
                            <div className="inputCon">
                                <input
                                    placeholder='+ Write your bio'
                                    type="text" />
                            </div>
                        </div>
                        <div className="infoCon">
                            <div className="title">
                                Website
                            </div>
                            <div className="inputCon">
                                <input
                                    placeholder='+ Add your website'
                                    type="text" />
                            </div>
                        </div>
                        <div className="privProf">
                            <div className="text">
                                Private Profile
                            </div>
                            <input type="checkbox" />
                        </div>
                        <div className="btnCon">
                            <button
                                onClick={() => {
                                    changePfp()
                                }}>
                                Save
                            </button>
                        </div>
                    </>
                    : <div className="loading">
                        loading...
                    </div>
            }
        </div>
    )
}

export default EditUser
