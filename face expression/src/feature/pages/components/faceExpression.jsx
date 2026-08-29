import { useEffect, useRef, useState } from "react";

import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

export default function FaceExpression() {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const detectRef = useRef(null);

  const [expression, setExpression] = useState("Detecting...");

  useEffect(() => {
    let stream;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      landmarkerRef.current = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        }
      );

      stream = await navigator.mediaDevices.getUserMedia({ video: true });

      videoRef.current.srcObject = stream;

      await videoRef.current.play().catch(() => {});

      if (videoRef.current.readyState >= 2) {
        detect();
      }
    };

    const detect = () => {
      if (!landmarkerRef.current || !videoRef.current) return;

      if (
        videoRef.current.readyState < 2 ||
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        return;
      }

      try {
        const results = landmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now()
        );

        if (results.faceBlendshapes?.length > 0) {
          const blendshapes =
            results.faceBlendshapes[0].categories;

          const getScore = (name) =>
            blendshapes.find(
              (b) => b.categoryName === name
            )?.score || 0;

          const smileLeft =
            getScore("mouthSmileLeft");

          const smileRight =
            getScore("mouthSmileRight");

          const jawOpen =
            getScore("jawOpen");

          const browUp =
            getScore("browInnerUp");

          const frownLeft =
            getScore("mouthFrownLeft");

          const frownRight =
            getScore("mouthFrownRight");

          let currentExpression = "Neutral";

          if (
            smileLeft > 0.3 &&
            smileRight > 0
          ) {
            currentExpression = "Happy 😊";
          } else if (
            jawOpen > 0.2 &&
            browUp > 0.2
          ) {
            currentExpression = "Surprised 😮";
          } else if (
            frownLeft > 0.01 &&
            frownRight > 0.01
          ) {
            currentExpression = "Sad 😢";
          }

          setExpression(currentExpression);
        }
      } catch (error) {
        console.log(error);
      }
    };

    detectRef.current = detect;

    init();

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

      <button className="button" onClick={() => detectRef.current?.()}>
        Detect Expression
      </button>

      <h2>{expression}</h2>
    </div>
  );
}