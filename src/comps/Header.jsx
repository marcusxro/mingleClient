import React, { useState, useEffect } from 'react'
import gsap from 'gsap'
import { signOut } from 'firebase/auth';
import { authentication } from '../pages/FirebaseKey';
import { useNavigate } from 'react-router-dom';

const Header = ({ userObj }) => {

    const [bool, setBool] = useState(false);
    const nav = useNavigate()
    const handleClickInside = (e) => {
        if (e) {
            e.stopPropagation(); // Prevent click event propagation
        }
    };



    useEffect(() => {

        gsap.set('.Header .menuEl', { scale: 0 }); // Initial scale
    }, []);


    const signOutUser = () => {
        signOut(authentication)
            .then(() => {
                console.log("completed")
                nav('/')
            })
            .catch((err) => { console.log(err) })
    }

    const scaleUp = () => {
        if (!bool) {
            gsap.to('.Header .menuEl', {
                scale: 1,
                duration: 0.3,
                ease: 'power2.inOut' // Optional easing
            });
            document
                .querySelector('.closer')
                .addEventListener("click", () => {
                    gsap.to('.Header .menuEl', {
                        scale: 0,
                        duration: 0.3,
                        ease: 'power2.inOut' // Optional easing
                    });
                })
            setBool(true);
        } else {
            gsap.to('.Header .menuEl', {
                scale: 0,
                duration: 0.3,
                ease: 'power2.inOut' // Optional easing
            });
            setBool(false);
        }
    };

    return (
        <div className='Header'>
            <div className="menuEl" onClick={() => { handleClickInside() }}>
                <div className="menuItem">
                    <ion-icon name="settings-outline"></ion-icon> Settings
                </div>
                <div className="menuItem">
                    <ion-icon name="document-outline"></ion-icon>  Report
                </div>
                <div className="menuItem logout" onClick={() => { signOutUser() }}>
                    <ion-icon name="log-out-outline"></ion-icon>  Log out
                </div>
            </div>
            {userObj[0] ?
                <>
                    <div className="user">
                        {userObj[0] && userObj[0].Username.length > 10 ?
                            userObj[0].Username.slice(0, 10) + '...' :
                            userObj[0] && userObj[0].Username}

                    </div>
                    <div className="midContent">
                        <div
                            onClick={() => { nav('/feed') }}
                            className="headerItem">
                            <ion-icon name="home-outline"></ion-icon>
                        </div>
                        <div 
                             onClick={() => { nav('/Search') }}
                        className="headerItem">
                            <ion-icon name="search-outline"></ion-icon>
                        </div>
                        <div className="headerItem">
                            <ion-icon name="mail-outline"></ion-icon>
                            {/* <ion-icon name="mail-unread-outline"></ion-icon> */}
                        </div>
                        <div className="headerItem">
                            <ion-icon name="compass-outline"></ion-icon>
                        </div>
                        <div className="headerItem">
                            <ion-icon name="notifications-outline"></ion-icon>
                        </div>
                        <div
                            onClick={() => { nav('/profile') }}
                            className="headerItem">
                            <ion-icon name="person-outline"></ion-icon>
                        </div>
                    </div>
                    <div
                        onClick={() => { scaleUp() }}
                        className="menu">
                        <ion-icon name="menu-outline"></ion-icon>
                    </div>
                </> :
                <>
                    <div className="user">
                        user
                    </div>
                    <div className="midContent">
                        <div className="headerItem">
                            <ion-icon name="home-outline"></ion-icon>
                        </div>
                        <div className="headerItem">
                            <ion-icon name="search-outline"></ion-icon>
                        </div>
                        <div className="headerItem">
                            <ion-icon name="compass-outline"></ion-icon>
                        </div>
                        <div className="headerItem">
                            <ion-icon name="person-outline"></ion-icon>
                        </div>
                    </div>
                    <div className="menu" onClick={() => {
                        scaleUp()
                    }}>
                        <ion-icon name="menu-outline"></ion-icon>
                    </div>
                </>
            }
        </div>
    )
}

export default Header
