import { onAuthStateChanged } from 'firebase/auth'
import { authentication } from '../pages/FirebaseKey';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react'
import gaga from '../profiles/1717985781807photo-1609670530579-fe311b3630cc.avif'

const SIdebar = () => {
    const [userId, setUserId] = useState('')
    const nav = useNavigate()

    useEffect(() => {
        const unsub = onAuthStateChanged(authentication, (user) => {
            if (user) {
                setUserId(user.uid)
            } else {
                console.log("no user")
            }
        })

        return () => { unsub() }
    }, [])

    const [data, setData] = useState([])
    const [nonFiltered, setNonFiltered] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8080/getAccs')
            .then((res) => {
                const filteredData = res.data.filter((itm) => itm.Uid != userId)
                setData(filteredData)
                setNonFiltered(res.data)
            })
            .catch((err) => { console.log(err) })
    }, [data])



    const returnPfpOfUser = (userIden) => {

        const filteredUserForProfile = nonFiltered?.filter((user) => user.Uid === userIden)

        if (filteredUserForProfile[0]?.Pfp) {
            return require(`../profiles/${filteredUserForProfile[0] ?
                filteredUserForProfile[0]?.Pfp : ''}`)
        }
    }

    return (
        <div className='Sidebar'>
            <div className="userList">
                {
                    data[0] ?
                        data.map((itm) => (
                            <div className="user" key={itm._id}>
                                <div className="first">
                                    <div className="pfp">
                                        <img src={returnPfpOfUser(itm.Uid)} alt="" />
                                    </div>
                                    <div className="name">
                                        <span
                                           onClick={() => {
                                            nav(`/SearchedUser/${itm.Uid}`)
                                        }}
                                        >
                                            {itm.Username.length > 10 ? itm.Username.slice(0, 7) + '...' : itm.Username}
                                        </span>
                                        <span>
                                            Suggested for you
                                        </span>
                                    </div>
                                </div>
                                <button>
                                    Follow
                                </button>
                            </div>
                        ))

                        :
                        <div className="skelLoading">
                            <div className="userIns"></div>
                            <div className="userIns"></div>
                            <div className="userIns"></div>
                            <div className="userIns"></div>
                            <div className="userIns"></div>
                        </div>
                }
            </div>
        </div>
    )
}

export default SIdebar
