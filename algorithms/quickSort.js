export function quickSort(array) {
    const operations = [];
    const arr = [...array];

    function swap(a, b) {
        [arr[a], arr[b]] = [arr[b], arr[a]];
    }

    function sort(lo, hi) {
        if (lo > hi) {
            return;
        }

        if (lo === hi) {
            operations.push({
                type: "place",
                index: lo,
                from: lo,
                single: true,   // <-- add this line
                message: `Only one bar (${arr[lo]}) left here, so it's already in its final spot.`
            });
            return;
        }

        const pivot = arr[hi];

        operations.push({
            type: "pivot",
            start: lo,
            end: hi,
            index: hi,
            message: `Bars ${lo} to ${hi} are in play. Pick the last bar (${pivot}) as the pivot.`
        });

        // Everything before `boundary` is smaller than the pivot.
        let boundary = lo;

        for (let j = lo; j < hi; j++) {
            const smaller = arr[j] < pivot;

            operations.push({
                type: "compare",
                indices: [j, hi],
                message: smaller
                    ? `${arr[j]} < ${pivot}: it belongs on the left of the pivot.`
                    : `${arr[j]} >= ${pivot}: it stays on the right of the pivot.`
            });

            if (smaller) {
                if (boundary !== j) {
                    swap(boundary, j);
                    operations.push({
                        type: "swap",
                        indices: [boundary, j],
                        message: `Swap ${arr[boundary]} into the "smaller" side (position ${boundary}).`
                    });
                }
                boundary++;
            }
        }

        // Put the pivot between the smaller and larger sides.
        if (boundary !== hi) {
            swap(boundary, hi);
        }

        operations.push({
            type: "place",
            index: boundary,
            from: hi,
            message: boundary === hi
                ? `The pivot ${pivot} is already where it belongs (position ${boundary}).`
                : `Move the pivot ${pivot} between the two sides, to position ${boundary}. It's now in its final place.`
        });

        sort(lo, boundary - 1);
        sort(boundary + 1, hi);
    }

    sort(0, arr.length - 1);
    return operations;
}