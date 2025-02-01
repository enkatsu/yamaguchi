import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const modelAssetPath = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

let video;
let vision, handLandmarker;
let drawKeyPoints = false;
let notoSansJpBoldFont;
let imgs = [];

window.preload = () => {
  notoSansJpBoldFont = loadFont('https://fonts.gstatic.com/ea/notosansjapanese/v6/NotoSansJP-Bold.otf');
}

window.setup = async () => {
  createCanvas(640, 480, WEBGL);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  
  vision = await FilesetResolver.forVisionTasks(wasmPath);
  handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: { modelAssetPath, delegate: 'GPU', },
      numHands: 2,
    });
  await handLandmarker.setOptions({ runningMode: 'video', });
  
  textFont(notoSansJpBoldFont);
};

window.draw = () => {
  background(220);
  
  push();
  noStroke();
  texture(video);
  plane(width, height);
  pop();
  
  if (!handLandmarker) return;
  
  let rightIndex = -1;
  let leftIndex = -1;
  let startTimeMs = performance.now();
  const result = handLandmarker.detectForVideo(video.elt, startTimeMs);
  for (let i = 0; i < result.landmarks.length; i++) {
    if (result.handednesses[i][0].categoryName === 'Right') {
      rightIndex = i;
    }
    
    if (result.handednesses[i][0].categoryName === 'Left') {
      leftIndex = i;
    }
    
    if (drawKeyPoints) {
      for (let j = 0; j < result.landmarks[i].length; j++) {
        push();
        fill(100, 200, 250, 200);
        noStroke();
        ellipse(
          result.landmarks[i][j].x * width - width / 2,
          result.landmarks[i][j].y * height - height / 2,
          10, 10
        );
        pop();

        push();
        fill(250, 100, 200);
        noStroke();
        text(
          j,
          result.landmarks[i][j].x * width - width / 2,
          result.landmarks[i][j].y * height - height / 2,
        );
        pop();
      }
    }
  }
  
  if (rightIndex !== -1 && leftIndex !== -1) {
    const d1 = dist(
      result.landmarks[rightIndex][4].x,
      result.landmarks[rightIndex][4].y,
      result.landmarks[leftIndex][8].x,
      result.landmarks[leftIndex][8].y
    );
    const d2 = dist(
      result.landmarks[leftIndex][4].x,
      result.landmarks[leftIndex][4].y,
      result.landmarks[rightIndex][8].x,
      result.landmarks[rightIndex][8].y
    );
    if (d1 < 0.1 && d2 < 0.1) {
      const p1norm = createVector(
        result.landmarks[leftIndex][4].x,
        result.landmarks[leftIndex][4].y,
      );
      const p1 = p1norm.copy();
      p1.sub(0.5, 0.5);
      p1.mult(width, height);
      const p2norm = createVector(
        result.landmarks[leftIndex][2].x,
        result.landmarks[leftIndex][2].y,
      );
      const p2 = p2norm.copy();
      p2.sub(0.5, 0.5);
      p2.mult(width, height);
      const p3norm = createVector(
        result.landmarks[leftIndex][8].x,
        result.landmarks[leftIndex][8].y,
      );
      const p3 = p3norm.copy();
      p3.sub(0.5, 0.5);
      p3.mult(width, height);
      const p4norm = createVector(
        result.landmarks[rightIndex][2].x,
        result.landmarks[rightIndex][2].y,
      );
      const p4 = p4norm.copy();
      p4.sub(0.5, 0.5);
      p4.mult(width, height);
      
      const center = createVector(0, 0);
      center.add(p1);
      center.add(p2);
      center.add(p3);
      center.add(p4);
      center.div(4);
      
      if (imgs.length != 60) {
        imgs.push(video.get());
      } else {
        imgs.push(video.get());
        const img = imgs.shift();
        push();
        noStroke();
        texture(img);
        textureMode(NORMAL);
        beginShape();
        vertex(p1.x, p1.y, p1norm.x, p1norm.y);
        vertex(p2.x, p2.y, p2norm.x, p2norm.y);
        vertex(p3.x, p3.y, p3norm.x, p3norm.y);
        vertex(p4.x, p4.y, p4norm.x, p4norm.y);
        endShape();
        pop();
      }
    }
  }
  
  if (result.landmarks.length != 0) {
    print(result);
  }
};

window.keyPressed = () => {
  if (key === ' ') {
    drawKeyPoints = !drawKeyPoints;
  }
};
