import { useEffect, useRef, useState } from "react";
import {init, detect} from "../utils/utils";

export default function FaceExpression({ onExpressionDetected, onConfidenceChange }) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [expression, setExpression] = useState("Neutral");
  const [confidence, setConfidence] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState("ready");

  useEffect(() => {
    if (onConfidenceChange) {
      onConfidenceChange(confidence);
    }
  }, [confidence, onConfidenceChange]);

  useEffect(() => {
    init({landmarkerRef, videoRef, streamRef});

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleDetectClick = () => {
    setDetectionStatus("detecting");
    setTimeout(() => {
      try {
        const result = detect({
          landmarkerRef,
          videoRef,
          setExpression,
          setConfidence,
          setDetectionStatus
        });

        if (result && result.status === "detected" && result.expression) {
          let mood = null;
          if (result.expression.includes("Happy")) mood = "happy";
          else if (result.expression.includes("Sad")) mood = "sad";
          else if (result.expression.includes("Surprised")) mood = "surprised";
          else if (result.expression.includes("Neutral")) mood = "neutral";

          if (mood && onExpressionDetected) {
            onExpressionDetected(mood, { expression: result.expression, confidence: result.confidence });
          }
        }
      } catch (err) {
        console.error("Detection error:", err);
        setDetectionStatus("error");
      }
    }, 100);
  };

  const getButtonText = () => {
    switch (detectionStatus) {
      case "detecting":
        return "Detecting...";
      case "detected":
        return "Detect Again";
      case "no-face":
      case "error":
        return "Try Again";
      case "ready":
      default:
        return "Detect Expression";
    }
  };

  return (
    <div className="face-expression-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="webcam-video"
          playsInline
        />
        {detectionStatus === "detecting" && (
          <div className="video-overlay detecting-overlay">
            <div className="pulse-ring"></div>
            <span>Analyzing face...</span>
          </div>
        )}
      </div>

      <button
        className="button detect-btn"
        onClick={handleDetectClick}
        disabled={detectionStatus === "detecting"}
      >
        {getButtonText()}
      </button>

      {detectionStatus === "no-face" && (
        <div className="status-notice warning-notice">
          <span>⚠️</span> No face detected. Please center your face in the camera.
        </div>
      )}

      {detectionStatus === "error" && (
        <div className="status-notice error-notice">
          <span>❌</span> Could not detect expression. Please check your camera connection.
        </div>
      )}

      {detectionStatus === "detected" && (
        <div className="result-display">
          <h2 className="expression-title">{expression}</h2>
          <p className="confidence-text">
            {confidence}% confidence
          </p>
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


 