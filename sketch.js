// let balls = [];
// let fing = 0; //機能の数
// let handpose;
// let video;
// let flippedVideo;
// let predictions = [];
// let ftip = new Array(5);
// let canvas2;

// const options = {

//   flipHorizontal: true,
  
//   maxContinuousChecks: Infinity,

//   detectionConfidence: 0.6,
  
//   scoreThreshold: 0.75,
  
//   iouThreshold: 0.3,

// }


// function setup() {

//   createCanvas(640, 480);

//   canvas2 = createGraphics(width, height);

//   canvas2.strokeWeight(5);

//   video = createCapture(VIDEO);

//   video.size(width, height);

//   for (let i = 0; i < 5; i++) {

//     ftip[i] = new Array(2);

//   }

//   flippedVideo = ml5.flipImage(video);

//   handpose = ml5.handpose(video, options, modelReady);

//   handpose.on("predict", results => {
//     predictions = results;
//   });

//   video.hide();

// }


// function modelReady() {

//   console.log("Model ready!");

// }


// function draw() {

//   flippedVideo = ml5.flipImage(video);

//   image(flippedVideo, 0, 0, width, height);

//   image(canvas2, 0, 0);

//   drawKeypoints(fing);
//   if (fing == 2) {
//     canvas2.clear();
//     for (let i = 0; i < balls.length; i++) {
//       let ball = balls[i];
//       noStroke();
//       fill(234, 90, 255, 90);
//       ellipse(ball.x, ball.y, 10, 10);
//       ball.xSpeed = ball.x - ball.prevx;
//       ball.ySpeed = ball.y - ball.prevy;
//       ball.ySpeed *= 1.98;
//       ball.x += ball.xSpeed * 0.1;
//       ball.y += ball.ySpeed * 0.1;
//     }
//   }
// }

// function mousePressed() {
//   if (fing != 2) {
//     fing++;
//   }
//   else fing = 0;
// }

// function drawKeypoints(func) {

//   for (let i = 0; i < predictions.length; i += 1) {

//     const prediction = predictions[i];

//     let pKeypoint;

//     for (let j = 0; j < prediction.landmarks.length; j += 1) {

//       const keypoint = prediction.landmarks[j];

//       if (func == 0) {
//         if (j > 0 && (j != 5 && j != 9 && j != 13 && j != 17)) {

//           stroke(255, 255, 0);

//           line(pKeypoint[0], pKeypoint[1], keypoint[0], keypoint[1]);
//         }

//         if (j == 6 || j == 10 || j == 14 || j == 18) {
//           stroke(255, 255, 0);

//           line(pKeypoint[0], pKeypoint[1], prediction.landmarks[0][0], prediction.landmarks[0][1]);
//         }

//         if (j == 2 || j == 3 || j == 4 || j == 5) {
//           for (let m = j - 1; m < j + 12; m += 4) {
//             stroke(255, 255, 0);

//             line(prediction.landmarks[m][0], prediction.landmarks[m][1], prediction.landmarks[m + 4][0], prediction.landmarks[m + 4][1]);
//           }
//         }
//       }
//       if (func == 1) {
//         if (j == 8) {
//           canvas2.ellipse(keypoint[0], keypoint[1], 5, 5);
//         }
//       }
//       pKeypoint = keypoint;
//     }

//     let count = 0;

//     for (let i = 4; i <= 20; i += 4) {

//       if (func == 2) {
//         balls.push({
//           x: prediction.landmarks[i][0],
//           y: prediction.landmarks[i][1],
//           xSpeed: 0,
//           ySpeed: 0,
//           prevx: ftip[count][0],
//           prevy: ftip[count][1],
//         });
//       }

//       ftip[count][0] = prediction.landmarks[i][0];

//       ftip[count][1] = prediction.landmarks[i][1];

//       count++;
//     }
//   }
// }














// let balls = [];
// let fing = 0; // 機能の数
// let handpose;
// let video;
// let predictions = [];
// let ftip = new Array(5);
// let canvas2;

// const options = {
//   flipHorizontal: true,
//   maxContinuousChecks: Infinity,
//   detectionConfidence: 0.6,
//   scoreThreshold: 0.75,
//   iouThreshold: 0.3,
// };

// function setup() {
//   createCanvas(640, 480);
//   canvas2 = createGraphics(width, height);
//   canvas2.strokeWeight(5);

