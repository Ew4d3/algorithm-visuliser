const MAX_ATTEMPTS = 5000;   // safety net so it can never run forever

function firstOutOfOrder(values) {
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i] > values[i + 1]) {
            return i;
        }
    }
    return -1;
}

function shuffled(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function bogoSort(array) {
    const operations = [];
    let arr = [...array];
    let attempt = 0;

    while (true) {
        const bad = firstOutOfOrder(arr);

        operations.push({
            type: "check",
            badIndex: bad,
            message: bad === -1
                ? (attempt === 0
                    ? "It was already sorted. Absurdly lucky."
                    : `Sorted after ${attempt} shuffles. Pure luck!`)
                : `Not sorted: ${arr[bad]} is bigger than ${arr[bad + 1]}. Shuffle everything and try again.`
        });

        if (bad === -1) {
            break;
        }

        // Astronomically unlikely, but never loop forever.
        if (attempt >= MAX_ATTEMPTS) {
            arr.sort((a, b) => a - b);
            operations.push({
                type: "shuffle",
                values: [...arr],
                message: "Bogo sort ran out of patience and cheated, just this once."
            });
            operations.push({ type: "check", badIndex: -1, message: "Sorted (with a little cheating)." });
            break;
        }

        attempt++;
        arr = shuffled(arr);

        operations.push({
            type: "shuffle",
            values: [...arr],
            message: `Shuffle #${attempt}: completely random order, fingers crossed.`
        });
    }

    return operations;
}