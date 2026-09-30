
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

export const init = async ({ landmarkerRef, videoRef, streamRef }) => {
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

      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });

      videoRef.current.srcObject = streamRef.current;

      await videoRef.current.play().catch(() => { });

      if (videoRef.current.readyState >= 2) {
        
      }
    };

    export const detect = ({landmarkerRef, videoRef , setExpression, setConfidence, setDetectionStatus}) => {
      if (!landmarkerRef.current || !videoRef.current) {
        if (setDetectionStatus) setDetectionStatus("error");
        return { status: "error" };
      }

      if (
        videoRef.current.readyState < 2 ||
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        if (setDetectionStatus) setDetectionStatus("error");
        return { status: "error" };
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
          let rawConfidence = 0;

          if (
            smileLeft > 0.3 &&
            smileRight > 0
          ) {
            currentExpression = "Happy 😊";
            rawConfidence = ((smileLeft + smileRight) / 1.5) * 100;
          } else if (
            jawOpen > 0.2 &&
            browUp > 0.2
          ) {
            currentExpression = "Surprised 😮";
            rawConfidence = ((jawOpen + browUp) / 1.5) * 100;
          } else if (
            frownLeft > 0.01 &&
            frownRight > 0.01
          ) {
            currentExpression = "Sad 😢";
            rawConfidence = ((frownLeft + frownRight) / 0.5) * 100;
          } else {
            const happyIntensity = (smileLeft + smileRight) / 1.5;
            const surprisedIntensity = (jawOpen + browUp) / 1.5;
            const sadIntensity = (frownLeft + frownRight) / 0.5;
            const maxExpressionIntensity = Math.max(happyIntensity, surprisedIntensity, sadIntensity);
            rawConfidence = (1 - maxExpressionIntensity) * 100;
          }

          const confidence = Math.min(100, Math.max(0, Math.round(rawConfidence)));

          if (setExpression) {
            setExpression(currentExpression);
          }
          if (setConfidence) {
            setConfidence(confidence);
          }
          if (setDetectionStatus) {
            setDetectionStatus("detected");
          }

          return { expression: currentExpression, confidence, status: "detected" };
        } else {
          if (setDetectionStatus) {
            setDetectionStatus("no-face");
          }
          return { status: "no-face" };
        }
      } catch (error) {
        console.log(error);
        if (setDetectionStatus) {
          setDetectionStatus("error");
        }
        return { status: "error" };
      }
    };