//   video = createCapture(VIDEO);
//   video.size(width, height);

//   for (let i = 0; i < 5; i++) {
//     ftip[i] = new Array(2);
//   }

//   // handposeモデルの読み込み
//   handpose = ml5.handpose(video, options, modelReady);

//   // 手のポーズが検出されるたびに予測を保存
//   handpose.on("predict", (results) => {
//     predictions = results;
//   });

//   video.hide();
// }

// function modelReady() {
//   console.log("Model ready!");
// }

// function draw() {
//   // ミラーリング処理
//   translate(width, 0);
//   scale(-1, 1);
//   image(video, 0, 0, width, height);
//   resetMatrix(); // 描画座標系を元に戻す

//   // キャンバスに描画
//   image(canvas2, 0, 0);

//   drawKeypoints(fing);

//   if (fing == 2) {
//     canvas2.clear();
//     for (let i = 0; i < balls.length; i++) {
//       let ball = balls[i];
//       noStroke();
//       fill(234, 90, 255, 90);
//       ellipse(ball.x, ball.y, 10, 10);
//       ball.xSpeed = ball.x - ball.prevx;
//       ball.ySpeed = ball.y - ball.prevy;
//       ball.ySpeed *= 1.98;
//       ball.x += ball.xSpeed * 0.1;
//       ball.y += ball.ySpeed * 0.1;
//     }
//   }
// }

// // クリックで機能切り替え
// function mousePressed() {
//   if (fing != 2) {
//     fing++;
//   } else {
//     fing = 0;
//   }
// }

// // 手のキーポイント描画
// function drawKeypoints(func) {
//   for (let i = 0; i < predictions.length; i += 1) {
//     const prediction = predictions[i];
//     let pKeypoint;

//     for (let j = 0; j < prediction.landmarks.length; j += 1) {
//       const keypoint = prediction.landmarks[j];

//       if (func == 0) {
//         // 指の線を描画
//         if (j > 0 && j != 5 && j != 9 && j != 13 && j != 17) {
//           stroke(255, 255, 0);
//           line(pKeypoint[0], pKeypoint[1], keypoint[0], keypoint[1]);
//         }

//         if (j == 6 || j == 10 || j == 14 || j == 18) {
//           stroke(255, 255, 0);
//           line(pKeypoint[0], pKeypoint[1], prediction.landmarks[0][0], prediction.landmarks[0][1]);
//         }

//         if (j == 2 || j == 3 || j == 4 || j == 5) {
//           for (let m = j - 1; m < j + 12; m += 4) {
//             stroke(255, 255, 0);
//             line(
//               prediction.landmarks[m][0],
//               prediction.landmarks[m][1],
//               prediction.landmarks[m + 4][0],
//               prediction.landmarks[m + 4][1]
//             );
//           }
//         }
//       }

//       if (func == 1 && j == 8) {
//         // 人差し指の先端にポイント
//         canvas2.ellipse(keypoint[0], keypoint[1], 5, 5);
//       }
//       pKeypoint = keypoint;
//     }

//     // 指の動きを追跡
//     let count = 0;
//     for (let i = 4; i <= 20; i += 4) {
//       if (func == 2) {
//         balls.push({
//           x: prediction.landmarks[i][0],
//           y: prediction.landmarks[i][1],
//           xSpeed: 0,
//           ySpeed: 0,
//           prevx: ftip[count][0],
//           prevy: ftip[count][1],
//         });
//       }
//       ftip[count][0] = prediction.landmarks[i][0];
//       ftip[count][1] = prediction.landmarks[i][1];
//       count++;
//     }
//   }
// }











// let balls = [];
// let fing = 0;
// let video;
// let handposeModel;
// let predictions = [];
// let ftip = new Array(5);
// let canvas2;

// async function setup() {
//   createCanvas(640, 480);
//   canvas2 = createGraphics(width, height);
//   canvas2.strokeWeight(5);

//   video = createCapture(VIDEO);
//   video.size(width, height);

//   for (let i = 0; i < 5; i++) {
//     ftip[i] = new Array(2);
//   }

//   video.hide();

//   // TensorFlow.jsのhandposeモデルをロード
//   handposeModel = await handpose.load();
//   console.log("Handpose model loaded!");

//   detectHands();
// }

