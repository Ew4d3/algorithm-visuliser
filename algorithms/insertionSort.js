export function insertionSort(array) {
    const operations = [];
    const copy = [...array];

    // Initially, only the first element counts as sorted.
    operations.push({
        type: "sortedRange",
        end: 0,
        message: `Start: the first bar (${copy[0]}) is a sorted list of one.`
    });

    for (let i = 1; i < copy.length; i++) {
        const key = copy[i];

        // 1. Lift the key out of the array. Its old slot becomes the "gap".
        operations.push({
            type: "pickUpKey",
            index: i,
            value: key,
            gap: i,
            message: `Pick up ${key} (position ${i}) and hold it aside. ` +
                     `We'll slide it left until it fits.`
        });

        let j = i - 1;
        let shiftedCount = 0;

        // 2. Compare the key against the sorted section, right to left.
        while (j >= 0) {
            const isBigger = copy[j] > key;

            operations.push({
                type: "compare",
                // j = bar being checked, j + 1 = the gap where the key hovers.
                indices: [j, j + 1],
                keyIndex: j + 1,
                gap: j + 1,
                keyValue: key,
                result: isBigger ? "greater" : "done",
                message: isBigger
                    ? `${copy[j]} > ${key}, so ${copy[j]} must move right.`
                    : `${copy[j]} <= ${key}, so ${key} belongs just after it.`
            });

            if (!isBigger) {
                break;
            }

            // Shift the larger value into the gap; the gap moves left.
            copy[j + 1] = copy[j];
            shiftedCount++;

            operations.push({
                type: "shift",
                from: j,
                to: j + 1,
                value: copy[j + 1],
                gap: j,
                message: `Shift ${copy[j + 1]} right. The gap is now at position ${j}.`
            });

            j--;
        }

        // 3. Drop the key into the gap.
        copy[j + 1] = key;

        let insertMessage;
        if (shiftedCount === 0) {
            insertMessage = `${key} was already bigger than everything to its left, so it stays at position ${j + 1}.`;
        } else if (j + 1 === 0) {
            insertMessage = `${key} is the smallest so far, so it goes at the very start (position 0).`;
        } else {
            insertMessage = `Drop ${key} into position ${j + 1} after shifting ${shiftedCount} bar${shiftedCount > 1 ? "s" : ""}.`;
        }

        operations.push({
            type: "insertKey",
            index: j + 1,
            value: key,
            shifted: shiftedCount,
            message: insertMessage
        });

        // 4. The sorted section grows by one.
        operations.push({
            type: "sortedRange",
            end: i,
            message: `The first ${i + 1} bars are now sorted.`
        });
    }

    return operations;
}