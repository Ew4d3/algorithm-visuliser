export async function executeOperation(
    operation,
    array,
    arrayContainer,
    speedSlider
) {
    const bars =
        arrayContainer.querySelectorAll(".bar");

    if (operation.type === "compare") {

        const [first, second] =
            operation.indices;

        bars[first]
            .classList.add("comparing");

        bars[second]
            .classList.add("comparing");

        await sleep(
            Number(speedSlider.value)
        );

        bars[first]
            .classList.remove("comparing");

        bars[second]
            .classList.remove("comparing");
    }

    if (operation.type === "swap") {

        const [first, second] =
            operation.indices;

        const temp = array[first];

        array[first] =
            array[second];

        array[second] =
            temp;

        bars[first].style.height =
            `${array[first]}px`;

        bars[second].style.height =
            `${array[second]}px`;

        await sleep(
            Number(speedSlider.value)
        );
    }

    if (operation.type === "shift") {

        const { from, to } = operation;

        array[to] = array[from];

        bars[to].style.height =
            `${array[to]}px`;

        bars[from].style.height =
            "0px";

        await sleep(
            Number(speedSlider.value)
        );
    }

    if (operation.type === "insert") {

        const { index, value } = operation;

        array[index] = value;

        bars[index].style.height =
            `${value}px`;

        await sleep(
            Number(speedSlider.value)
        );
    }

    if (operation.type === "sorted") {

        bars[operation.index]
            .classList.add("sorted");
    }

    if (operation.type === "sortedRange") {

        for (
            let i = 0;
            i <= operation.end;
            i++
        ) {
            bars[i]
                .classList.add("sorted");
        }
    }
}

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}