// /***************************************************
//  * p5.js + TensorFlow Handpose デモ
//  * fing = 4 で「キーポイント以外」を変化させる演出を追加
//  ***************************************************/

// /** Handpose ランドマークのインデックス */
// const THUMB_TIP = 4;
// const INDEX_FINGER_TIP = 8;
// const MIDDLE_FINGER_TIP = 12;
// const RING_FINGER_TIP = 16;
// const PINKY_TIP = 20;

// /** モード切り替え用定数 */
// const MODE_SKELETON = 0;  // 手のスケルトン描画
// const MODE_INDEX_TRAIL = 1;  // 人差し指の軌跡
// const MODE_BALL = 2;  // ボール描画

// /** 定数の追加 */
// const MODES = {
//   SKELETON: 0,
//   INDEX_TRAIL: 1,
//   BALL: 2,
//   // 必要な場合は以下を追加
//   // ART_ILLUSION: 3,
//   // INVERSE: 4
// };

// /** p5.js 用変数 */
// let video = null;            // カメラ映像
// let canvas2 = null;          // サブキャンバス

// /** Handpose 関連 */
// let handposeModel = null;
// let predictions = [];     // 直近フレームでの検出結果

// /** ランドマークの平滑化用 */
// let prevLandmarks = [null, null]; // 左右の手のランドマーク用

// /** 各種描画・管理変数 */
// let fing = MODE_SKELETON;  // 現在のモード

// // 人差し指の軌跡（モード1用）
// let trail = [[], []];
// const TRAIL_LENGTH = 20;

// // 指先の前フレーム座標（モード2用）
// let ftip = [
//   Array.from({ length: 5 }, () => [0, 0]),  // 左手の指先座標
//   Array.from({ length: 5 }, () => [0, 0])   // 右手の指先座標
// ];
// // ボール格納配列（モード2用）
// let balls = [];

// /** Handpose のモデル読み込みオプション (モーションキャプチャ精度向上バージョン) */
// const options = {
//   flipHorizontal: true,
//   maxContinuousChecks: 5,
//   detectionConfidence: 0.9,
//   scoreThreshold: 0.85,
//   iouThreshold: 0.3
// };

// /** スムージング係数 */
// const SMOOTHING_ALPHA = 0.6;

// function customLerp(start, end, amt) {
//   return start + (end - start) * amt;
// }

// function smoothLandmarks(oldLandmarks, newLandmarks, alpha) {
//   if (!oldLandmarks || !newLandmarks) return newLandmarks;
//   if (oldLandmarks.length !== newLandmarks.length) return newLandmarks;

//   for (let i = 0; i < oldLandmarks.length; i++) {
//     newLandmarks[i][0] = customLerp(oldLandmarks[i][0], newLandmarks[i][0], alpha);
//     newLandmarks[i][1] = customLerp(oldLandmarks[i][1], newLandmarks[i][1], alpha);
//     if (newLandmarks[i].length > 2) {
//       newLandmarks[i][2] = customLerp(oldLandmarks[i][2], newLandmarks[i][2], alpha);
//     }
//   }
//   return newLandmarks;
// }

// /** アプリケーション設定 */
// const CONFIG = {
//   display: {
//     debug: true,
//     colors: {
//       leftHand: [255, 255, 0],
//       rightHand: [0, 255, 255]
//     }
//   },
//   handpose: {
//     smoothing: 0.6,
//     confidence: 0.9,
//     scoreThreshold: 0.85,
//     maxMovement: 100 // Added for the new updatePredictions method
//   },
//   effects: {
//     ball: {
//       gravity: 0.3,
//       friction: 0.98,
//       elasticity: 0.8
//     },
//     trail: {
//       maxLength: 20,
//       minThickness: 2,
//       maxThickness: 8
//     }
//   }
// };

// const DEBUG_MODE = true;

// /** デバッグ情報管理 */
// class DebugInfo {
//   constructor() {
//     this.fps = 0;
//     this.handCount = 0;
//     this.mode = 0;
//     this.memoryUsage = 0;
//   }

//   update(predictions, currentMode) {
//     this.fps = frameRate();
//     this.handCount = predictions.length;
//     this.mode = currentMode;
//     this.memoryUsage = balls.length + trail[0].length + trail[1].length;
//   }

//   draw() {
//     if (!CONFIG.display.debug) return;