// // 手の検出を行う
// async function detectHands() {
//   const predictionsResult = await handposeModel.estimateHands(video.elt);
//   predictions = predictionsResult;
//   detectHands();  // 再帰的に検出を繰り返す
// }

// function draw() {
//   translate(width, 0);
//   scale(-1, 1);
//   image(video, 0, 0, width, height);
//   resetMatrix();

//   image(canvas2, 0, 0);

//   drawKeypoints(fing);

//   if (fing == 2) {
//     canvas2.clear();
//     for (let i = 0; i < balls.length; i++) {
//       let ball = balls[i];
//       noStroke();
//       fill(234, 90, 255, 90);
//       ellipse(ball.x, ball.y, 10, 10);
//       ball.xSpeed = ball.x - ball.prevx;
//       ball.ySpeed = ball.y - ball.prevy;
//       ball.ySpeed *= 1.98;
//       ball.x += ball.xSpeed * 0.1;
//       ball.y += ball.ySpeed * 0.1;
//     }
//   }
// }

// // クリックで機能切り替え
// function mousePressed() {
//   if (fing != 2) {
//     fing++;
//   } else {
//     fing = 0;
//   }
// }

// // 手のキーポイントを描画
// function drawKeypoints(func) {
//   for (let i = 0; i < predictions.length; i++) {
//     const prediction = predictions[i];
//     let pKeypoint;

//     for (let j = 0; j < prediction.landmarks.length; j++) {
//       const keypoint = prediction.landmarks[j];

//       if (func == 0) {
//         // 指の線を描画
//         if (j > 0 && j != 5 && j != 9 && j != 13 && j != 17) {
//           stroke(255, 255, 0);
//           line(pKeypoint[0], pKeypoint[1], keypoint[0], keypoint[1]);
//         }

//         if (j == 6 || j == 10 || j == 14 || j == 18) {
//           stroke(255, 255, 0);
//           line(pKeypoint[0], pKeypoint[1], prediction.landmarks[0][0], prediction.landmarks[0][1]);
//         }

//         if (j == 2 || j == 3 || j == 4 || j == 5) {
//           for (let m = j - 1; m < j + 12; m += 4) {
//             stroke(255, 255, 0);
//             line(
//               prediction.landmarks[m][0],
//               prediction.landmarks[m][1],
//               prediction.landmarks[m + 4][0],
//               prediction.landmarks[m + 4][1]
//             );
//           }
//         }
//       }

//       if (func == 1 && j == 8) {
//         // 人差し指の先端にポイント
//         canvas2.ellipse(keypoint[0], keypoint[1], 5, 5);
//       }
//       pKeypoint = keypoint;
//     }

//     let count = 0;
//     for (let i = 4; i <= 20; i += 4) {
//       if (func == 2) {
//         balls.push({
//           x: prediction.landmarks[i][0],
//           y: prediction.landmarks[i][1],
//           xSpeed: 0,
//           ySpeed: 0,
//           prevx: ftip[count][0],
//           prevy: ftip[count][1],
//         });
//       }
//       ftip[count][0] = prediction.landmarks[i][0];
//       ftip[count][1] = prediction.landmarks[i][1];
//       count++;
//     }
//   }
// }











// let balls = [];
// let fing = 0;
// let video;
// let handposeModel;
// let predictions = [];
// let ftip = Array.from({ length: 5 }, () => Array(2)); // 指先の座標を記録する配列
// let canvas2;
// let trail = [];
// const trailLength = 20;  // 軌跡の最大長さ

// // handposeモデルのオプション設定
// const options = {
//   flipHorizontal: true,
//   maxContinuousChecks: 5,  // 無限チェックを制限して負荷軽減
//   detectionConfidence: 0.7,  // 精度を上げて誤検出を減らす
//   scoreThreshold: 0.75,
//   iouThreshold: 0.3,
// };

// // 初期セットアップ関数
// async function setup() {
//   createCanvas(640, 480); // メインキャンバスの作成
//   canvas2 = createGraphics(width, height); // 手描き用のサブキャンバス
//   canvas2.strokeWeight(5);

//   video = createCapture(VIDEO); // カメラ映像の取得
//   video.size(width, height);
//   video.hide(); // 映像を隠す（描画は自前で行う）

//   // TensorFlow.jsが準備完了するまで待機
//   await tf.ready();
//   console.log("TensorFlow.js is ready!");

