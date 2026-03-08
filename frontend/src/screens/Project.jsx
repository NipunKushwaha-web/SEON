// ==========================================
// 1. IMPORTS & DEPENDENCIES
// ==========================================
import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js' 
import { getWebContainer } from '../config/webcontainer'

// Custom Components
import CollaboratorButton from '../components/CollaboratorButton.jsx'
import BlasterButton from '../components/BlasterButton.jsx'
import DraggableCard from '../components/DraggableCard.jsx'

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================
// Yeh component Markdown ke andar aane wale code blocks ko color/highlight karta hai
function SyntaxHighlightedCode(props) {
    const ref = useRef(null)
    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-')) {
            hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])
    return <code {...props} ref={ref} />
}

// ==========================================
// 3. MAIN PROJECT COMPONENT & STATE VARIABLES
// ==========================================
const Project = () => {
    const location = useLocation()
    const { user } = useContext(UserContext)
    
    // UI Toggles (Panels aur Modals ke liye)
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showCard, setShowCard] = useState(false)
    const [renderCard, setRenderCard] = useState(false)
    
    // Data States (Users aur Project ki details)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [users, setUsers] = useState([])
    const [project, setProject] = useState(location.state?.project || {})
    
    // Chat States (Messages handle karne ke liye)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const messageBox = useRef(null)
    
    // Code Editor & File System States
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    
    // WebContainer & Terminal States (Code run karne ke liye)
    const [webContainer, setWebContainer] = useState(null)
    const webContainerRef = useRef(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)

    // Collaborator Add karne ka status
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState(null)
    const [addSuccess, setAddSuccess] = useState(null)

    // ==========================================
// 4. HELPER FUNCTIONS (Logic & Actions)
// ==========================================

    // WebContainer ref ko state ke sath sync rakhna
    useEffect(() => {
        webContainerRef.current = webContainer
    }, [webContainer])

    // Draggable card ka animation handle karna
    useEffect(() => {
        let timer
        if (showCard) {
            setRenderCard(true)
        } else {
            timer = setTimeout(() => setRenderCard(false), 400)
        }
        return () => timer && clearTimeout(timer)
    }, [showCard])

    // Naye users select/deselect karna UI mein
    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId)
            if (newSelectedUserId.has(id)) newSelectedUserId.delete(id)
            else newSelectedUserId.add(id)
            return newSelectedUserId
        })
    }

    // Backend API call: Project mein naye users add karna
    function addCollaborators() {
        setAdding(true)
        setAddError(null)
        setAddSuccess(null)
        const projectId = project?._id || location.state?.project?._id
        
        if (!projectId) { setAddError("No project specified"); setAdding(false); return }
        if (!selectedUserId || selectedUserId.size === 0) { setAddError("Please select at least one user"); setAdding(false); return }
        
        axios.put("/projects/add-user", {
            projectId,
            users: Array.from(selectedUserId)
        }).then(res => {
            setAddSuccess("Collaborators added successfully")
            setIsModalOpen(false)
            setSelectedUserId(new Set())
            setAdding(false)
            setProject(prev => ({
                ...prev,
                users: [...(prev.users || []), ...(res.data.addedUsers || [])]
            }))
        }).catch(err => {
            setAddError(err?.response?.data?.message || "Error adding collaborators")
            setAdding(false)
        })
    }

    // Socket.io se naya message bhejna (Chatbox)
    const send = () => {
        if (!message.trim() || !user) return
        try {
            sendMessage('project-message', { message, sender: user })
            setMessage("")
        } catch (err) { console.log(err) }
    }

    // AI ka JSON message read karke UI (Markdown) mein dikhana
    function WriteAiMessage(message) {
        let messageObject
        try { messageObject = typeof message === "string" ? JSON.parse(message) : message } 
        catch (e) { messageObject = { text: "Invalid AI response" } }
        return (
            <div className='overflow-auto p-2'>
                <Markdown children={messageObject.text || ""} options={{ overrides: { code: SyntaxHighlightedCode } }} />
            </div>
        )
    }

    // Code likhne par file tree ko backend mein save karna
    function saveFileTree(ft) {
        if (!ft || !project?._id) return
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {}).catch(err => {})
    }

    // Jab naya chat message aaye, toh automatically neeche scroll karna
    function scrollToBottom() {
        if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
    }
    useEffect(() => { scrollToBottom() }, [messages])