//     fill(255);
//     noStroke();
//     textSize(14);
//     textAlign(LEFT);

//     let y = 20;
//     text(`FPS: ${this.fps.toFixed(1)}`, 10, y);
//     text(`検出された手: ${this.handCount}`, 10, y += 20);
//     text(`現在のモード: ${this.mode}`, 10, y += 20);
//     text(`メモリ使用: ${this.memoryUsage}`, 10, y += 20);
//   }
// }

// // フレームレートの動的調整
// const MIN_FRAMERATE = 15;
// const MAX_FRAMERATE = 30;

// function adjustFrameRate(rate) {
//   if (typeof frameRate === 'function') {
//     frameRate(rate);
//   }
// }

// /** エラー状態管理 */
// const ErrorState = {
//   CAMERA_ACCESS: 'カメラアクセスエラー',
//   MODEL_LOAD: 'モデル読み込みエラー',
//   DETECTION: '手の検出エラー',
//   WEBGL: 'WebGLエラー'
// };

// let errorMessage = null;

// /** パフォーマンス設定 */
// const PERFORMANCE = {
//   MAX_BALLS: 50,
//   MIN_SPEED_THRESHOLD: 3,
//   MAX_TRAIL_POINTS: 20,
//   FRAME_RATE: {
//     SINGLE_HAND: 30,
//     DUAL_HAND: 15
//   }
// };

// function optimizePerformance() {
//   // フレームレート動的調整
//   const targetFrameRate = (predictions && predictions.length > 1)
//     ? PERFORMANCE.FRAME_RATE.DUAL_HAND
//     : PERFORMANCE.FRAME_RATE.SINGLE_HAND;
  
//   adjustFrameRate(targetFrameRate);

//   // メモリ使用量の最適化
//   if (balls && balls.length > PERFORMANCE.MAX_BALLS) {
//     balls = balls.slice(-PERFORMANCE.MAX_BALLS);
//   }
// }

// /** モード管理クラス */
// class ModeManager {
//   constructor() {
//     this.currentMode = MODE_SKELETON;
//     this.modes = [MODE_SKELETON, MODE_INDEX_TRAIL, MODE_BALL];
//   }

//   next() {
//     this.currentMode = (this.currentMode + 1) % this.modes.length;
//     this.reset();
//   }

//   reset() {
//     resetScene();
//   }

//   getCurrentMode() {
//     return this.currentMode;
//   }
// }

// /** Handpose 管理クラス */
// class HandposeManager {
//   constructor() {
//     this.predictions = [];
//     this.prevLandmarks = [null, null];
//     this.canvasWidth = typeof width !== 'undefined' ? width : 640;
//   }

//   async detect(video) {
//     try {
//       // 両手の検出を明示的に設定
//       const options = {
//         flipHorizontal: true,
//         maxHands: 2  // 最大2つの手を検出
//       };
      
//       const rawPredictions = await handposeModel.estimateHands(video.elt, options);
//       this.updatePredictions(rawPredictions);
//     } catch (error) {
//       console.error('Detection error:', error);
//     }
//   }

//   updatePredictions(rawPredictions) {
//     if (!Array.isArray(rawPredictions)) return;

//     // 既存の予測をクリア
//     this.predictions = [];

//     // 最大2つの手を処理
//     for (let i = 0; i < Math.min(rawPredictions.length, 2); i++) {
//       const pred = rawPredictions[i];
//       if (!pred || !pred.landmarks || !Array.isArray(pred.landmarks)) continue;

//       let newLandmarks = [...pred.landmarks];
      
//       // 手のx座標の平均値を計算
//       const avgX = newLandmarks.reduce((sum, point) => sum + point[0], 0) / newLandmarks.length;
//       // キャンバスの中心を基準に左右判定
//       const isLeftHand = avgX > this.canvasWidth / 2;
//       const handIndex = isLeftHand ? 0 : 1;

//       // スムージング処理
//       if (this.prevLandmarks[handIndex]) {
//         try {
//           const movement = this.calculateMovement(
//             this.prevLandmarks[handIndex],
//             newLandmarks
//           );

//           if (movement < CONFIG.handpose.maxMovement) {
//             newLandmarks = this.smoothLandmarks(
//               this.prevLandmarks[handIndex],
//               newLandmarks,
//               CONFIG.handpose.smoothing
//             );
//           }
//         } catch (error) {
//           console.error('スムージング処理エラー:', error);
//         }
//       }

