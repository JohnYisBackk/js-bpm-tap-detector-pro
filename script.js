"use strict";

// ======================================================
// SELECT ELEMENTS
// ======================================================

// THEME
const themeBtn = document.getElementById("themeBtn");

// UPLOAD
const dropBox = document.querySelector(".drop-box");
const audioInput = document.getElementById("audioInput");

const trackName = document.getElementById("trackName");
const trackDetails = document.getElementById("trackDetails");
const deleteTrackBtn = document.getElementById("deleteTrackBtn");

// AUDIO PLAYER
const audioPlayer = document.getElementById("audioPlayer");

const playBtn = document.getElementById("playBtn");
const currentTime = document.getElementById("currentTime");
const audioProgress = document.getElementById("audioProgress");
const duration = document.getElementById("duration");

const volumeBtn = document.getElementById("volumeBtn");
const volumeProgress = document.getElementById("volumeProgress");

// BPM
const bpmValue = document.getElementById("bpmValue");
const tapBtn = document.getElementById("tapBtn");

// RECENT INTERVALS
const clearIntervalsBtn = document.getElementById("clearIntervalsBtn");
const recentIntervalsList = document.getElementById("recentIntervalsList");

// STATS
const tapCountValue = document.getElementById("tapCountValue");
const averageIntervalValue = document.getElementById("averageIntervalValue");
const tempoValue = document.getElementById("tempoValue");
const stabilityValue = document.getElementById("stabilityValue");

const resetAllBtn = document.getElementById("resetAllBtn");

// NAVIGATION
const navLinks = document.querySelectorAll(".nav-link");

// ======================================================
// STATE
// ======================================================

let selectedAudioFile = null;
let audioUrl = "";

let tapTimes = [];
let intervals = [];

let currentBpm = 0;
let averageInterval = 0;

let intervalTimes = [];

let tempo = "";
let stability = 0;

let currentTheme = "dark";

// ======================================================
// SAVE / LOAD DATA
// ======================================================

function saveTheme() {
  localStorage.setItem("bpmTrackerTheme", currentTheme);
}

function loadTheme() {
  const storedTheme = localStorage.getItem("bpmTrackerTheme");

  if (!storedTheme) return;

  currentTheme = storedTheme;

  updateTheme();
}

// ======================================================
// THEME
// ======================================================

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";

  updateTheme();
  saveTheme();
}

function updateTheme() {
  document.documentElement.dataset.theme = currentTheme;
}

// ======================================================
// NAVIGATION
// ======================================================

function setActiveNavLink(clickedLink) {
  navLinks.forEach((navLink) => {
    navLink.classList.remove("active");
  });

  clickedLink.classList.add("active");
}

// ======================================================
// AUDIO FILE
// ======================================================

function handleAudioFile(event) {
  const file = event.target.files[0];

  if (!file) return;

  selectedAudioFile = file;

  loadAudioFile();
  updateTrackInfo();
}

function loadAudioFile() {
  if (!selectedAudioFile) return;

  audioUrl = URL.createObjectURL(selectedAudioFile);

  audioPlayer.src = audioUrl;
  audioPlayer.load();
}

function updateTrackInfo() {
  if (!selectedAudioFile) return;

  const fileSize = (selectedAudioFile.size / 1024 / 1024).toFixed(2);

  trackName.textContent = selectedAudioFile.name;
  trackDetails.textContent = `${fileSize} MB`;
}

function removeAudioFile() {
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
  }

  selectedAudioFile = null;
  audioUrl = "";

  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  audioPlayer.load();

  audioInput.value = "";

  trackName.textContent = "No track selected";
  trackDetails.textContent = "Choose an audio file to get started";

  currentTime.textContent = "0:00";
  duration.textContent = "0:00";

  audioProgress.value = 0;

  playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
}

// ======================================================
// AUDIO PLAYER
// ======================================================

function toggleAudio() {
  if (!selectedAudioFile) return;

  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }

  updatePlayButton();
}

function updatePlayButton() {
  if (audioPlayer.paused) {
    playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
  } else {
    playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
  }
}

function updateAudioProgress() {
  if (!audioPlayer.duration) return;

  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;

  audioProgress.value = progress;

  currentTime.textContent = formatTime(audioPlayer.currentTime);
}

function changeAudioProgress() {
  if (!audioPlayer.duration) return;

  const newTime = (audioProgress.value / 100) * audioPlayer.duration;

  audioPlayer.currentTime = newTime;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function updateAudioDuration() {
  duration.textContent = formatTime(audioPlayer.duration);
}

// ======================================================
// VOLUME
// ======================================================

function changeVolume() {
  const volume = Number(volumeProgress.value);

  audioPlayer.volume = volume;
  audioPlayer.muted = volume === 0;

  updateVolumeIcon();
}

function toggleMute() {
  audioPlayer.muted = !audioPlayer.muted;

  volumeProgress.value = audioPlayer.muted ? 0 : audioPlayer.volume;

  updateVolumeIcon();
}

function updateVolumeIcon() {
  if (audioPlayer.muted || audioPlayer.volume === 0) {
    volumeBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
  } else if (audioPlayer.volume < 0.5) {
    volumeBtn.innerHTML = '<i class="bi bi-volume-down-fill"></i>';
  } else {
    volumeBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
  }
}

// ======================================================
// TAP / BPM LOGIC
// ======================================================

function handleTap() {
  const tapTime = performance.now();

  tapTimes.push(tapTime);

  if (tapTimes.length < 2) {
    updateStats();
    return;
  }

  const interval = calculateInterval();

  intervals.push(interval);

  const displayTime = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  });

  intervalTimes.push(displayTime);

  averageInterval = calculateAverageInterval();
  currentBpm = calculateBpm();
  tempo = getTempo();
  stability = calculateStability();

  renderRecentIntervals();
  updateBpm();
  updateStats();
}

