import { bubbleSort } from "./algorithms/bubbleSort.js";
import { selectionSort } from "./algorithms/selectionSort.js";
import { insertionSort } from "./algorithms/insertionSort.js";
import { quickSort } from "./algorithms/quickSort.js";
import { mergeSort } from "./algorithms/mergeSort.js";
import { bogoSort } from "./algorithms/bogoSort.js";
import { ROT_TOTAL_SECONDS, rotMessage } from "./algorithms/rotSort.js";
import { executeOperation } from "./visualizer.js";
import { algorithmInfo, legendItems } from "./algorithmInfo.js";
import {
    renderCode,
    highlightLine,
    clearHighlight,
    lineForOperation
} from "./codeView.js";

// ---------- elements ----------
const generateButton = document.getElementById("generate-button");
const bestButton = document.getElementById("best-button");
const worstButton = document.getElementById("worst-button");
const sortButton = document.getElementById("sort-button");
const pauseButton = document.getElementById("pause-button");
const stepButton = document.getElementById("step-button");
const resetButton = document.getElementById("reset-button");
const arrayContainer = document.getElementById("array-container");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");
const comparisonsDisplay = document.getElementById("comparisons");
const swapsDisplay = document.getElementById("swaps");
const currentOperationDisplay = document.getElementById("current-operation");
const totalOperationsDisplay = document.getElementById("total-operations");
const algorithmSelect = document.getElementById("algorithm-select");
const stepMessage = document.getElementById("step-message");
const algoName = document.getElementById("algo-name");
const timeBest = document.getElementById("time-best");
const timeAvg = document.getElementById("time-avg");
const timeWorst = document.getElementById("time-worst");
const spaceValue = document.getElementById("space-value");
const legendEl = document.getElementById("legend");
const caseTag = document.getElementById("case-tag");

// ---------- algorithm settings ----------
const algorithms = {
    bubble: bubbleSort,
    selection: selectionSort,
    insertion: insertionSort,
    quick: quickSort,
    merge: mergeSort,
    bogo: bogoSort
};

// default slider value (delay in ms) for each algorithm: bigger = slower
const defaultDelay = {
    bubble: 300,
    selection: 300,
    insertion: 900,
    quick: 300,
    merge: 300,
    bogo: 100,
    rot: 300
};

// number of bars per algorithm (everything else uses DEFAULT_SIZE)
const DEFAULT_SIZE = 30;
const arraySizes = {
    bogo: 5
};

// ---------- state ----------
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

// ---------- listeners ----------
generateButton.addEventListener("click", generateArray);
bestButton.addEventListener("click", () => runCase("best"));
worstButton.addEventListener("click", () => runCase("worst"));
sortButton.addEventListener("click", startSorting);
pauseButton.addEventListener("click", togglePause);
stepButton.addEventListener("click", step);
resetButton.addEventListener("click", reset);