//       // 予測結果を更新
//       pred.landmarks = newLandmarks;
//       pred.handIndex = handIndex; // 手のインデックスを追加
//       this.prevLandmarks[handIndex] = JSON.parse(JSON.stringify(newLandmarks));
//       this.predictions.push(pred);
//     }

//     // デバッグ情報
//     if (CONFIG.display.debug) {
//       console.log(`検出された手の数: ${this.predictions.length}`);
//     }
//   }

//   calculateMovement(oldLandmarks, newLandmarks) {
//     let totalMovement = 0;
//     for (let i = 0; i < oldLandmarks.length; i++) {
//       const dx = oldLandmarks[i][0] - newLandmarks[i][0];
//       const dy = oldLandmarks[i][1] - newLandmarks[i][1];
//       totalMovement += Math.sqrt(dx * dx + dy * dy);
//     }
//     return totalMovement / oldLandmarks.length;
//   }

//   smoothLandmarks(oldLandmarks, newLandmarks, alpha) {
//     return newLandmarks.map((newPoint, i) => {
//       const oldPoint = oldLandmarks[i];
//       return newPoint.map((coord, j) =>
//         customLerp(oldPoint[j], coord, alpha)
//       );
//     });
//   }

//   getPredictions() {
//     return this.predictions;
//   }
// }

// // HandposeManagerのインスタンスを作成
// const handposeManager = new HandposeManager();

// /** イベント管理 */
// class EventManager {
//   constructor() {
//     this.handlers = new Map();
//     this.setupEventListeners();
//   }

//   addHandler(event, handler) {
//     this.handlers.set(event, handler);
//   }

//   setupEventListeners() {
//     // p5.jsのcanvasが作成された後に実行
//     if (typeof window.canvas !== 'undefined') {
//       window.canvas.touchStarted(this.handleTouch.bind(this));
//     }

//     window.addEventListener('resize', () => {
//       if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
//       this.resizeTimeout = setTimeout(() => {
//         this.handleResize();
//       }, 250);
//     });
//   }

//   handleResize() {
//     resizeCanvas(windowWidth, windowHeight);
//     canvas2.resizeCanvas(windowWidth, windowHeight);
//   }

//   handleTouch() {
//     modeManager.next();
//     return false;
//   }
// }

// // WebGLサポートチェック
// function isWebGLAvailable() {
//   try {
//     const canvas = document.createElement('canvas');
//     return !!(window.WebGLRenderingContext && 
//       (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
//   } catch (e) {
//     return false;
//   }
// }

// async function setup() {
//   try {
//     createCanvas(640, 480);
//     canvas2 = createGraphics(width, height);
//     canvas2.strokeWeight(5);

//     // WebGLサポートチェック
//     if (!isWebGLAvailable()) {
//       throw new Error(ErrorState.WEBGL);
//     }

//     // カメラセットアップ
//     video = await createCapture({
//       video: {
//         width: { ideal: 640 },
//         height: { ideal: 480 }
//       }
//     });
//     video.size(width, height);
//     video.hide();

//     // モデル読み込み
//     await tf.ready();
//     handposeModel = await handpose.load({
//       maxHands: 2,  // 最大2つの手を検出
//       flipHorizontal: true
//     });

//     // 初期化
//     resetScene();
//   } catch (error) {
//     console.error('Setup error:', error);
//     errorMessage = error.message;
//     noLoop();
//   }
// }

// //--------------------------------------
// // p5.js draw: メインループ
// //--------------------------------------
// async function draw() {
//   try {
//     background(0);

//     // カメラ映像を左右反転して表示
//     push();
//     translate(width, 0);
//     scale(-1, 1);
//     image(video, 0, 0, width, height);
//     pop();

//     // サブキャンバスを重ねる
//     image(canvas2, 0, 0);

//     // 手の検出と更新
//     if (handposeModel && video) {
//       await handposeManager.detect(video);
//       predictions = handposeManager.getPredictions();

//       // 検出された手の数をログ出力（デバッグ用）
//       if (CONFIG.display.debug) {
//         console.log(`現在のフレームで検出された手の数: ${predictions.length}`);
//       }
//     }

//     // 各手の描画処理
//     if (predictions && predictions.length > 0) {
//       predictions.forEach((prediction, index) => {
//         if (prediction && prediction.landmarks) {
//           const handColor = createHandColor(index);
//           stroke(handColor);
          
