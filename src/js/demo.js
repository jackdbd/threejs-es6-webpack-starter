const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const puppeteer = require("puppeteer");
const { execFile } = require("child_process");

// const HOST = "http://localhost:8080";
const HOST = "https://jackdbd.github.io/threejs-es6-webpack-starter";
const TMP_IMAGES = path.join(__dirname, "..", "..", "tmp_demo_images");
const DEMO_VIDEO = path.join(__dirname, "..", "..", "demo.mp4");

const directNavigationOptions = {
  waitUntil: "networkidle2",
};

// ESLint requires its parser to be babel-eslint (see .eslintrc.json), otherwise
// it does not understand that async functions are available in Node scripts.
// https://stackoverflow.com/a/43426331/3036129
(async function iife() {
  // console.log("iife -> iife");
  if (fs.existsSync(TMP_IMAGES)) {
    rimraf.sync(TMP_IMAGES);
  }
  fs.mkdirSync(TMP_IMAGES);

  if (fs.existsSync(DEMO_VIDEO)) {
    rimraf.sync(DEMO_VIDEO);
  }

  const browser = await puppeteer.launch({ headless: true });
  // console.log("iife -> browser", browser);
  const page = await browser.newPage();
  // console.log("iife -> page", page, directNavigationOptions);
  await page.goto(`${HOST}`, directNavigationOptions);

  // await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  const el = await page.$(".canvas-container > canvas");
  // console.log("iife -> el", el);

  // step through each frame:
  // - increment currentTime on the page
  // - save a screenshot
  const NUM_FRAMES = 300;
  const frames = Array(NUM_FRAMES)
    .fill({})
    .map((_, i) => i);
  for (let frame of frames) {
    // await page.evaluate(frame => (currentTime = (frame * 1000) / 60), frame);
    // await page.evaluate(frame => {
    //   console.warn("currentTime BEFORE", window);
    //   currentTime = (frame * 1000) / 60;
    //   console.warn("currentTime AFTER", currentTime);
    //   return;
    // }, frame);
    // await sleep(50);

    if (frame < 20) {
      await el.hover();
    } else if (frame > 40) {
      await el.click({ button: "left" });
    }

    const framePath = path.join(TMP_IMAGES, `${frame}.png`);
    const options = {
      path: framePath,
    };
    console.log(`screenshot: ${framePath}`);
    await el.screenshot(options);
  }
  await browser.close();

  // TODO: make video with ffmpeg or similar, maybe a webm

  // const str = "overlay=10:10";
  const child = execFile(
    "ffmpeg",
    [
      "-framerate",
      "60",
      "-pattern_type",
      "glob",
      "-i",
      "tmp_demo_images/*.png",
      "demo.mp4",
    ],
    (error, stdout, stderr) => {
      if (error) {
        console.error("stderr", stderr);
        throw error;
      }
      console.log("stdout", stdout);
      rimraf.sync(TMP_IMAGES);
    }
  );

  // cleanup
  // rimraf.sync(TMP_IMAGES);
})().catch(err => {
  // The top-level async function `iife` might reject, since it has many `await`
  // that might fail. To avoid any UnhandledPromiseRejectionWarning, we can
  // either catch the errors there, or catch them here.
  // https://stackoverflow.com/a/46515787/3036129
  console.error(err);
});

/**
 * Remain idle for ms milliseconds
 *
 * @param {*} ms number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
