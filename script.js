import { bubbleSort } from "./algorithms/bubbleSort.js";
import { executeOperation } from "./visualizer.js";
import { selectionSort } from "./algorithms/selectionSort.js";
import { insertionSort } from "./algorithms/insertionSort.js";

// buttons + general elements
const generateButton = document.getElementById("generate-button");
const sortButton = document.getElementById("sort-button");
const arrayContainer = document.getElementById("array-container");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");
const pauseButton = document.getElementById("pause-button");
const stepButton = document.getElementById("step-button");
const resetButton = document.getElementById("reset-button");
const comparisonsDisplay = document.getElementById("comparisons");
const swapsDisplay = document.getElementById("swaps");
const currentOperationDisplay = document.getElementById("current-operation");
const totalOperationsDisplay = document.getElementById("total-operations");
const algorithmSelect = document.getElementById("algorithm-select");
const stepMessage = document.getElementById("step-message");

// state
let array = [];
let isSorting = false;
let isPaused = false;
let operations = [];
let currentOperationIndex = 0;
let stepRequested = false;
let pauseResolver = null;
let comparisons = 0;
let swaps = 0;
let runId = 0;   // identifies the current sort run so reset can cancel it

// listeners
generateButton.addEventListener("click", generateArray);
sortButton.addEventListener("click", startSorting);
pauseButton.addEventListener("click", togglePause);
stepButton.addEventListener("click", step);
resetButton.addEventListener("click", reset);

// ---------- speed slider ----------
function updateSpeedLabel() {
    const ms = Number(speedSlider.value);
    speedValue.textContent = ms >= 1000
        ? `${(ms / 1000).toFixed(1)} s`
        : `${ms} ms`;
}

speedSlider.addEventListener("input", updateSpeedLabel);

// default slider value (delay in ms) for each algorithm: bigger = slower
const defaultDelay = {
    bubble: 500,
    selection: 500,
    insertion: 2000
};

function applyDefaultSpeed() {
    speedSlider.value = defaultDelay[algorithmSelect.value] ?? 300;
    updateSpeedLabel();
}

algorithmSelect.addEventListener("change", applyDefaultSpeed);
applyDefaultSpeed();

// ---------- controls ----------
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseButton.textContent = "Resume";
    } else {
        pauseButton.textContent = "Pause";
        if (pauseResolver) {
            pauseResolver();
            pauseResolver = null;
        }
    }
}

function step() {
    if (!isPaused) {
        return;
    }
    stepRequested = true;
    if (pauseResolver) {
        pauseResolver();
        pauseResolver = null;
    }
}

function reset() {
    runId++;                 // cancels any sort that is running or paused
    isSorting = false;       // lets generateArray() run again
    isPaused = false;
    stepRequested = false;

    // release the paused loop so it can see it was cancelled and exit
    if (pauseResolver) {
        pauseResolver();
        pauseResolver = null;
    }

    currentOperationIndex = 0;
    operations = [];
    comparisons = 0;
    swaps = 0;

    comparisonsDisplay.textContent = "0";
    swapsDisplay.textContent = "0";
    currentOperationDisplay.textContent = "0";
    totalOperationsDisplay.textContent = "0";
    stepMessage.textContent = "";

    pauseButton.textContent = "Pause";
    pauseButton.disabled = true;
    stepButton.disabled = true;
    generateButton.disabled = false;
    sortButton.disabled = false;
    algorithmSelect.disabled = false;

    generateArray();
}

// ---------- array ----------
function generateArray() {
    if (isSorting) {
        return;
    }
    array = [];
    for (let i = 0; i < 30; i++) {
        const value = Math.floor(Math.random() * 300) + 20;
        array.push(value);
    }
    renderArray();
}

function renderArray() {
    arrayContainer.innerHTML = "";
    for (let i = 0; i < array.length; i++) {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${array[i]}px`;
        arrayContainer.appendChild(bar);
    }
}

// ---------- sorting ----------
async function startSorting() {
    if (isSorting) {
        return;
    }
    isSorting = true;
    isPaused = false;
    stepRequested = false;
    currentOperationIndex = 0;
    comparisons = 0;
    swaps = 0;
    const myRun = ++runId;   // this run's ID

    comparisonsDisplay.textContent = "0";
    swapsDisplay.textContent = "0";
    sortButton.disabled = true;
    algorithmSelect.disabled = true;
    generateButton.disabled = true;
    pauseButton.disabled = false;
    stepButton.disabled = false;

    // pick the algorithm
    if (algorithmSelect.value === "bubble") {
        operations = bubbleSort(array);
    } else if (algorithmSelect.value === "selection") {
        operations = selectionSort(array);
    } else if (algorithmSelect.value === "insertion") {
        operations = insertionSort(array);
    }

    totalOperationsDisplay.textContent = operations.length;
    currentOperationDisplay.textContent = "0";

    await runAnimation(myRun);

    // if reset happened, it already cleaned up, so don't touch anything
    if (myRun !== runId) {
        return;
    }

    isSorting = false;
    isPaused = false;
    pauseButton.textContent = "Pause";
    sortButton.disabled = false;
    generateButton.disabled = false;
    pauseButton.disabled = true;
    stepButton.disabled = true;
    algorithmSelect.disabled = false;
    stepMessage.textContent = "Sorting complete!";
}

async function runAnimation(myRun) {
    while (myRun === runId && currentOperationIndex < operations.length) {
        if (isPaused && !stepRequested) {
            await waitForResume();
        }

        // reset may have happened while we were paused
        if (myRun !== runId) {
            return;
        }

        stepRequested = false;

        const operation = operations[currentOperationIndex];

        stepMessage.textContent = operation.message ?? "";

        if (operation.type === "compare") {
            comparisons++;
        }
        if (operation.type === "swap" || operation.type === "shift") {
            swaps++;
        }

        await executeOperation(operation, array, arrayContainer, speedSlider);

        // reset may have happened during the animation step
        if (myRun !== runId) {
            return;
        }

        currentOperationIndex++;
        comparisonsDisplay.textContent = comparisons;
        swapsDisplay.textContent = swaps;
        currentOperationDisplay.textContent = currentOperationIndex;
    }
}

function waitForResume() {
    return new Promise(resolve => {
        pauseResolver = resolve;
    });
}

generateArray();