//           switch (fing) {
//             case MODES.SKELETON:
//               drawSkeleton(prediction);
//               break;
//             case MODES.INDEX_TRAIL:
//               drawIndexTrail(prediction, index);
//               break;
//             case MODES.BALL:
//               updateBalls(prediction, index);
//               break;
//           }
//         }
//       });
//     }

//     // ボールモードの場合の追加処理
//     if (fing === MODES.BALL) {
//       canvas2.clear();
//       drawBalls();
//     }

//     // デバッグ情報の更新と表示
//     const debugInfo = new DebugInfo();
//     debugInfo.update(predictions, fing);
//     debugInfo.draw();
//   } catch (error) {
//     console.error('Draw error:', error);
//   }
// }

// //--------------------------------------
// // クリックでモードを順番に切り替え
// //   → モードが 4 まで増えました
// //--------------------------------------
// function mousePressed() {
//   // MODE_SKELETON → MODE_INDEX_TRAIL → MODE_BALL ...
//   fing = (fing + 1) % 3;
//   resetScene();
// }

// /**
//  * モード切り替え時に描画内容や履歴をリセット
//  */
// function resetScene() {
//   // メモリリークを防ぐためのクリーンアップ
//   canvas2.remove();
//   canvas2 = createGraphics(width, height);
//   canvas2.strokeWeight(5);

//   // サブキャンバスをクリア
//   canvas2.clear();
//   // メインキャンバスもクリア
//   background(0);

//   // 軌跡、ボール、指先座標を初期化
//   trail = [[], []];
//   balls = [];
//   ftip = [
//     Array.from({ length: 5 }, () => [0, 0]),  // 左手の指先座標
//     Array.from({ length: 5 }, () => [0, 0])   // 右手の指先座標
//   ];

//   // 両手分の前フレームランドマークをクリア
//   prevLandmarks = [null, null];
// }

// //--------------------------------------
// // 手の推定結果をモードに合わせて描画
// //--------------------------------------
// function drawHand(predictions, mode) {
//   // 両手の予測結果それぞれに対して処理を実行
//   predictions.forEach((prediction, index) => {
//     const handColor = createHandColor(index);
//     stroke(handColor);
    
//     switch (mode) {
//       case MODES.SKELETON:
//         drawSkeleton(prediction);
//         break;
//       case MODES.INDEX_TRAIL:
//         drawIndexTrail(prediction, index);  // インデックスを渡して両手の軌跡を区別
//         break;
//       case MODES.BALL:
//         updateBalls(prediction, index);  // インデックスを渡して両手のボールを区別
//         break;
//       default:
//         break;
//     }
//   });
// }

// //==================================================
// // (A) スケルトン描画 (MODE_SKELETON)
// //==================================================
// function drawSkeleton(prediction) {
//   const { landmarks } = prediction;

//   // 関節角度の計算と表示
//   function calculateAngle(p1, p2, p3) {
//     const angle = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]) -
//       Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
//     return Math.abs((angle * 180 / Math.PI + 360) % 360);
//   }

//   // 指の識別表示
//   const fingerNames = ['親指', '人差指', '中指', '薬指', '小指'];
//   const fingerBaseIndices = [2, 5, 9, 13, 17];

//   fingerNames.forEach((name, i) => {
//     const baseIndex = fingerBaseIndices[i];
//     const x = width - landmarks[baseIndex][0];
//     const y = landmarks[baseIndex][1];

//     // 指の名前を表示
//     fill(255);
//     noStroke();
//     textSize(12);
//     text(name, x, y);

//     // 関節角度を計算して表示
//     if (baseIndex > 0 && baseIndex < landmarks.length - 1) {
//       const angle = calculateAngle(
//         landmarks[baseIndex - 1],
//         landmarks[baseIndex],
//         landmarks[baseIndex + 1]
//       );
//       text(`${Math.round(angle)}°`, x, y + 15);
//     }
//   });

//   // 既存のスケルトン描画
//   let prevKeypoint = null;
//   landmarks.forEach((keypoint, i) => {
//     const x = width - keypoint[0];
//     const y = keypoint[1];
//     drawConnections(i, prevKeypoint, x, y, prediction);
//     prevKeypoint = [x, y];
//   });
// }

// function drawConnections(index, prevKey, x, y, prediction) {
//   stroke(255, 255, 0);
//   strokeWeight(2);

