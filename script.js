'use strict';

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const SHUFFLE_MOVES = 80;
const PREVIEW_DURATION = 5000;
const PUZZLE_IMAGES = [];
const COMPLETED_STORAGE_KEY = 'eightPuzzleCompletedImages';

const boardElement = document.querySelector('#board');
const moveCountElement = document.querySelector('#move-count');
const timerElement = document.querySelector('#timer');
const statusElement = document.querySelector('#status');
const messageElement = document.querySelector('#message');
const levelNumberElement = document.querySelector('#level-number');
const nextLevelButton = document.querySelector('#next-level-button');
const resetProgressButton = document.querySelector('#reset-progress-button');
const completedGalleryElement = document.querySelector('#completed-gallery');
const completedEmptyElement = document.querySelector('#completed-empty');
const completedCountElement = document.querySelector('#completed-count');
const imageDialog = document.querySelector('#image-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogImageTitle = document.querySelector('#dialog-image-title');
const dialogCloseButton = document.querySelector('#dialog-close');

let board = [...GOAL_STATE];
let moveCount = 0;
let elapsedSeconds = 0;
let timerInterval = null;
let gameStarted = false;
let isPreviewing = true;
let previewTimeout = null;
let imageLoaded = false;
let currentLevelIndex = 0;
let gameCompleted = false;
let imageLoadRequestId = 0;
let currentImageFilename = null;

function arraysEqual(a, b) {
  return a.every((value, index) => value === b[index]);
}

function isSolved() {
  return arraysEqual(board, GOAL_STATE);
}

function adjacent(indexA, indexB) {
  const rowA = Math.floor(indexA / 3);
  const colA = indexA % 3;
  const rowB = Math.floor(indexB / 3);
  const colB = indexB % 3;
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

function renderBoard() {
  boardElement.replaceChildren();
  const emptyIndex = board.indexOf(0);

  board.forEach((tileValue, index) => {
    if (tileValue === 0) {
      const emptyTile = document.createElement('div');
      emptyTile.className = 'tile empty';
      emptyTile.setAttribute('aria-label', 'Empty space');
      emptyTile.setAttribute('aria-hidden', 'true');
      boardElement.append(emptyTile);
      return;
    }

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.disabled = isPreviewing || gameCompleted || !adjacent(index, emptyIndex);
    tile.setAttribute('aria-label', `Move tile ${tileValue}`);
    tile.addEventListener('click', () => moveTile(index));

    if (imageLoaded && currentImageFilename) {
      tile.classList.add('has-image');
      const sourceTile = tileValue - 1;
      const column = sourceTile % 3;
      const row = Math.floor(sourceTile / 3);
      tile.style.backgroundImage = `url("images/${encodeURIComponent(currentImageFilename)}")`;
      tile.style.backgroundSize = '300% 300%';
      tile.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
      tile.style.backgroundRepeat = 'no-repeat';
    } else {
      tile.classList.add('missing-image');
    }

    const number = document.createElement('span');
    number.className = 'tile-number';
    number.textContent = String(tileValue);
    tile.append(number);
    boardElement.append(tile);
  });
}

// Use the local image directly so the game also works when opened with file://.
function loadPuzzleImage(filename) {
  currentImageFilename = filename;
  const requestId = ++imageLoadRequestId;
  if (previewTimeout !== null) {
    window.clearTimeout(previewTimeout);
    previewTimeout = null;
  }
  stopTimer();
  board = [...GOAL_STATE];
  moveCount = 0;
  elapsedSeconds = 0;
  gameStarted = false;
  gameCompleted = false;
  isPreviewing = true;
  imageLoaded = false;
  nextLevelButton.hidden = true;
  updateLevelDisplay();
  updateStats();
  renderBoard();
  statusElement.textContent = 'Loading image...';
  setMessage(`Loading ${filename}...`);

  const image = new Image();
  image.onload = () => {
    if (requestId !== imageLoadRequestId) return;
    imageLoaded = true;
    statusElement.textContent = 'Previewing solution';
    setMessage(`Level ${currentLevelIndex + 1}: ${filename}. The completed picture is shown for 5 seconds.`);
    renderBoard();
    previewTimeout = window.setTimeout(() => {
      previewTimeout = null;
      isPreviewing = false;
      shuffleBoard();
    }, PREVIEW_DURATION);
  };
  image.onerror = () => {
    if (requestId !== imageLoadRequestId) return;
    statusElement.textContent = 'Image not found';
    setMessage(`Could not load images/${filename}. Make sure the file is in the images folder.`);
    renderBoard();
  };
  image.src = `images/${encodeURIComponent(filename)}`;
}

function updateLevelDisplay() {
  levelNumberElement.textContent = `${currentLevelIndex + 1} / ${PUZZLE_IMAGES.length}`;
}

function loadNextLevel() {
  if (!gameCompleted || currentLevelIndex >= PUZZLE_IMAGES.length - 1) return;
  currentLevelIndex += 1;
  loadPuzzleImage(PUZZLE_IMAGES[currentLevelIndex]);
}

function initializeGame() {
  nextLevelButton.addEventListener('click', loadNextLevel);
  resetProgressButton.addEventListener('click', resetProgress);
  discoverPuzzleImages();
}

function discoverPuzzleImages(index = 1) {
  const filename = `${index}.jpg`;
  const image = new Image();
  image.onload = () => {
    PUZZLE_IMAGES.push(filename);
    discoverPuzzleImages(index + 1);
  };
  image.onerror = () => {
    updateLevelDisplay();
    renderCompletedGallery();
    if (PUZZLE_IMAGES.length) {
      loadPuzzleImage(PUZZLE_IMAGES[0]);
      return;
    }
    statusElement.textContent = 'No images found';
    setMessage('Add at least one numbered JPG image to the images folder, for example 1.jpg.');
  };
  image.src = `images/${encodeURIComponent(filename)}`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateStats() {
  moveCountElement.textContent = String(moveCount);
  timerElement.textContent = formatTime(elapsedSeconds);
}

function setMessage(text, success = false) {
  messageElement.textContent = text;
  messageElement.classList.toggle('success', success);
}

function startTimer() {
  if (timerInterval !== null || !gameStarted) return;
  timerInterval = window.setInterval(() => {
    elapsedSeconds += 1;
    updateStats();
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetProgress() {
  if (!window.confirm('Clear all saved progress and restart from the first puzzle?')) return;

  try {
    localStorage.removeItem(COMPLETED_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear saved puzzle progress.', error);
    setMessage('Could not clear saved progress. Check your browser storage settings.');
    return;
  }

  renderCompletedGallery();
  currentLevelIndex = 0;
  gameCompleted = false;
  if (PUZZLE_IMAGES.length) loadPuzzleImage(PUZZLE_IMAGES[0]);
}

function getCompletedImages() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPLETED_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((filename) => PUZZLE_IMAGES.includes(filename)) : [];
  } catch (error) {
    console.warn('Could not read the completed puzzle list.', error);
    return [];
  }
}

function saveCompletedImage(filename) {
  if (!filename) return;
  const completed = getCompletedImages();
  if (!completed.includes(filename)) completed.push(filename);
  try {
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completed));
  } catch (error) {
    console.warn('The browser did not allow saving the completed puzzle list.', error);
    setMessage('Puzzle solved, but the browser did not allow saving your progress.');
  }
  renderCompletedGallery();
}

function openCompletedImage(filename) {
  dialogImage.src = `images/${encodeURIComponent(filename)}`;
  dialogImage.alt = `${filename} - completed puzzle`;
  dialogImageTitle.textContent = filename;
  if (typeof imageDialog.showModal === 'function') imageDialog.showModal();
  else window.open(dialogImage.src, '_blank', 'noopener');
}

function renderCompletedGallery() {
  const completed = getCompletedImages();
  completedGalleryElement.replaceChildren();
  completedEmptyElement.hidden = completed.length > 0;
  completedCountElement.textContent = `${completed.length} / ${PUZZLE_IMAGES.length}`;

  completed.forEach((filename) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'completed-item';
    item.addEventListener('click', () => openCompletedImage(filename));

    const image = document.createElement('img');
    image.src = `images/${encodeURIComponent(filename)}`;
    image.alt = `${filename} - completed picture`;
    image.loading = 'lazy';

    const caption = document.createElement('span');
    caption.textContent = filename;

    const openLabel = document.createElement('small');
    openLabel.textContent = 'Open picture ↗';

    item.append(image, caption, openLabel);
    completedGalleryElement.append(item);
  });
}

function finishGame() {
  stopTimer();
  statusElement.textContent = 'Solved!';
  setMessage(`Solved in ${moveCount} moves and ${formatTime(elapsedSeconds)}.`, true);
  saveCompletedImage(currentImageFilename);
  gameCompleted = true;
  if (currentLevelIndex < PUZZLE_IMAGES.length - 1) {
    nextLevelButton.hidden = false;
    nextLevelButton.textContent = `Next level (picture ${currentLevelIndex + 2})`;
  } else {
    setMessage(`Congratulations! You completed all ${PUZZLE_IMAGES.length} levels.`, true);
  }
  renderBoard();
  updateStats();
}

function moveTile(tileIndex) {
  if (isPreviewing || gameCompleted) return false;
  const emptyIndex = board.indexOf(0);
  if (!adjacent(tileIndex, emptyIndex)) return false;

  [board[tileIndex], board[emptyIndex]] = [board[emptyIndex], board[tileIndex]];
  moveCount += 1;
  gameStarted = true;
  startTimer();

  updateStats();
  renderBoard();

  if (isSolved()) {
    finishGame();
  } else {
    statusElement.textContent = 'In progress';
    setMessage('Looking good!');
  }
  return true;
}

function moveBlank(dx, dy) {
  if (isPreviewing) return;
  const emptyIndex = board.indexOf(0);
  const x = emptyIndex % 3;
  const y = Math.floor(emptyIndex / 3);
  const nextX = x + dx;
  const nextY = y + dy;
  if (nextX < 0 || nextX > 2 || nextY < 0 || nextY > 2) return;
  moveTile(nextY * 3 + nextX);
}

function shuffleBoard() {
  if (!imageLoaded) return;
  stopTimer();
  gameCompleted = false;
  nextLevelButton.hidden = true;
  board = [...GOAL_STATE];
  let previousEmptyIndex = -1;

  // Use legal moves so every shuffled board remains solvable.
  for (let step = 0; step < SHUFFLE_MOVES; step += 1) {
    const emptyIndex = board.indexOf(0);
    const possibleMoves = [];
    for (let index = 0; index < 9; index += 1) {
      if (adjacent(index, emptyIndex) && index !== previousEmptyIndex) {
        possibleMoves.push(index);
      }
    }
    const selectedIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    [board[emptyIndex], board[selectedIndex]] = [board[selectedIndex], board[emptyIndex]];
    previousEmptyIndex = emptyIndex;
  }

  if (isSolved()) {
    const emptyIndex = board.indexOf(0);
    const neighbor = emptyIndex === 8 ? 7 : emptyIndex + 1;
    [board[emptyIndex], board[neighbor]] = [board[neighbor], board[emptyIndex]];
  }

  moveCount = 0;
  elapsedSeconds = 0;
  gameStarted = true;
  updateStats();
  statusElement.textContent = 'In progress';
  setMessage('The puzzle is shuffled. Good luck!');
  renderBoard();
}

dialogCloseButton.addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', (event) => {
  if (event.target === imageDialog) imageDialog.close();
});

document.addEventListener('keydown', (event) => {
  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };
  const direction = directions[event.key];
  if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  moveBlank(direction[0], direction[1]);
});

renderBoard();
updateStats();
initializeGame();
