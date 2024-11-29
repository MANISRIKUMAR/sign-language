const video = document.getElementById("webcam");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");
const gestureName = document.getElementById("gesture-name");
const gestureExplanation = document.getElementById("gesture-explanation");

// Gesture mappings
const gestures = {
  "thumbs_up": "Good",
  "palm_open": "Stop",
  "fist": "Hello",
  "peace": "Peace",
  "ok_sign": "Okay",
  // Add more gestures here
};

// Text-to-Speech Function
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

// Initialize TensorFlow Handpose model
let model;
async function loadModel() {
  model = await handpose.load();
  console.log("Handpose model loaded");
  startWebcam();
}

// Start webcam
async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.addEventListener("loadeddata", predictGestures);
}

// Predict gestures
async function predictGestures() {
  if (!model) return;

  const predictions = await model.estimateHands(video);

  // Clear previous canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw video on canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;

    // Draw landmarks
    drawLandmarks(landmarks);

    // Recognize gesture
    const detectedGesture = recognizeGesture(landmarks);
    if (detectedGesture) {
      const phrase = gestures[detectedGesture];
      const explanation = getGestureExplanation(detectedGesture); // Get explanation

      if (phrase) {
        gestureName.textContent = phrase;  // Display gesture name
        gestureExplanation.textContent = explanation;  // Display gesture explanation
        speak(phrase); // Speak the recognized gesture
      }
    }
  } else {
    gestureName.textContent = "None";
    gestureExplanation.textContent = "No gesture detected";
  }

  requestAnimationFrame(predictGestures);
}

// Function to provide an explanation for each gesture
function getGestureExplanation(gesture) {
  const explanations = {
    "thumbs_up": "This gesture means 'Good' or 'Well done'.",
    "thumbs_down": "This gesture means 'Bad' or 'Not good'.",
    "palm_open": "This gesture means 'Stop'.",
    "fist": "This gesture is often used to say 'Hello'.",
    "peace": "This gesture symbolizes 'Peace'.",
    "ok_sign": "This gesture means 'Okay'.",
    // Add other gestures here with explanations
  };

  return explanations[gesture] || "No explanation available.";
}

// Draw landmarks on canvas
function drawLandmarks(landmarks) {
  for (const [x, y] of landmarks) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

// Recognize gestures based on landmarks
function recognizeGesture(landmarks) {
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const indexTip = landmarks[8];
  const pinkyTip = landmarks[20];

  // Thumbs up: thumb tip above thumb base
  if (thumbTip[1] < thumbBase[1] && indexTip[1] > thumbTip[1]) {
    return "thumbs_up";
  }

  // Palm open: pinky and index far apart
  if (pinkyTip[0] - indexTip[0] > 100) {
    return "palm_open";
  }

  // Fist: landmarks clustered together
  if (Math.abs(thumbTip[0] - pinkyTip[0]) < 50) {
    return "fist";
  }

  // Peace: index and middle fingers apart
  const middleTip = landmarks[12];
  if (
    Math.abs(indexTip[0] - middleTip[0]) > 30 &&
    pinkyTip[0] - middleTip[0] > 100
  ) {
    return "peace";
  }

  // OK Sign: index and thumb forming a circle
  if (Math.abs(thumbTip[0] - indexTip[0]) < 50 && Math.abs(thumbTip[1] - indexTip[1]) < 50) {
    return "ok_sign";
  }

  return null;
}

// Load the model
loadModel();
