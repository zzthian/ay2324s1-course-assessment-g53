import { useCallback, useEffect, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

const SAVE_INTERVAL_MS = 2000

function TextEditor() {
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  // Connect to Collab Service
  useEffect(() => {
    const s = io("http://localhost:9000")
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  // Get document from backend
  useEffect(() => {
    if (socket == null || quill == null) return
    
    socket.once("load-document", document => {
      quill.setContents(document)
      quill.enable()
    })

    socket.emit('get-document', documentId)
  }, [socket, quill, documentId])
  
  // Send changes by the client to the server
  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return
      socket.emit("send-changes", delta)
    }

    quill.on('text-change', handler)

    return () => {
      quill.off('text-change', handler)
    }
  }, [socket, quill])
  
  
  // Recieve changes from server
  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta) => {
      quill.updateContents(delta)
    }

    socket.on('recieve-changes', handler)

    return () => {
      socket.off('recieve-changes', handler)
    }
  }, [socket, quill])
    
  // Save document to backend at regular intervals
  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill])

  // Create Quill instance
  const wrapperRef = useCallback((wrapper) => {
      if (wrapper == null) return

      wrapper.innerHTML = ""
      const editor = document.createElement('div')
      wrapper.append(editor)
      const q = new Quill(editor, {theme : "snow"})
      q.disable()
      q.setText("Loading...")
      setQuill(q)
  }, [])

  return (
    <div id = "container" ref = {wrapperRef}></div>
  )
}

export default TextEditor