//   if (prevKey && index > 0 && ![5, 9, 13, 17].includes(index)) {
//     line(prevKey[0], prevKey[1], x, y);
//   }
//   if ([6, 10, 14, 18].includes(index) && prevKey) {
//     line(
//       prevKey[0],
//       prevKey[1],
//       width - prediction.landmarks[0][0],
//       prediction.landmarks[0][1]
//     );
//   }
//   if ([2, 3, 4, 5].includes(index)) {
//     for (let m = index - 1; m < index + 12; m += 4) {
//       if (m + 4 < prediction.landmarks.length) {
//         line(
//           width - prediction.landmarks[m][0],
//           prediction.landmarks[m][1],
//           width - prediction.landmarks[m + 4][0],
//           prediction.landmarks[m + 4][1]
//         );
//       }
//     }
//   }
// }

// //==================================================
// // (B) 人差し指の軌跡描画 (MODE_INDEX_TRAIL)
// //==================================================
// function drawIndexTrail(prediction, handIndex) {
//   const { landmarks } = prediction;
//   const x = width - landmarks[INDEX_FINGER_TIP][0];
//   const y = landmarks[INDEX_FINGER_TIP][1];

//   // 両手用の軌跡配列がない場合は初期化
//   if (!trail[handIndex]) {
//     trail[handIndex] = [];
//   }

//   trail[handIndex].push([x, y]);
//   if (trail[handIndex].length > TRAIL_LENGTH) {
//     trail[handIndex].shift();
//   }

//   // 手ごとに異なる色で描画
//   const trailColor = handIndex === 0 ? color(0, 255, 0) : color(255, 0, 255);
  
//   canvas2.noFill();
//   canvas2.stroke(trailColor);
//   canvas2.strokeWeight(2);
//   canvas2.beginShape();
//   trail[handIndex].forEach(([tx, ty]) => canvas2.curveVertex(tx, ty));
//   canvas2.endShape();

//   canvas2.fill(trailColor);
//   canvas2.noStroke();
//   canvas2.ellipse(x, y, 10);
// }

// //==================================================
// // (C) ボール更新 & 描画 (MODE_BALL)
// //==================================================
// // ボールクラスの改善版
// class Ball {
//   constructor(x, y, vx, vy, r, handIndex) {
//     this.x = x;
//     this.y = y;
//     this.vx = vx;
//     this.vy = vy;
//     this.r = r;
//     this.handIndex = handIndex;
    
//     // 手ごとに異なる色を設定
//     colorMode(HSB);
//     this.color = handIndex === 0 ? 
//       color(120, 80, 100, 0.7) :  // 左手は緑系
//       color(300, 80, 100, 0.7);   // 右手は紫系
//     colorMode(RGB);
    
//     this.life = 255;
//     this.rotation = random(TWO_PI);
//     this.rotationSpeed = random(-0.1, 0.1);
//   }

//   update() {
//     // 物理演算の更新
//     this.x += this.vx;
//     this.y += this.vy;
//     this.vy += 0.3; // 重力を強めに
//     this.vx *= 0.98; // 空気抵抗
//     this.vy *= 0.98;
//     this.life -= 2; // ライフの減少を速く
//     this.rotation += this.rotationSpeed;

//     // 改善された壁との衝突
//     if (this.x - this.r < 0) {
//       this.x = this.r;
//       this.vx *= -0.8;
//     } else if (this.x + this.r > width) {
//       this.x = width - this.r;
//       this.vx *= -0.8;
//     }

//     if (this.y - this.r < 0) {
//       this.y = this.r;
//       this.vy *= -0.8;
//     } else if (this.y + this.r > height) {
//       this.y = height - this.r;
//       this.vy *= -0.8;
//     }

//     // ボール同士の簡易衝突判定
//     balls.forEach(other => {
//       if (other !== this) {
//         const dx = other.x - this.x;
//         const dy = other.y - this.y;
//         const distance = sqrt(dx * dx + dy * dy);
//         const minDist = this.r + other.r;

//         if (distance < minDist) {
//           const angle = atan2(dy, dx);
//           const targetX = this.x + cos(angle) * minDist;
//           const targetY = this.y + sin(angle) * minDist;

//           const ax = (targetX - other.x) * 0.05;
//           const ay = (targetY - other.y) * 0.05;

//           this.vx -= ax;
//           this.vy -= ay;
//           other.vx += ax;
//           other.vy += ay;
//         }
//       }
//     });
//   }