// changing algorithm updates the info + code, and gives a fresh array
algorithmSelect.addEventListener("change", () => {
    applyDefaultSpeed();
    showAlgorithmInfo();
    reset();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------- UI helpers ----------
function showAlgorithmInfo() {
    const key = algorithmSelect.value;
    const info = algorithmInfo[key];

    algoName.textContent = info.name;
    timeBest.textContent = info.time.best;
    timeAvg.textContent = info.time.avg;
    timeWorst.textContent = info.time.worst;
    spaceValue.textContent = info.space;

    legendEl.innerHTML = info.legend
        .map(k => `<span class="legend-item"><i class="swatch ${legendItems[k].cls}"></i>${legendItems[k].label}</span>`)
        .join("");

    renderCode(key);
}

// one place that decides which controls are usable
function setBusy(busy) {
    const hasCases = Boolean(algorithmInfo[algorithmSelect.value].cases);

    sortButton.disabled = busy;
    generateButton.disabled = busy;
    algorithmSelect.disabled = busy;
    bestButton.disabled = busy || !hasCases;
    worstButton.disabled = busy || !hasCases;
    pauseButton.disabled = !busy;
    stepButton.disabled = !busy;
}

function showCaseTag(kind, label) {
    caseTag.dataset.kind = kind;
    caseTag.textContent = `${kind === "best" ? "Best" : "Worst"} case: ${label}`;
    caseTag.hidden = false;
}

// ---------- speed slider ----------
function updateSpeedLabel() {
    const ms = Number(speedSlider.value);
    speedValue.textContent = ms >= 1000
        ? `${(ms / 1000).toFixed(1)} s`
        : `${ms} ms`;
}

speedSlider.addEventListener("input", updateSpeedLabel);

function applyDefaultSpeed() {
    speedSlider.value = defaultDelay[algorithmSelect.value] ?? 300;
    speedSlider.disabled = algorithmSelect.value === "rot";   // rot sort ignores speed
    updateSpeedLabel();
}

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

    clearHighlight();
    setBusy(false);
    generateArray();
}

// ---------- array ----------
function generateArray() {
    if (isSorting) {
        return;
    }
    const size = arraySizes[algorithmSelect.value] ?? DEFAULT_SIZE;

    array = [];
    for (let i = 0; i < size; i++) {
        const value = Math.floor(Math.random() * 300) + 20;
        array.push(value);
    }

    caseTag.hidden = true;   // back to a random array
    renderArray();
}

function renderArray() {
    arrayContainer.innerHTML = "";
    // small arrays show the value above each bar
    arrayContainer.classList.toggle("labelled", array.length <= 10);

    for (let i = 0; i < array.length; i++) {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${array[i]}px`;
        bar.dataset.value = array[i];
        arrayContainer.appendChild(bar);
    }
}

// load the best / worst case input for the chosen algorithm and sort it
function runCase(kind) {
    if (isSorting) {
        return;
    }
    const key = algorithmSelect.value;
    const cases = algorithmInfo[key].cases;
    if (!cases) {
        return;
    }

    const size = arraySizes[key] ?? DEFAULT_SIZE;
    array = cases[kind].build(size);

    renderArray();
    showCaseTag(kind, cases[kind].label);
    startSorting();
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
    clearHighlight();
    setBusy(true);

    const choice = algorithmSelect.value;

    if (choice === "rot") {
        operations = [];
        await runRotSort(myRun);
    } else {
        operations = algorithms[choice](array);
        totalOperationsDisplay.textContent = operations.length;
        currentOperationDisplay.textContent = "0";
        await runAnimation(myRun);
    }

    // if reset happened, it already cleaned up, so don't touch anything
    if (myRun !== runId) {
        return;
    }

    isSorting = false;
    isPaused = false;
    pauseButton.textContent = "Pause";
    clearHighlight();
    setBusy(false);

    stepMessage.textContent = choice === "rot"
        ? "One year later... nothing was sorted. Rot sort delivered exactly what it promised."
        : "Sorting complete!";
}

function countsAsComparison(op) {
    return op.type === "compare" || op.type === "check";
}

function countsAsWrite(op) {
    return ["swap", "shift", "overwrite", "shuffle"].includes(op.type)
        || (op.type === "place" && op.from !== op.index);
}

async function runAnimation(myRun) {
    const key = algorithmSelect.value;

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
        highlightLine(lineForOperation(key, operation));

        if (countsAsComparison(operation)) {
            comparisons++;
        }
        if (countsAsWrite(operation)) {
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

// rot sort: a real-time one-year countdown that sorts absolutely nothing
async function runRotSort(myRun) {
    totalOperationsDisplay.textContent = ROT_TOTAL_SECONDS.toLocaleString();

    let remaining = ROT_TOTAL_SECONDS;

    while (remaining > 0) {
        if (isPaused && !stepRequested) {
            await waitForResume();
        }

        if (myRun !== runId) {
            return;
        }

        stepRequested = false;

        stepMessage.textContent = rotMessage(remaining);
        highlightLine(lineForOperation("rot", { type: "tick" }));
        currentOperationDisplay.textContent =
            (ROT_TOTAL_SECONDS - remaining).toLocaleString();

        await sleep(1000);

        if (myRun !== runId) {
            return;
        }

        remaining--;
    }
}

function waitForResume() {
    return new Promise(resolve => {
        pauseResolver = resolve;
    });
}

// ---------- start up ----------
applyDefaultSpeed();
showAlgorithmInfo();
setBusy(false);
generateArray();