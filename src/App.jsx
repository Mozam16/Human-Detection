import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setLoading(false);
      startVideo();
    };

    loadModels();
  }, []);

  // Start webcam
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  // Detect faces
  const handleVideoPlay = () => {
    setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      const canvas = canvasRef.current;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const resized = faceapi.resizeResults(detections, displaySize);

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resized);
    }, 100);
  };

  return (
    <div className="container">
      <h2>Face Detection App</h2>

      {loading && <p>Loading AI models...</p>}

      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoPlay}
        />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default App;