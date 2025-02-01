/***************************************************
 * p5.js + MediaPipe Hands デモ
 ***************************************************/

/** キャンバスサイズ定数 */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

/** モード切り替え用定数 */
const MODES = {
  SKELETON: 0,
  INDEX_TRAIL: 1,
  BALL: 2
};

/** グローバル変数 */
let detections = {};  // MediaPipe検出結果
let videoElement;     // ビデオ要素
let canvas2;          // サブキャンバス
let debugInfo;        // デバッグ情報
let fing = MODES.SKELETON;  // 現在のモード

// 人差し指の軌跡（モード1用）
let trail = [[], []];
const TRAIL_LENGTH = 20;

// 指先の前フレーム座標（モード2用）
let ftip = [
  Array.from({ length: 5 }, () => [0, 0]),  // 左手の指先座標
  Array.from({ length: 5 }, () => [0, 0])   // 右手の指先座標
];
// ボール格納配列（モード2用）
let balls = [];

/** アプリケーション設定 */
const CONFIG = {
  display: {
    debug: true,
    colors: {
      leftHand: [255, 255, 0],
      rightHand: [0, 255, 255]
    }
  },
  effects: {
    ball: {
      gravity: 0.3,
      friction: 0.98,
      elasticity: 0.8
    },
    trail: {
      maxLength: 20,
      minThickness: 2,
      maxThickness: 8
    }
  },
  performance: {
    targetFrameRate: 30
  }
};

/** デバッグ情報管理クラス */
class DebugInfo {
  constructor() {
    this.fps = 0;
    this.handCount = 0;
    this.mode = 0;
  }

  update(hands, currentMode) {
    this.fps = frameRate();
    this.handCount = hands.length;
    this.mode = currentMode;
  }

  draw() {
    if (!CONFIG.display.debug) return;

    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT);

    let y = 20;
    text(`FPS: ${this.fps.toFixed(1)}`, 10, y);
    text(`検出された手: ${this.handCount}`, 10, y += 20);
    text(`現在のモード: ${this.mode}`, 10, y += 20);
  }
}

/** Ball クラスの定義 */
class Ball {
  constructor(x, y, vx, vy, r, handIndex) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.handIndex = handIndex;
    this.color = handIndex === 0 ? color(255, 255, 0, 180) : color(0, 255, 255, 180);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += CONFIG.effects.ball.gravity;
    this.vx *= CONFIG.effects.ball.friction;
    this.vy *= CONFIG.effects.ball.friction;
  }

  draw() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.r * 2);
  }
}

/** MediaPipe Hands セットアップの修正 */
function setupMediaPipe() {
  videoElement = document.getElementById('input_video');
  
  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(gotHands);

  // カメラの設定を修正
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({image: videoElement});
    },
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    facingMode: 'user'
  });

  camera.start().catch(err => {
    console.error('カメラの起動に失敗:', err);
  });
}

function gotHands(results) {
  detections = results;
}

async function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(CONFIG.performance.targetFrameRate);
  
  canvas2 = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas2.strokeWeight(5);
  
  setupMediaPipe();
  debugInfo = new DebugInfo();
  
  resetScene();
}

function draw() {
  background(0);
  // image(video, 0, 0);
  
  // カメラ映像の描画
  if (videoElement && videoElement.videoWidth > 0) {
    push();
    translate(width, 0);
    scale(-1, 1);
    drawingContext.drawImage(videoElement, 0, 0, width, height);
    pop();
  }

  // ボールの更新と描画
  if (fing === MODES.BALL) {
    canvas2.clear();
    balls.forEach(ball => {
      ball.update();
      ball.draw();
    });
  }
  
  // 手の検出結果の描画
  if (detections && detections.multiHandLandmarks) {
    detections.multiHandLandmarks.forEach((hand, index) => {
      const handedness = detections.multiHandedness[index].label;
      const handIndex = handedness === "Left" ? 0 : 1;
      
      switch (fing) {
        case MODES.SKELETON:
          drawSkeletonMP(hand, handIndex);
          break;
        case MODES.INDEX_TRAIL:
          drawIndexTrailMP(hand, handIndex);
          break;
        case MODES.BALL:
          updateBallsMP(hand, handIndex);
          break;
      }
    });
  }

  // サブキャンバスの描画
  image(canvas2, 0, 0);
  
  // デバッグ情報の更新と描画
  debugInfo.update(detections?.multiHandLandmarks || [], fing);
  debugInfo.draw();
}

