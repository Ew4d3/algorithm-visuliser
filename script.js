import { bubbleSort }   // This is a single-line comment
    from "./algorithms/bubbleSort.js";

import { executeOperation }
    from "./visualizer.js";

import { selectionSort }
    from "./algorithms/selectionSort.js";

import { insertionSort }
    from "./algorithms/insertionSort.js";

//buttons + general elements
const generateButton = document.getElementById("generate-button");
const sortButton = document.getElementById("sort-button");
const arrayContainer = document.getElementById("array-container");
const speedSlider = document.getElementById("speed");
const pauseButton = document.getElementById("pause-button");
const stepButton = document.getElementById("step-button");
const resetButton = document.getElementById("reset-button");
const comparisonsDisplay = document.getElementById("comparisons");
const swapsDisplay = document.getElementById("swaps");
const currentOperationDisplay = document.getElementById("current-operation");
const totalOperationsDisplay = document.getElementById("total-operations");
const algorithmSelect = document.getElementById("algorithm-select");



//set var values eg sorting = disabling buttons
let array = [];
let isSorting = false;
let isPaused = false;
let operations = [];
let currentOperationIndex = 0;
let stepRequested = false;
let pauseResolver = null;
let comparisons = 0;
let swaps = 0;


generateButton.addEventListener(  //listeners for presses - on press call func
    "click",
    generateArray
);

sortButton.addEventListener(
    "click",
    startSorting
);

pauseButton.addEventListener(
    "click",
    togglePause
);

stepButton.addEventListener(
    "click",
    step
);

resetButton.addEventListener(
    "click",
    reset

);

function togglePause() {  //pause alg 
  
    isPaused = !isPaused;
    if (isPaused) {
        pauseButton.textContent = "Resume";
    } 
    else {
        pauseButton.textContent = "Pause";
        if (pauseResolver) {
            pauseResolver();
            pauseResolver = null;

        }
    }


}


function step() {  //step 1  by one

    if (!isPaused) {
        return;
    }
    stepRequested = true;
    if (pauseResolver) {
        pauseResolver();
        pauseResolver = null;


    }
}


function reset() {  //resets alg progress + generates new arr
    isPaused = false;
    stepRequested = false;
    currentOperationIndex = 0;
    operations = [];
    pauseButton.textContent = "Pause";
    pauseButton.disabled = true;
    stepButton.disabled = true;
    generateButton.disabled = false;
    sortButton.disabled = false;
    generateArray();


}

function generateArray() {  //generates arr of random values and displays as bars to be sorted
    if (isSorting) {
        return;

    }
    array = [];
    for (let i = 0; i < 30; i++) {
        const value =
            Math.floor(Math.random() * 300) + 20;
        array.push(value);

    }

    renderArray();


}

 
function renderArray() {  //essentially draws array out as bars 
    arrayContainer.innerHTML = "";
    for (let i = 0; i < array.length; i++) {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${array[i]}px`;
        arrayContainer.appendChild(bar);


    }
}


async function startSorting() {  //sort
    if (isSorting) {
        return;

    }
    isSorting = true;
    isPaused = false;
    stepRequested = false;
    currentOperationIndex = 0;
    comparisons = 0;
    swaps = 0;
    comparisonsDisplay.textContent = "0";
    swapsDisplay.textContent = "0";
    sortButton.disabled = true;
    algorithmSelect.disabled = true;
    generateButton.disabled = true;
    pauseButton.disabled = false;

    stepButton.disabled = false;


    if (algorithmSelect.value === "bubble") {
        operations = bubbleSort(array);
    } else if (algorithmSelect.value === "selection") {
        operations = selectionSort(array);
    } else if (algorithmSelect.value === "insertion") {
        operations = insertionSort(array);
    }


{
    operations = selectionSort(array);
}
    totalOperationsDisplay.textContent = operations.length;
    currentOperationDisplay.textContent = "0";
    await runAnimation();
    isSorting = false;
    isPaused = false;
    pauseButton.textContent = "Pause";
    sortButton.disabled = false;
    generateButton.disabled = false;
    pauseButton.disabled = true;
    stepButton.disabled = true;
    algorithmSelect.disabled = false;

    
}

async function runAnimation() {  //animations
    while (
        currentOperationIndex < operations.length

    ) 
    {
        if (isPaused && !stepRequested
        ) 
        {
            await waitForResume();

        }
        stepRequested = false;
        const operation = operations[currentOperationIndex];
    
    if (operation.type === "compare") {
        comparisons++;

    }
    
    if (operation.type === "swap") {
        swaps++;

    }
    
    await executeOperation(
        operation,
        array,
        arrayContainer,
        speedSlider

    );
    
    currentOperationIndex++;
    comparisonsDisplay.textContent = comparisons;
    swapsDisplay.textContent = swaps;
    currentOperationDisplay.textContent = currentOperationIndex;


    }



}

function waitForResume() {  
    return new Promise(resolve => {  //promise= something that will happen in future
        pauseResolver = resolve;



    }

);


}



generateArray();  //calls genfunc to create new arr





