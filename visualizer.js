export async function executeOperation(
    operation,
    array,
    arrayContainer,
    speedSlider
) {
    const bars = arrayContainer.querySelectorAll(".bar");
    const delay = Number(speedSlider.value);

    if (operation.type === "compare") {
        const [first, second] = operation.indices;

        if (operation.gap !== undefined) {
            // Insertion sort: only highlight the bar being checked.
            // The key's gap is already shown by the dashed outline.
            const cls = operation.result === "greater"
                ? "compare-greater"
                : "compare-done";

            bars[first].classList.add(cls);
            await sleep(delay);
            bars[first].classList.remove(cls);
        } else {
            // Other algorithms: original behaviour
            bars[first].classList.add("comparing");
            bars[second].classList.add("comparing");

            await sleep(delay);

            bars[first].classList.remove("comparing");
            bars[second].classList.remove("comparing");
        }
    }

    else if (operation.type === "swap") {
        const [first, second] = operation.indices;

        const temp = array[first];
        array[first] = array[second];
        array[second] = temp;

        bars[first].style.height = `${array[first]}px`;
        bars[second].style.height = `${array[second]}px`;

        await sleep(delay);
    }

    else if (operation.type === "pickUpKey") {
        const { index, value } = operation;

        // Remember the key so later shifts can draw the gap at the right height.
        arrayContainer.dataset.keyValue = value;

        bars.forEach(bar => bar.classList.remove("gap"));

        // The key's slot becomes a dashed outline the same height as the key.
        bars[index].style.height = `${value}px`;
        bars[index].classList.add("gap");

        await sleep(delay);
    }

    else if (operation.type === "shift") {
        const { from, to, value } = operation;
        const keyValue = Number(arrayContainer.dataset.keyValue);

        // Move the larger value right, into the old gap.
        array[to] = value;
        bars[to].style.height = `${value}px`;
        bars[to].classList.remove("gap");

        // The gap moves left to where the value came from.
        bars[from].style.height = `${keyValue}px`;
        bars[from].classList.add("gap");

        await sleep(delay);
    }

    else if (operation.type === "insertKey") {
        const { index, value } = operation;

        // Fill the gap with the key.
        array[index] = value;
        bars[index].style.height = `${value}px`;
        bars[index].classList.remove("gap");

        await sleep(delay);
    }

    else if (operation.type === "sorted") {
        bars[operation.index].classList.add("sorted");
    }

    else if (operation.type === "sortedRange") {
        for (let i = 0; i <= operation.end; i++) {
            bars[i].classList.add("sorted");
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}