/**
 * モード切り替え時に描画内容や履歴をリセット
 */
function resetScene() {
  // メモリリークを防ぐためのクリーンアップ
  canvas2.remove();
  canvas2 = createGraphics(width, height);
  canvas2.strokeWeight(5);

  // サブキャンバスをクリア
  canvas2.clear();
  // メインキャンバスもクリア
  background(0);

  // 軌跡、ボール、指先座標を初期化
  trail = [[], []];
  balls = [];
  ftip = [
    Array.from({ length: 5 }, () => [0, 0]),  // 左手の指先座標
    Array.from({ length: 5 }, () => [0, 0])   // 右手の指先座標
  ];
}

//--------------------------------------
// 手の推定結果をモードに合わせて描画
//--------------------------------------
function drawHand(predictions, mode) {
  // 両手の予測結果それぞれに対して処理を実行
  predictions.forEach((prediction, index) => {
    const handColor = createHandColor(index);
    stroke(handColor);
    
    switch (mode) {
      case MODES.SKELETON:
        drawSkeleton(prediction);
        break;
      case MODES.INDEX_TRAIL:
        drawIndexTrail(prediction, index);  // インデックスを渡して両手の軌跡を区別
        break;
      case MODES.BALL:
        updateBalls(prediction, index);  // インデックスを渡して両手のボールを区別
        break;
      default:
        break;
    }
  });
}

//==================================================
// (A) スケルトン描画 (MODE_SKELETON)
//==================================================
function drawSkeleton(prediction) {
  const { landmarks } = prediction;

  // 関節角度の計算と表示
  function calculateAngle(p1, p2, p3) {
    const angle = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]) -
      Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
    return Math.abs((angle * 180 / Math.PI + 360) % 360);
  }

  // 指の識別表示
  const fingerNames = ['親指', '人差指', '中指', '薬指', '小指'];
  const fingerBaseIndices = [2, 5, 9, 13, 17];

  fingerNames.forEach((name, i) => {
    const baseIndex = fingerBaseIndices[i];
    const x = width - landmarks[baseIndex][0];
    const y = landmarks[baseIndex][1];

    // 指の名前を表示
    fill(255);
    noStroke();
    textSize(12);
    text(name, x, y);

    // 関節角度を計算して表示
    if (baseIndex > 0 && baseIndex < landmarks.length - 1) {
      const angle = calculateAngle(
        landmarks[baseIndex - 1],
        landmarks[baseIndex],
        landmarks[baseIndex + 1]
      );
      text(`${Math.round(angle)}°`, x, y + 15);
    }
  });

  // 既存のスケルトン描画
  let prevKeypoint = null;
  landmarks.forEach((keypoint, i) => {
    const x = width - keypoint[0];
    const y = keypoint[1];
    drawConnections(i, prevKeypoint, x, y, prediction);
    prevKeypoint = [x, y];
  });
}

function drawConnections(index, prevKey, x, y, prediction) {
  stroke(255, 255, 0);
  strokeWeight(2);

  if (prevKey && index > 0 && ![5, 9, 13, 17].includes(index)) {
    line(prevKey[0], prevKey[1], x, y);
  }
  if ([6, 10, 14, 18].includes(index) && prevKey) {
    line(
      prevKey[0],
      prevKey[1],
      width - prediction.landmarks[0][0],
      prediction.landmarks[0][1]
    );
  }
  if ([2, 3, 4, 5].includes(index)) {
    for (let m = index - 1; m < index + 12; m += 4) {
      if (m + 4 < prediction.landmarks.length) {
        line(
          width - prediction.landmarks[m][0],
          prediction.landmarks[m][1],
          width - prediction.landmarks[m + 4][0],
          prediction.landmarks[m + 4][1]
        );
      }
    }
  }
}