// ==========================================
// 5. MAIN USE-EFFECT (Mounting, Sockets, API)
// ==========================================
    useEffect(() => {
        let unsubscribes = []
        let socketInitialized = false
        let isEffectActive = true

        // 5a. Socket.io Connection Start
        if (project?._id) {
            try {
                initializeSocket(project._id)
                socketInitialized = true
            } catch (e) { console.log(e) }
        }

        // 5b. WebContainer Boot karna (Browser mein Node.js chalane ke liye)
        if (!webContainerRef.current) {
            getWebContainer().then(container => {
                if (isEffectActive) setWebContainer(container)
            })
        }

        // 5c. Incoming Messages Handle karna (Human + AI dono ke liye)
        const handleProjectMessage = data => {
            try {
                if (data?.sender && data.sender._id === 'ai') {
                    let message = typeof data.message === "string" ? JSON.parse(data.message) : data.message
                    // Agar AI ne code file bheji hai, toh usey editor aur webcontainer me mount karo
                    if (message.fileTree) {
                        try { webContainerRef.current?.mount && webContainerRef.current.mount(message.fileTree) } 
                        catch (mountErr) { console.log("Failed to mount fileTree", mountErr) }
                        setFileTree(message.fileTree)
                    }
                }
                setMessages(prevMessages => [...prevMessages, data])
            } catch (e) { console.log(e) }
        }

        const unsub = receiveMessage('project-message', handleProjectMessage)
        if (typeof unsub === "function") unsubscribes.push(unsub)

        // 5d. API Data Fetching (Project Info & User List)
        let projectId = location.state?.project?._id || project?._id
        if (projectId) {
            axios.get(`/projects/get-project/${projectId}`).then(res => {
                setProject(res.data.project)
                setFileTree(res.data.project.fileTree || {})
            }).catch(err => { console.log(err) })
        }
        
        axios.get('/user/all').then(res => setUsers(res.data.user || [])).catch(err => console.log(err))

        // Cleanup function (Component unmount hone par chalega)
        return () => {
            isEffectActive = false
            unsubscribes.forEach(u => u())
        }
    }, [project?._id]) 

