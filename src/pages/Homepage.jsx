import React, { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';

const Homepage = () => {


    const [splineEl, setSplineEl] = useState(null)

    useEffect(() => {
        axios.get('https://prod.spline.design/mMs2UHpZ5GhupVia/scene.splinecode')
            .then((res) => {
                setSplineEl(res.status)
            }).catch((err) => {
                console.log(err)
            })
    }, [])


    const nav = useNavigate()


    const [loading, setLoading] = useState(false)


    useEffect(() => {
        console.log(loading)
    }, [loading])
    return (
        <div className='Homepage'>
            {splineEl ?
                <>
                    <div className="absoHeader">
                        <div className="logo">
                            Mingle
                        </div>

                        <div className="menu">
                            <div
                                onClick={() => {

                                    nav('/SignIn')
                                }}
                                className="loginBtn btns">
                                Log In
                            </div>
                            <div
                                onClick={() => { nav('/Register') }}
                                className="signUp btns">
                                Sign In
                            </div>
                        </div>
                    </div>

                    <div className="absoBg">
                        {loading ? <></> : <>loading...</>}
                        <Spline
                            scene="https://prod.spline.design/mMs2UHpZ5GhupVia/scene.splinecode"
                            onLoad={() => {
                                setLoading(true);
                                console.log("Scene loaded");
                            }}
                        />
                        <div className="exp">
                            <div
                                onClick={() => {

                                    nav('/SignIn')
                                }}
                                className="btns">
                                Try Mingle now <ion-icon name="arrow-redo-outline"></ion-icon>
                            </div>

                            <div className="desc">
                                <div className="descItem">Developed,</div>
                                <div className="descItem">Designed</div>
                                <div className="descItem">And Maintained</div>
                                <div className="descItem">By Marcus S.</div>
                            </div>
                        </div>
                    </div>

                    <div className="about">

                    </div>
                </>
                :
                <>loading...</>

            }

        </div>
    )
}

export default Homepage