//==================================================
// (B) 人差し指の軌跡描画 (MODE_INDEX_TRAIL)
//==================================================
function drawIndexTrail(prediction, handIndex) {
  const { landmarks } = prediction;
  const x = width - landmarks[INDEX_FINGER_TIP][0];
  const y = landmarks[INDEX_FINGER_TIP][1];

  // 両手用の軌跡配列がない場合は初期化
  if (!trail[handIndex]) {
    trail[handIndex] = [];
  }

  trail[handIndex].push([x, y]);
  if (trail[handIndex].length > TRAIL_LENGTH) {
    trail[handIndex].shift();
  }

  // 手ごとに異なる色で描画
  const trailColor = handIndex === 0 ? color(0, 255, 0) : color(255, 0, 255);
  
  canvas2.noFill();
  canvas2.stroke(trailColor);
  canvas2.strokeWeight(2);
  canvas2.beginShape();
  trail[handIndex].forEach(([tx, ty]) => canvas2.curveVertex(tx, ty));
  canvas2.endShape();

  canvas2.fill(trailColor);
  canvas2.noStroke();
  canvas2.ellipse(x, y, 10);
}

//==================================================
// (C) ボール更新 & 描画 (MODE_BALL)
//==================================================
function updateBalls(prediction, handIndex) {
  const { landmarks } = prediction;
  const fingertips = [THUMB_TIP, INDEX_FINGER_TIP, MIDDLE_FINGER_TIP, RING_FINGER_TIP, PINKY_TIP];
  
  // 両手用の指先座標配列がない場合は初期化
  if (!ftip[handIndex]) {
    ftip[handIndex] = Array.from({ length: 5 }, () => [0, 0]);
  }

  fingertips.forEach((tipIndex, i) => {
    const [px, py] = ftip[handIndex][i];
    const x = width - landmarks[tipIndex][0];
    const y = landmarks[tipIndex][1];
    const dx = x - px;
    const dy = y - py;

    // 速度に応じたボールの特性変更
    const speed = sqrt(dx * dx + dy * dy);
    if (speed > 3) {
      const radius = map(speed, 0, 50, 8, 20);
      // 手ごとに異なる色のボールを生成
      const newBall = new Ball(
        x, y,
        dx * 0.2,
        dy * 0.2,
        radius,
        handIndex  // ボールに手のインデックスを追加
      );
      balls.push(newBall);
    }
    ftip[handIndex][i] = [x, y];
  });
}

function handleWindowResize() {
  resizeCanvas(windowWidth, windowHeight);
}

window.addEventListener('resize', handleWindowResize);

function transitionToMode(newMode) {
  // モード切り替え時のアニメーション効果
  fadeOut(() => {
    fing = newMode;
    resetScene();
    fadeIn();
  });
}

function createHandColor(index) {
  if (typeof color === 'function') {
    return index === 0 ? color(255, 255, 0) : color(0, 255, 255);
  }
  return index === 0 ? { r: 255, g: 255, b: 0 } : { r: 0, g: 255, b: 255 };
}