//   // handposeモデルをロード
//   handposeModel = await handpose.load(options);
//   console.log("Handpose model loaded!");

//   frameRate(30);  // フレームレートを調整して負荷を軽減
// }

// // 毎フレーム呼び出される描画関数
// async function draw() {
//   translate(width, 0);
//   scale(-1, 1); // カメラ映像を左右反転
//   image(video, 0, 0, width, height);
//   resetMatrix(); // 座標系をリセット

//   image(canvas2, 0, 0); // 手描きキャンバスを重ねる

//   // 手の検出処理を行う（非同期処理の負荷軽減）
//   if (handposeModel && frameCount % 2 === 0) {
//     predictions = await handposeModel.estimateHands(video.elt);
//   }

//   drawKeypoints(fing);

//   // ボールの動きの描画処理
//   if (fing === 2) {
//     canvas2.clear();
//     balls.forEach((ball) => {
//       noStroke();
//       let colorHue = map(ball.y, 0, height, 0, 360); // Y座標で色を変更
//       fill(colorHue, 90, 255, 90);
//       ellipse(ball.x, ball.y, 10, 10);
//       ball.xSpeed = lerp(ball.xSpeed || 0, ball.x - ball.prevx, 0.2);
//       ball.ySpeed = lerp(ball.ySpeed || 0, ball.y - ball.prevy, 0.2);
//       ball.ySpeed *= 0.9;  // 減衰を追加
//       ball.x += ball.xSpeed * 0.05;  // 動きのスムーズ化
//       ball.y += ball.ySpeed * 0.05;
//     });
//     balls = balls.slice(-100);  // ボールの配列長を制限してメモリ消費を抑制
//   }
// }

// // マウスクリックで機能切り替え
// function mousePressed() {
//   fing = (fing + 1) % 3;
// }

// // キーポイントの描画処理
// function drawKeypoints(func) {
//   predictions.forEach((prediction) => {
//     let pKeypoint;

//     // 軌跡の描画処理
//     if (func === 1) {
//       canvas2.noFill();
//       canvas2.stroke(0, 255, 0); // 緑色の線
//       canvas2.strokeWeight(2);
//     }

//     prediction.landmarks.forEach((keypoint, j) => {
//       let mirroredX = width - keypoint[0]; // X座標を反転
//       let mirroredY = keypoint[1];

//       // 人差し指の軌跡描画処理
//       if (func === 1 && j === 8) {
//         trail.push([mirroredX, mirroredY]);
//         if (trail.length > trailLength) trail.shift(); // 軌跡の長さを制限

//         canvas2.beginShape();
//         trail.forEach(([x, y]) => canvas2.curveVertex(x, y)); // 曲線で軌跡を描画
//         canvas2.endShape();

//         let colorHue = map(mirroredY, 0, height, 0, 360);
//         canvas2.fill(colorHue, 90, 255); // 軌跡の色を指の高さで変化
//         canvas2.ellipse(mirroredX, mirroredY, 8, 8); // 人差し指先端に円を描画
//       }

//       // 指の関節を結ぶ線の描画
//       if (func === 0) {
//         drawConnections(j, pKeypoint, mirroredX, mirroredY, prediction);
//       }

//       pKeypoint = [mirroredX, mirroredY];
//     });

//     // ボールの更新処理
//     updateBalls(prediction, func);
//   });
// }

// // 関節を線で結ぶ処理
// function drawConnections(j, pKeypoint, mirroredX, mirroredY, prediction) {
//   if (pKeypoint && j > 0 && ![5, 9, 13, 17].includes(j)) {
//     stroke(255, 255, 0); // 黄色の線
//     line(pKeypoint[0], pKeypoint[1], mirroredX, mirroredY);
//   }
//   if ([6, 10, 14, 18].includes(j)) {
//     stroke(255, 255, 0);
//     line(pKeypoint[0], pKeypoint[1], width - prediction.landmarks[0][0], prediction.landmarks[0][1]);
//   }
//   if ([2, 3, 4, 5].includes(j)) {
//     for (let m = j - 1; m < j + 12; m += 4) {
//       stroke(255, 255, 0);
//       line(
//         width - prediction.landmarks[m][0],
//         prediction.landmarks[m][1],
//         width - prediction.landmarks[m + 4][0],
//         prediction.landmarks[m + 4][1]
//       );
//     }
//   }
// }