//   draw() {
//     push();
//     translate(this.x, this.y);
//     rotate(this.rotation);

//     // メインのボール
//     noStroke();
//     fill(red(this.color), green(this.color), blue(this.color), this.life);
//     ellipse(0, 0, this.r * 2);

//     // 光の効果
//     const gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, this.r);
//     gradient.addColorStop(0, `rgba(255, 255, 255, ${this.life / 255 * 0.3})`);
//     gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
//     drawingContext.fillStyle = gradient;
//     ellipse(0, 0, this.r * 2.2);

//     // 動きに応じたパーティクルエフェクト
//     const speed = sqrt(this.vx * this.vx + this.vy * this.vy);
//     if (speed > 2) {
//       for (let i = 0; i < 3; i++) {
//         const angle = random(TWO_PI);
//         const distance = random(this.r * 0.5, this.r * 1.5);
//         fill(red(this.color), green(this.color), blue(this.color), this.life * 0.2);
//         ellipse(
//           cos(angle) * distance,
//           sin(angle) * distance,
//           this.r * random(0.3, 0.6)
//         );
//       }
//     }
//     pop();
//   }
// }

// function updateBalls(prediction, handIndex) {
//   const { landmarks } = prediction;
//   const fingertips = [THUMB_TIP, INDEX_FINGER_TIP, MIDDLE_FINGER_TIP, RING_FINGER_TIP, PINKY_TIP];
  
//   // 両手用の指先座標配列がない場合は初期化
//   if (!ftip[handIndex]) {
//     ftip[handIndex] = Array.from({ length: 5 }, () => [0, 0]);
//   }

//   fingertips.forEach((tipIndex, i) => {
//     const [px, py] = ftip[handIndex][i];
//     const x = width - landmarks[tipIndex][0];
//     const y = landmarks[tipIndex][1];
//     const dx = x - px;
//     const dy = y - py;

//     // 速度に応じたボールの特性変更
//     const speed = sqrt(dx * dx + dy * dy);
//     if (speed > 3) {
//       const radius = map(speed, 0, 50, 8, 20);
//       // 手ごとに異なる色のボールを生成
//       const newBall = new Ball(
//         x, y,
//         dx * 0.2,
//         dy * 0.2,
//         radius,
//         handIndex  // ボールに手のインデックスを追加
//       );
//       balls.push(newBall);
//     }
//     ftip[handIndex][i] = [x, y];
//   });
// }

// function drawBalls() {
//   const friction = 0.95;

//   for (let ball of balls) {
//     ball.x += ball.vx;
//     ball.y += ball.vy;
//     ball.vx *= friction;
//     ball.vy *= friction;
//   }

//   // ボール数の制限とクリーンアップ
//   const MAX_BALLS = 100;
//   balls = balls.filter(ball =>
//     ball.x >= 0 && ball.x <= width &&
//     ball.y >= 0 && ball.y <= height
//   ).slice(-MAX_BALLS);

//   for (let ball of balls) {
//     noStroke();
//     fill(180, 180, 255, 180);
//     ellipse(ball.x, ball.y, ball.r * 2);
//   }
// }

// function handleWindowResize() {
//   resizeCanvas(windowWidth, windowHeight);
//   canvas2.resizeCanvas(windowWidth, windowHeight);
// }

// window.addEventListener('resize', handleWindowResize);

// function transitionToMode(newMode) {
//   // モード切り替え時のアニメーション効果
//   fadeOut(() => {
//     fing = newMode;
//     resetScene();
//     fadeIn();
//   });
// }

// // エラーハンドリングの改善
// async function initializeHandpose() {
//   try {
//     if (typeof handpose === 'undefined') {
//       throw new Error('Handposeライブラリが読み込まれていません');
//     }
//     if (typeof tf === 'undefined') {
//       throw new Error('TensorFlow.jsライブラリが読み込まれていません');
//     }
//     await tf.ready();
//     return await handpose.load(options);
//   } catch (error) {
//     console.error('Handposeの初期化に失敗:', error);
//     throw error;
//   }
// }

// function createHandColor(index) {
//   if (typeof color === 'function') {
//     return index === 0 ? color(255, 255, 0) : color(0, 255, 255);
//   }
//   return index === 0 ? { r: 255, g: 255, b: 0 } : { r: 0, g: 255, b: 255 };
// }
