/* DM3014 Interactive Devices, Ashley Hi 2026
 * Week 6 - Teachable Machine
 * Train Your Own Model
 *
 * Umbrella   -> rain falls
 * Clown Fish -> bubbles appear
 * Nothing    -> nothing happens
 */
 
let classifier;
// model url *** edit link here
const imageModelURL = "https://teachablemachine.withgoogle.com/models/PXMgJli0A/";
 
let video;
let flippedVideo;
let label = ""; // to store classifications
let confidence = 0;
 
// only react when the model is at least this sure (0 to 1)
const CONFIDENCE_THRESHOLD = 0.85;
 
// true when the webcam is actually giving us a picture (not black)
let cameraOK = false;
 
// 0 = effect off, 1 = effect fully on (eases so effects fade in and out)
let rainAmt = 0;
let bubbleAmt = 0;
 
let raindrops = [];
let bubbles = [];
 
function preload() {
  classifier = ml5.imageClassifier(imageModelURL + "model.json");
}
 
function setup() {
  createCanvas(320, 260);
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();
  flippedVideo = ml5.flipImage(video);
 
  for (let i = 0; i < 60; i++) {
    raindrops.push({
      x: random(width),
      y: random(height),
      len: random(8, 18),
      speed: random(4, 9),
    });
  }
 
  for (let i = 0; i < 30; i++) {
    bubbles.push({
      x: random(width),
      y: random(height),
      r: random(3, 10),
      speed: random(0.6, 2.2),
      wobble: random(TWO_PI),
    });
  }
 
  classifyVideo();
}
 
function draw() {
  background(0);
 
  // check the camera is really on (every 15 frames)
  if (frameCount % 15 === 0) cameraOK = checkCamera();
 
  // draw the webcam feed, mirrored like a selfie view
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, 320, 240);
  pop();
 
  // *** edit here: match these to your Teachable Machine class names
  const l = label.toLowerCase().replace(/\s+/g, "");
  const isUmbrella =
    cameraOK && l === "umbrella" && confidence >= CONFIDENCE_THRESHOLD;
  const isClownfish =
    cameraOK && l === "clownfish" && confidence >= CONFIDENCE_THRESHOLD;
 
  // ease each effect towards on (1) or off (0)
  rainAmt = lerp(rainAmt, isUmbrella ? 1 : 0, 0.1);
  bubbleAmt = lerp(bubbleAmt, isClownfish ? 1 : 0, 0.1);
 
  if (rainAmt > 0.01) drawRain();
 
  if (bubbleAmt > 0.01) {
    // light blue ocean colour over the video
    noStroke();
    fill(120, 200, 255, 110 * bubbleAmt);
    rect(0, 0, width, 240);
    drawBubbles();
  }
 
  // draw label
  noStroke();
  textAlign(CENTER);
  textSize(16);
  if (cameraOK) {
    fill(255);
    text(label + " " + nf(confidence * 100, 1, 0) + "%", width / 2, height - 4);
  } else {
    fill(255, 120, 120);
    text("Camera is black - check permissions", width / 2, height - 4);
  }
}
 
// samples pixels from the webcam: returns false if the picture is (nearly) black
function checkCamera() {
  if (!video || video.width === 0) return false;
  video.loadPixels();
  if (video.pixels.length === 0) return false;
  let total = 0;
  let count = 0;
  for (let i = 0; i < video.pixels.length; i += 4 * 200) {
    total += video.pixels[i] + video.pixels[i + 1] + video.pixels[i + 2];
    count += 3;
  }
  return total / count > 8; // average brightness above ~3%
}
 
function drawRain() {
  stroke(200, 225, 255, 220 * rainAmt);
  strokeWeight(1.5);
  for (let d of raindrops) {
    line(d.x, d.y, d.x - 2, d.y + d.len);
    d.y += d.speed;
    d.x -= 0.5;
    if (d.y > height) {
      d.y = -d.len;
      d.x = random(width + 20);
    }
  }
}
 
function drawBubbles() {
  stroke(255, 255, 255, 220 * bubbleAmt);
  strokeWeight(1.5);
  fill(255, 255, 255, 60 * bubbleAmt);
  for (let b of bubbles) {
    circle(b.x + sin(frameCount * 0.05 + b.wobble) * 6, b.y, b.r * 2);
    b.y -= b.speed;
    if (b.y < -10) {
      b.y = height + 10;
      b.x = random(width);
    }
  }
}
 
// get prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video);
  classifier.classify(flippedVideo, gotResult);
}
 
function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }
 
  label = results[0].label; // results in array ordered by confidence
  confidence = results[0].confidence;
 
  classifyVideo(); // classify again
}