// // ボールの座標を更新する処理
// function updateBalls(prediction, func) {
//   if (func !== 2) return;

//   prediction.landmarks.filter((_, index) => index >= 4 && (index - 4) % 4 === 0).forEach((keypoint, count) => {
//     let mirroredX = width - keypoint[0];
//     let mirroredY = keypoint[1];

//     balls.push({
//       x: mirroredX,
//       y: mirroredY,
//       xSpeed: 0,
//       ySpeed: 0,
//       prevx: ftip[count][0],
//       prevy: ftip[count][1],
//     });

//     [ftip[count][0], ftip[count][1]] = [mirroredX, mirroredY];
//   });
// }





/***************************************************
 * 修正版サンプルコード
 * p5.js + @tensorflow-models/handpose を利用
 ***************************************************/

/** 
 * 指先ランドマークのインデックス（handposeでの標準インデックス）
 * 参考: https://github.com/tensorflow/tfjs-models/tree/master/handpose
 */
const THUMB_TIP = 4;
const INDEX_FINGER_TIP = 8;
const MIDDLE_FINGER_TIP = 12;
const RING_FINGER_TIP = 16;
const PINKY_TIP = 20;

// 軌跡描画用
const TRAIL_LENGTH = 20; 
let trail = [];          

// 指先の座標を前フレームで記録する配列（ボール用）
let ftip = Array.from({ length: 5 }, () => Array(2).fill(0));

// ボール描画用配列とモード切り替え変数
let balls = [];
let fing = 0;

// handpose関連
let video;
let handposeModel;
let predictions = [];

// p5.jsのサブキャンバス（軌跡やお絵かきを別レイヤーで管理）
let canvas2;

// handposeモデルのオプション設定
const options = {
  flipHorizontal: true,
  maxContinuousChecks: 5,
  detectionConfidence: 0.7,
  scoreThreshold: 0.75,
  iouThreshold: 0.3,
};


const windowSize = () => [
  window.innerWidth,
  window.innerHeight,
];

//------------------------------
// p5.jsのセットアップ関数
//------------------------------
async function setup() {
  createCanvas(640, 480);

  // デフォルトがRGBですが、HSBを使う場合は切り替えてください
  // colorMode(HSB);

  canvas2 = createGraphics(width, height);
  canvas2.strokeWeight(5);

  // カメラ映像の取得
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // TensorFlow.jsの準備が完了するまで待機
  await tf.ready();
  console.log("TensorFlow.js is ready!");

  // handposeモデルのロード
  handposeModel = await handpose.load(options);
  console.log("Handpose model loaded!");

  frameRate(30); // フレームレート調整
}

//------------------------------
// p5.jsのメイン描画ループ
//------------------------------
async function draw() {
  background(0);

  // カメラ映像を左右反転して描画
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // サブキャンバスを重ねる
  image(canvas2, 0, 0);

  // 一定フレームごとに手の検出
  if (handposeModel && frameCount % 2 === 0) {
    predictions = await handposeModel.estimateHands(video.elt);
  }

  // 手の検出結果をモードに応じて描画
  drawHand(predictions, fing);

  // ボール描画モード時のみ、ボールの動きを更新・描画
  if (fing === 2) {
    canvas2.clear(); // ボール用にサブキャンバスを一度クリア
    drawBalls();
  }
}

//------------------------------
// マウスクリックでモード切り替え
//------------------------------
function mousePressed() {
  fing = (fing + 1) % 3;
}

function touchEnded() {
  fing = (fing + 1) % 3;
}

//------------------------------
// 手の描画をモード別に処理
//------------------------------
function drawHand(predictions, mode) {
  predictions.forEach((prediction) => {
    switch (mode) {
      case 0:
        // 元のコードと同じスケルトン描画
        drawSkeleton(prediction);
        break;
      case 1:
        // 人差し指の軌跡描画
        drawIndexTrail(prediction);
        break;
      case 2:
        // ボール用の指先更新
        updateBalls(prediction);
        break;
      default:
        break;
    }
  });
}

//==================================================
// (A) スケルトン描画 (fing = 0)
//==================================================
function drawSkeleton(prediction) {
  // 元のコードにあったロジックを再現
  let pKeypoint = null;

  prediction.landmarks.forEach((keypoint, j) => {
    const mirroredX = width - keypoint[0];
    const mirroredY = keypoint[1];

    // スケルトンの線を引く処理
    drawConnections(j, pKeypoint, mirroredX, mirroredY, prediction);

    // 次回ループ用に、今回の座標を pKeypoint として保存
    pKeypoint = [mirroredX, mirroredY];
  });
}

