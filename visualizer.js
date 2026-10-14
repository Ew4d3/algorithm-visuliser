// classes that only last for part of an animation
const TRANSIENT_CLASSES = [
    "comparing", "compare-greater", "compare-done",
    "taken", "written", "run-left", "run-right", "dim", "pivot"
];

function setBar(bar, value) {
    bar.style.height = `${value}px`;
    bar.dataset.value = value;   // used for the value labels on small arrays
}

function markSorted(bars, end) {
    for (let i = 0; i <= end; i++) {
        bars[i].classList.remove(...TRANSIENT_CLASSES);
        bars[i].classList.add("sorted");
    }
}

export async function executeOperation(
    operation,
    array,
    arrayContainer,
    speedSlider
) {
    const bars = arrayContainer.querySelectorAll(".bar");
    const delay = Number(speedSlider.value);

    switch (operation.type) {

        case "compare": {
            const [first, second] = operation.indices;

            if (operation.gap !== undefined) {
                // Insertion sort: highlight only the bar being checked.
                const cls = operation.result === "greater"
                    ? "compare-greater"
                    : "compare-done";

                bars[first].classList.add(cls);
                await sleep(delay);
                bars[first].classList.remove(cls);
            } else {
                bars[first].classList.add("comparing");
                bars[second].classList.add("comparing");

                await sleep(delay);

                bars[first].classList.remove("comparing");
                bars[second].classList.remove("comparing");

                // Merge sort: mark the bar that was chosen as "taken".
                if (operation.take !== undefined) {
                    bars[operation.take].classList.add("taken");
                }
            }
            break;
        }

        case "swap": {
            const [first, second] = operation.indices;

            const temp = array[first];
            array[first] = array[second];
            array[second] = temp;

            setBar(bars[first], array[first]);
            setBar(bars[second], array[second]);

            await sleep(delay);
            break;
        }

        // ---------- insertion sort ----------
        case "pickUpKey": {
            const { index, value } = operation;

            arrayContainer.dataset.keyValue = value;
            bars.forEach(bar => bar.classList.remove("gap"));

            setBar(bars[index], value);
            bars[index].classList.add("gap");

            await sleep(delay);
            break;
        }

        case "shift": {
            const { from, to, value } = operation;
            const keyValue = Number(arrayContainer.dataset.keyValue);

            array[to] = value;
            setBar(bars[to], value);
            bars[to].classList.remove("gap");

            setBar(bars[from], keyValue);
            bars[from].classList.add("gap");

            await sleep(delay);
            break;
        }

        case "insertKey": {
            const { index, value } = operation;

            array[index] = value;
            setBar(bars[index], value);
            bars[index].classList.remove("gap");

            await sleep(delay);
            break;
        }

        // ---------- quick sort ----------
        case "pivot": {
            const { start, end, index } = operation;

            bars.forEach((bar, i) => {
                const inRange = i >= start && i <= end;
                bar.classList.remove("pivot");
                bar.classList.toggle("dim", !inRange && !bar.classList.contains("sorted"));
            });
            bars[index].classList.add("pivot");

            await sleep(delay);
            break;
        }

        case "place": {
            const { index, from } = operation;

            if (index !== from) {
                const temp = array[index];
                array[index] = array[from];
                array[from] = temp;

                setBar(bars[index], array[index]);
                setBar(bars[from], array[from]);
            }

            bars[from].classList.remove("pivot");
            bars[index].classList.remove("pivot", "dim");
            bars[index].classList.add("sorted");

            await sleep(delay);
            break;
        }

        // ---------- merge sort ----------
        case "mergeRange": {
            const { start, mid, end } = operation;

            bars.forEach((bar, i) => {
                bar.classList.remove("taken", "written", "run-left", "run-right");
                const inRange = i >= start && i <= end;
                bar.classList.toggle("dim", !inRange);
                if (inRange) {
                    bar.classList.add(i <= mid ? "run-left" : "run-right");
                }
            });

            await sleep(delay);
            break;
        }

        case "overwrite": {
            const { index, value } = operation;

            array[index] = value;
            setBar(bars[index], value);
            bars[index].classList.remove("taken");
            bars[index].classList.add("written");

            await sleep(delay);
            break;
        }

        // ---------- bogo sort ----------
        case "shuffle": {
            operation.values.forEach((value, i) => {
                array[i] = value;
                setBar(bars[i], value);
            });

            await sleep(delay);
            break;
        }

        case "check": {
            const { badIndex } = operation;

            if (badIndex >= 0) {
                bars[badIndex].classList.add("compare-greater");
                bars[badIndex + 1].classList.add("compare-greater");

                await sleep(delay);

                bars[badIndex].classList.remove("compare-greater");
                bars[badIndex + 1].classList.remove("compare-greater");
            } else {
                markSorted(bars, bars.length - 1);
            }
            break;
        }

        // ---------- shared ----------
        case "sorted":
            bars[operation.index].classList.add("sorted");
            break;

        case "sortedRange":
            markSorted(bars, operation.end);
            break;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}