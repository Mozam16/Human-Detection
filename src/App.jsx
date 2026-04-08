import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Initializing AI...");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load models 
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setIsLoaded(true);
        setStatus("Models Loaded. Starting Camera...");
        startVideo();
      } catch (err) {
        setStatus("Error loading models. Check /public/models path.");
        console.error(err);
      }
    };
    loadModels();

    // Cleanup tracks on unmount
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 720, height: 560 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setStatus("Webcam access denied.");
        console.error(err);
      });
  };

  const handleVideoPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const displaySize = { 
      width: videoRef.current.videoWidth, 
      height: videoRef.current.videoHeight 
    };
    
    faceapi.matchDimensions(canvasRef.current, displaySize);
    setStatus("System Active");

    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 160, // Smaller = Faster, Larger = More Accurate
      scoreThreshold: 0.5
    });

    const runDetection = async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        
        // Clear previous frame
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);

        // Draw standard overlays
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);

        // Draw custom Age and Gender text
        resizedDetections.forEach((result) => {
          const { age, gender, genderProbability } = result;
          new faceapi.draw.DrawTextField(
            [
              `${Math.round(age)} years old`,
              `${gender} (${Math.round(genderProbability * 100)}%)`
            ],
            result.detection.box.bottomLeft
          ).draw(canvasRef.current);
        });
      }
      requestAnimationFrame(runDetection);
    };

    runDetection();
  };

  return (
    <div className="app-container">
      <header>
        <h1>Amina's Human Detector </h1>
        <p className={`status ${isLoaded ? 'active' : 'loading'}`}>{status}</p>
      </header>

      <div className="view-port">
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