/** MediaPipe用の手のスケルトン描画関数 */
function drawSkeletonMP(landmarks, handIndex) {
  const color = handIndex === 0 ? CONFIG.display.colors.leftHand : CONFIG.display.colors.rightHand;
  
  // 指の識別表示
  const fingerNames = ['親指', '人差指', '中指', '薬指', '小指'];
  const fingerBaseIndices = [2, 5, 9, 13, 17];

  // 指の名前と関節角度を表示
  fingerNames.forEach((name, i) => {
    const baseIndex = fingerBaseIndices[i];
    const x = width - landmarks[baseIndex].x * width;
    const y = landmarks[baseIndex].y * height;

    fill(255);
    noStroke();
    textSize(12);
    text(name, x, y);

    // 関節角度の計算と表示
    if (baseIndex > 1) {
      const p1 = landmarks[baseIndex - 2];
      const p2 = landmarks[baseIndex - 1];
      const p3 = landmarks[baseIndex];
      const angle = calculateAngle(p1, p2, p3);
      text(`${Math.round(angle)}°`, x, y + 15);
    }
  });

  // スケルトンの描画
  stroke(color);
  strokeWeight(2);

  // 手のひらの接続
  const palmIndices = [0, 1, 5, 9, 13, 17, 0];
  for (let i = 0; i < palmIndices.length - 1; i++) {
    const start = landmarks[palmIndices[i]];
    const end = landmarks[palmIndices[i + 1]];
    line(
      width - start.x * width, start.y * height,
      width - end.x * width, end.y * height
    );
  }

  // 指の接続
  const fingers = [
    [1, 2, 3, 4],         // 親指
    [5, 6, 7, 8],         // 人差し指
    [9, 10, 11, 12],      // 中指
    [13, 14, 15, 16],     // 薬指
    [17, 18, 19, 20]      // 小指
  ];

  fingers.forEach(finger => {
    for (let i = 0; i < finger.length - 1; i++) {
      const start = landmarks[finger[i]];
      const end = landmarks[finger[i + 1]];
      line(
        width - start.x * width, start.y * height,
        width - end.x * width, end.y * height
      );
    }
  });
}

/** 関節角度の計算 */
function calculateAngle(p1, p2, p3) {
  const angle = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
    Math.atan2(p1.y - p2.y, p1.x - p2.x);
  return Math.abs((angle * 180 / Math.PI + 360) % 360);
}

/** MediaPipe用の人差し指の軌跡描画関数 */
function drawIndexTrailMP(landmarks, handIndex) {
  const x = width - landmarks[8].x * width;  // 人差し指の先端
  const y = landmarks[8].y * height;

  trail[handIndex].push([x, y]);
  if (trail[handIndex].length > TRAIL_LENGTH) {
    trail[handIndex].shift();
  }

  const trailColor = handIndex === 0 ? color(255, 255, 0) : color(0, 255, 255);
  
  canvas2.noFill();
  canvas2.stroke(trailColor);
  canvas2.strokeWeight(2);
  canvas2.beginShape();
  trail[handIndex].forEach(([tx, ty]) => canvas2.curveVertex(tx, ty));
  canvas2.endShape();

  canvas2.fill(trailColor);
  canvas2.noStroke();
  canvas2.ellipse(x, y, 10);
}

/** MediaPipe用のボール更新関数 */
function updateBallsMP(landmarks, handIndex) {
  const fingertips = [4, 8, 12, 16, 20];  // 指先のインデックス
  
  fingertips.forEach((tipIndex, i) => {
    const [px, py] = ftip[handIndex][i];
    const x = width - landmarks[tipIndex].x * width;
    const y = landmarks[tipIndex].y * height;
    const dx = x - px;
    const dy = y - py;

    const speed = sqrt(dx * dx + dy * dy);
    if (speed > 3) {
      const radius = map(speed, 0, 50, 8, 20);
      balls.push(new Ball(x, y, dx * 0.2, dy * 0.2, radius, handIndex));
    }
    ftip[handIndex][i] = [x, y];
  });
}

/** モード切り替え用関数 */
function mouseClicked() {
  if (fing === 2) {
    window.location.href = './hands-window';
    return;
  }
  fing = (fing + 1) % 3;
  resetScene();
}

// function touchEnded() {
//   console.log('touchEnded');
  
//   if (fing === 2) {
//     window.location.href = './hands-window';
//     return;
//   }
//   fing = (fing + 1) % 3;
//   resetScene();
// }