// ==========================================
// 6. UI RENDER (HTML/JSX Structure)
// ==========================================
    return (
        <main className='h-screen w-screen flex'>
            
            {/* --- LEFT SECTION: Chat & Collaborators --- */}
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0 rounded-br-lg rounded-bl-lg'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)} type="button">
                        <i className="ri-add-fill mr-1"></i><p>Add collaborator</p>
                    </button>
                    <CollaboratorButton showCard={showCard} setShowCard={setShowCard} />
                    {renderCard && <DraggableCard isClosing={!showCard} onClose={() => setShowCard(false)} />}
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    {/* Chat Messages List */}
                    <div ref={messageBox} className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                        {Array.isArray(messages) && messages
                            .filter((msg, index, arr) => index === 0 ? true : JSON.stringify(arr[index-1]) !== JSON.stringify(msg))
                            .map((msg, index) => {
                                const isAi = msg.sender && msg.sender._id === 'ai';
                                const isMe = msg.sender && user && String(msg.sender._id) === String(user._id);

                                return (
                                <div key={msg._id || `${msg.sender?.email || 'unknown'}-${index}`}
                                    className={`${isAi ? 'max-w-80 bg-slate-950 text-white' : 'max-w-52 bg-slate-50 text-slate-800'} ${isMe ? 'ml-auto' : ''}  message flex flex-col p-2 w-fit rounded-md`}
                                >
                                    <small className='opacity-65 text-xs'>{msg.sender?.email || "Unknown"}</small>
                                    <div className='text-sm'>{isAi ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}</div>
                                </div>
                            )})}
                    </div>

                    {/* Chat Input Box */}
                    <div className="inputField w-full flex absolute bottom-0">
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="p-2 px-4 border-none outline-none flex-grow rounded-md resize-none"
                                    placeholder="Type your message here..."
                                    style={{ /* Styles omitted for brevity */ minHeight: '48px', maxHeight: '112px', borderRadius: '8px', fontSize: '1rem', marginRight: '4px', marginLeft: '6px', background: '#fff', overflowY: 'auto', boxSizing: 'border-box', marginBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    rows={1}
                                    onInput={e => {
                                        e.target.style.height = '40px';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                                    }}
                                />
                                <BlasterButton onSend={send} showCard={showCard} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Panel: Connected Users List */}
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>
                        <h1 className='font-semibold text-lg'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2' type="button"><i className="ri-close-fill"></i></button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {(project.users || []).map((u, index) => (
                            <div key={u._id || index} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                <div className='aspect-square rounded-full p-5 text-white bg-slate-600'><i className="ri-user-fill absolute"></i></div>
                                <h1 className='font-semibold text-lg'>{u.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- RIGHT SECTION: Code Editor & Preview --- */}
            <section className="right bg-red-50 flex-grow h-full flex">
                
                {/* File Explorer (Left sidebar in right section) */}
                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree || {}).map((file) => (
                            <button key={file} onClick={() => { setCurrentFile(file); setOpenFiles(ofs => [...new Set([...ofs, file])]) }} className="tree-element p-2 px-4 flex items-center gap-2 bg-slate-300 w-full" type="button">
                                <p className='font-semibold text-lg'>{file}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Code Editor Area */}
                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full">
                        {/* Open File Tabs */}
                        <div className="files flex">
                            {openFiles.map((file) => (
                                <button key={file} onClick={() => setCurrentFile(file)} className={`open-file p-2 px-4 flex w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`} type="button">
                                    <p className='font-semibold text-lg'>{file}</p>
                                </button>
                            ))}
                        </div>
                        {/* Run Button (npm install & npm start) */}
                        <div className="actions flex gap-2">
                            <button type="button" onClick={async () => {
                                    if (!webContainerRef.current) return
                                    try {
                                        await webContainerRef.current.mount(fileTree)
                                        const installProcess = await webContainerRef.current.spawn("npm", [ "install" ])
                                        await (installProcess?.output?.pipeTo?.(new WritableStream({ write(chunk) {} })) || Promise.resolve())
                                        if (runProcess) { try { runProcess.kill() } catch (e) {} }
                                        let tempRunProcess = await webContainerRef.current.spawn("npm", [ "start" ])
                                        await (tempRunProcess?.output?.pipeTo?.(new WritableStream({ write(chunk) {} })) || Promise.resolve())
                                        setRunProcess(tempRunProcess)
                                        const readyHandler = (port, url) => setIframeUrl(url)
                                        webContainerRef.current.off && webContainerRef.current.off('server-ready')
                                        webContainerRef.current.on('server-ready', readyHandler)
                                    } catch (err) { console.log(err) }
                                }} className='p-2 px-4 bg-slate-300 text-white'>
                                run
                            </button>
                        </div>
                    </div>
                    
                    {/* Text Editor Input Box */}
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {fileTree && currentFile && fileTree[currentFile] && fileTree[currentFile].file && (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none" contentEditable suppressContentEditableWarning
                                        onBlur={e => {
                                            const updatedContent = e.target.textContent
                                            if (fileTree[currentFile].file.contents !== updatedContent) {
                                                const ft = { ...fileTree, [currentFile]: { file: { contents: updatedContent } } }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: (() => {
                                                try {
                                                    let ext = currentFile.split('.').pop()
                                                    let lang = hljs.getLanguage(ext) ? ext : 'javascript'
                                                    return hljs.highlight(lang, fileTree[currentFile].file.contents || '').value
                                                } catch (e) { return fileTree[currentFile].file.contents || "" }
                                            })()
                                        }}
                                        style={{ whiteSpace: 'pre-wrap', paddingBottom: '25rem', counterSet: 'line-numbering' }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mini Browser (Live Preview of App) */}
                {iframeUrl && webContainerRef.current &&
                    (<div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar"><input type="text" onChange={e => setIframeUrl(e.target.value)} value={iframeUrl || ""} className="w-full p-2 px-4 bg-slate-200" /></div>
                        <iframe src={iframeUrl || ""} className="w-full h-full" title="project-preview" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
                    </div>)
                }
            </section>

            {/* --- MODAL: Add New Collaborators --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2' type="button"><i className="ri-close-fill"></i></button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map((u, index) => (
                                <div key={u._id || index} className={`user cursor-pointer hover:bg-slate-200 ${selectedUserId && selectedUserId.has(u._id) ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(u._id)}>
                                    <div className='aspect-square relative rounded-full p-5 text-white bg-slate-600'><i className="ri-user-fill absolute"></i></div>
                                    <h1 className='font-semibold text-lg'>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        {addError && <div className="absolute left-1/2 -translate-x-1/2 bottom-16 text-red-500 text-center">{addError}</div>}
                        {addSuccess && <div className="absolute left-1/2 -translate-x-1/2 bottom-16 text-green-600 text-center">{addSuccess}</div>}
                        <button type="button" disabled={adding} onClick={addCollaborators} className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md ${adding ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {adding ? 'Adding...' : 'Add Collaborators'}
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project