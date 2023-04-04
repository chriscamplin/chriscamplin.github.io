import { useEffect, useState } from 'react'

const RecordCanvas = ({ canvRef }) => {
  const [recording, setRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState([])

  const FPS = 30
  const handleClick = () => {
    setRecording(!recording)
  }
  useEffect(() => {
    let mediaRecorder
    console.log('Recording', recording)

    if (recording) {
      const stream = canvRef.current.captureStream(FPS)
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;avc1,opus',
        videoBitsPerSecond: 8000000,
      })

      mediaRecorder.ondataavailable = (e) => {
        console.log({ d: e.data })

        if (e.data.size > 0) {
          setRecordedChunks([e.data])
        }
      }
      mediaRecorder.start()
    } else if (recordedChunks.length !== 0) {
      // recordBtn.textContent = 'Record'
      mediaRecorder?.stop()
      setTimeout(() => {
        const blob = new Blob(recordedChunks, {
          type: 'video/webm',
        })
        console.log({ blob, recordedChunks })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'recording.webm'
        a.click()
        URL.revokeObjectURL(url)
      }, 0)
    }
  }, [recording, recordedChunks, canvRef])

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 10,
        color: 'white',
      }}
    >
      {!recording ? 'Start Recording' : 'Stop Recording'}
    </button>
  )
}

export default RecordCanvas
