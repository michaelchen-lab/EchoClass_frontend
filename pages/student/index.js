import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import { AuthContext } from '../../contexts/Auth.Context'

import Dashboard from '../../components/student/Dashboard'
import Leaderboard from '../../components/student/Leaderboard'

const StudentHome = () => {
    const router = useRouter()
    const { auth, getAccessToken } = useContext(AuthContext)

    const [isTasks, setIsTasks] = useState(true)

    const [profile, setProfile] = useState()
    const [classroom, setClassroom] = useState()
    const [tasks, setTasks] = useState()
    const [submissionStatuses, setSubmissionStatuses] = useState()
    const [submissions, setSubmissions] = useState()
    const [leaderboard, setLeaderboard] = useState()

    const [wsURL, setWSURL] = useState(null)
    const {
        sendJsonMessage, lastMessage, readyState,
    } = useWebSocket(wsURL, {
        onOpen: () => console.log('opened'),
        onMessage: (msg) => handleMessage(JSON.parse(msg.data)),
        shouldReconnect: (closeEvent) => true
    })

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Disconnected',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    useEffect(() => {
        if (auth.tokens) {
            setWSURL(process.env.NEXT_PUBLIC_BACKEND_WS_BASE+'ws/student/?token='+auth.tokens.access)
        }
    }, [auth.tokens])

    useEffect(() => {
        if (auth.tokens) {
            setWSURL(process.env.NEXT_PUBLIC_BACKEND_WS_BASE+'ws/student/?token='+auth.tokens.access)
        }

        // Get initial data
        getAccessToken().then((accessToken) => {
            axios.get(process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE+'student/initial/', {
                headers: {'Authorization': 'Bearer '+accessToken},
            })
            .then(res => {
                setProfile(res.data.profile)
                setClassroom(res.data.classroom)
                setTasks(res.data.tasks)
                setSubmissions(res.data.submissions)
                setSubmissionStatuses(res.data.submission_statuses)

                console.log(res.data.submission_statuses)
            })

            axios.get(process.env.NEXT_PUBLIC_BACKEND_HTTP_BASE+'student/leaderboard', {
                headers: {'Authorization': 'Bearer '+accessToken},
            })
            .then(res => {
                setLeaderboard(res.data)
            })
        })
    }, [])

    const handleMessage = (msg) => {
        if (Object.keys(msg)[0] === 'task') {
            setTasks([...tasks.filter(t => t.id !== msg.task.id), msg.task])
        } else if (Object.keys(msg)[0] === 'submission') {
            setSubmissions([...submissions.filter(sub => sub.id !== msg.submission.id), msg.submission])
        }
    }

    const statusColor = {Connecting:"text-yellow-600", Connected:"text-green-600", Disconnected:"text-red-600"}
    const statusHexColor = {Connecting:"#D97706", Connected:"#059669", Disconnected:"#DC2626"}

    return (
        <div>
            <Head>
                <title>Student | EchoClass</title>
                <style>{`\
                    .blinking {\
                        animation:blinkingText 3s infinite;\
                    }\
                    @keyframes blinkingText{\
                        0% {color: ${statusHexColor[connectionStatus]}}\
                        49% {color: ${statusHexColor[connectionStatus]}}\
                        70% {color: transparent}\
                        99% {color:transparent}\
                        100% {color: ${statusHexColor[connectionStatus]}}\
                    }\
                `}</style>
            </Head>

            <main className="flex sm:flex-row flex-col min-h-screen">
                <div className="mt-8 ml-4 mr-2 min-w">
                    { classroom && <h1 className="text-3xl font-bold px-2 mb-4">{classroom.name}</h1>}

                    <button className={`${isTasks ? "bg-gray-300" : "hover:bg-gray-200"} focus:outline-none text-lg font-semibold px-2 py-1 mt-1 w-full text-left rounded-lg`} onClick={() => setIsTasks(!isTasks)}>Tasks</button>
                    <button className={`${(!isTasks) ? "bg-gray-300" : "hover:bg-gray-200"} focus:outline-none text-lg font-semibold px-2 py-1 my-1 w-full text-left rounded-lg`} onClick={() => setIsTasks(!isTasks)}>Leaderboard</button>

                </div>
                <div className="bg-gray-100 w-full pt-8 px-8">
                    { isTasks ? <Dashboard {...{tasks, submissions, setSubmissions, submissionStatuses, setSubmissionStatuses, sendJsonMessage}}/> : <Leaderboard {...{profile, leaderboard}} />}
                </div>
                <div className={`fixed bottom-4 right-4 flex flex-row items-center py-1 px-4 rounded-full bg-white shadow-lg ${statusColor[connectionStatus]}`}>
                    <p className="blinking pr-2">???</p>
                    <p>{connectionStatus}</p>
                </div>
            </main>

            <footer>
            </footer>
        </div>
    )
}

export default StudentHome
