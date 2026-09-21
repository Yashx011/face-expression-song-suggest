import { useEffect, useRef, useState } from "react";
import {init, detect} from "../utils/utils";

export default function FaceExpression() {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [expression, setExpression] = useState("Detecting...");

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

  return (
    <div className="expression" style={{ textAlign: "center" }}>
      <video
        ref={videoRef}
        style={{
          width: "400px",
          borderRadius: "12px"
        }}
        playsInline
      />

      <br />

      <button className="button" onClick={() => {
        detect({landmarkerRef, videoRef, setExpression})}}>
        Detect Expression
      </button>

      <h2>{expression}</h2>
    </div>
  );
} 