function calculateInterval() {
  const lastTap = tapTimes[tapTimes.length - 1];
  const previousTap = tapTimes[tapTimes.length - 2];

  return lastTap - previousTap;
}

function calculateAverageInterval() {
  if (intervals.length === 0) return 0;

  const recentIntervals = intervals.slice(-8);

  const total = recentIntervals.reduce((sum, interval) => {
    return sum + interval;
  }, 0);

  return total / recentIntervals.length;
}

function calculateBpm() {
  if (!averageInterval) return 0;

  return Math.round(60000 / averageInterval);
}

// ======================================================
// TEMPO
// ======================================================

function getTempo() {
  if (!currentBpm) return "";

  if (currentBpm < 80) {
    return "Slow";
  } else if (currentBpm < 120) {
    return "Moderate";
  } else if (currentBpm < 160) {
    return "Fast";
  } else {
    return "Very Fast";
  }
}

// ======================================================
// STABILITY
// ======================================================

function calculateStability() {
  if (intervals.length < 2 || !averageInterval) return 0;

  const recentIntervals = intervals.slice(-8);

  const totalDifference = recentIntervals.reduce((sum, interval) => {
    return sum + Math.abs(interval - averageInterval);
  }, 0);

  const averageDifference = totalDifference / recentIntervals.length;

  const differencePercent = (averageDifference / averageInterval) * 100;

  const stabilityPercent = 100 - differencePercent;

  return Math.round(Math.max(0, stabilityPercent));
}

// ======================================================
// RECENT INTERVALS
// ======================================================

function renderRecentIntervals() {
  recentIntervalsList.innerHTML = "";

  const recentIntervals = intervals.slice(-5).reverse();
  const recentTimes = intervalTimes.slice(-5).reverse();

  recentIntervals.forEach((interval, index) => {
    const intervalItem = document.createElement("div");

    intervalItem.classList.add("recent-interval-item");

    intervalItem.innerHTML = `
      <span class="interval-number">${intervals.length - index}</span>
      <span class="interval-value">${Math.round(interval)}</span>
      <span class="interval-time">${recentTimes[index]}</span>
    `;

    recentIntervalsList.appendChild(intervalItem);
  });
}

function clearIntervals() {
  tapTimes = [];
  intervals = [];
  intervalTimes = [];

  currentBpm = 0;
  averageInterval = 0;
  tempo = "";
  stability = 0;

  renderRecentIntervals();
  updateBpm();
  updateStats();
}

// ======================================================
// UPDATE UI
// ======================================================

function updateBpm() {
  bpmValue.textContent = currentBpm || 0;
}

function updateStats() {
  tapCountValue.textContent = tapTimes.length;

  averageIntervalValue.textContent = averageInterval
    ? `${Math.round(averageInterval)} ms`
    : "0 ms";

  tempoValue.textContent = tempo || "-";
  stabilityValue.textContent = `${stability} %`;
}

// ======================================================
// RESET APP
// ======================================================

// ======================================================
// RESET APP
// ======================================================

function resetTaps() {
  tapTimes = [];
  intervals = [];
  intervalTimes = [];

  currentBpm = 0;
  averageInterval = 0;
  tempo = "";
  stability = 0;

  renderRecentIntervals();
  updateBpm();
  updateStats();
}

function resetAll() {
  resetTaps();
  removeAudioFile();
}

// ======================================================
// KEYBOARD
// ======================================================

function handleKeyboard(event) {
  const activeElement = event.target;

  if (activeElement.tagName === "INPUT" || activeElement.tagName === "BUTTON") {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();

    handleTap();
  }

  if (event.key.toLowerCase() === "r") {
    resetTaps();
  }
}

// ======================================================
// EVENT LISTENERS
// ======================================================

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setActiveNavLink(link);
  });
});

themeBtn.addEventListener("click", toggleTheme);

audioInput.addEventListener("change", handleAudioFile);
deleteTrackBtn.addEventListener("click", removeAudioFile);

playBtn.addEventListener("click", toggleAudio);

audioPlayer.addEventListener("timeupdate", updateAudioProgress);
audioPlayer.addEventListener("loadedmetadata", updateAudioDuration);

audioProgress.addEventListener("input", changeAudioProgress);

audioPlayer.addEventListener("play", updatePlayButton);
audioPlayer.addEventListener("pause", updatePlayButton);
audioPlayer.addEventListener("ended", updatePlayButton);

volumeProgress.addEventListener("input", changeVolume);
volumeBtn.addEventListener("click", toggleMute);

tapBtn.addEventListener("click", handleTap);

clearIntervalsBtn.addEventListener("click", clearIntervals);

resetAllBtn.addEventListener("click", resetAll);

document.addEventListener("keydown", handleKeyboard);

// ======================================================
// INITIALIZE APP
// ======================================================

function init() {
  loadTheme();
  updateTheme();

  renderRecentIntervals();

  updateBpm();
  updateStats();

  updatePlayButton();
  updateVolumeIcon();
}

init();