// 元のコードから移植したスケルトン描画用の接続関数
function drawConnections(j, pKeypoint, mirroredX, mirroredY, prediction) {
  // スケルトンの色（RGBで鮮やかな黄色）
  stroke(255, 255, 0);
  strokeWeight(2);

  // 1) 前のキーポイントがある & 特定のインデックス以外なら線を結ぶ
  if (pKeypoint && j > 0 && ![5, 9, 13, 17].includes(j)) {
    line(pKeypoint[0], pKeypoint[1], mirroredX, mirroredY);
  }

  // 2) 特定の指のインデックスの場合、手首(landmarks[0])に線を結ぶ
  if ([6, 10, 14, 18].includes(j) && pKeypoint) {
    line(
      pKeypoint[0],
      pKeypoint[1],
      width - prediction.landmarks[0][0],
      prediction.landmarks[0][1]
    );
  }

  // 3) [2, 3, 4, 5] などの場合に指をまとめて結ぶ処理
  //    (親指の骨格を描いているような処理)
  if ([2, 3, 4, 5].includes(j)) {
    for (let m = j - 1; m < j + 12; m += 4) {
      // m+4 が配列範囲を超えないようチェックする手もあり
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
// (B) 人差し指の軌跡描画 (fing = 1)
//==================================================
function drawIndexTrail(prediction) {
  const { landmarks } = prediction;

  // 人差し指先端(INDEX_FINGER_TIP)の座標のみ取得
  const x = width - landmarks[INDEX_FINGER_TIP][0];
  const y = landmarks[INDEX_FINGER_TIP][1];

  // 軌跡を記録
  trail.push([x, y]);
  if (trail.length > TRAIL_LENGTH) {
    trail.shift();
  }

  // サブキャンバスに軌跡を描画
  canvas2.noFill();
  canvas2.stroke(0, 255, 0); // 緑色
  canvas2.strokeWeight(2);
  canvas2.beginShape();
  trail.forEach(([tx, ty]) => {
    canvas2.curveVertex(tx, ty);
  });
  canvas2.endShape();

  // 指先に円を描画（高さに応じて色変えたい場合はHSBに戻す）
  canvas2.fill(0, 255, 0);
  canvas2.noStroke();
  canvas2.ellipse(x, y, 10, 10);
}

//==================================================
// (C) ボール用の座標更新 (fing = 2)
//==================================================
function updateBalls(prediction) {
  const { landmarks } = prediction;
  // 指先 (サム,インデックス,中指,薬指,小指) のみ抽出
  const fingertips = [THUMB_TIP, INDEX_FINGER_TIP, MIDDLE_FINGER_TIP, RING_FINGER_TIP, PINKY_TIP];

  fingertips.forEach((tipIndex, count) => {
    const keypoint = landmarks[tipIndex];
    let mirroredX = width - keypoint[0];
    let mirroredY = keypoint[1];

    // ボール生成
    balls.push({
      x: mirroredX,
      y: mirroredY,
      xSpeed: 0,
      ySpeed: 0,
      prevx: ftip[count][0],
      prevy: ftip[count][1],
    });

    // 今回の指先座標を記録
    [ftip[count][0], ftip[count][1]] = [mirroredX, mirroredY];
  });
}

//--------------------------------------------------
// (C-2) ボールを描画 (fing = 2)
//--------------------------------------------------
function drawBalls() {
  balls.forEach((ball) => {
    noStroke();
    fill(180, 180, 255, 180); // お好みの色 (RGB)
    ellipse(ball.x, ball.y, 10, 10);

    // 慣性をつける
    ball.xSpeed = lerp(ball.xSpeed || 0, ball.x - ball.prevx, 0.2);
    ball.ySpeed = lerp(ball.ySpeed || 0, ball.y - ball.prevy, 0.2);

    // 減衰
    ball.ySpeed *= 0.9;

    // ボールの位置を更新
    ball.x += ball.xSpeed * 0.05;
    ball.y += ball.ySpeed * 0.05;
  });

  // メモリ節約のため配列を一定以上溜まらないようにする
  balls = balls.slice(-100);
}

