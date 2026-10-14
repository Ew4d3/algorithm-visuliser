export function mergeSort(array) {
    const operations = [];
    const arr = [...array];

    function sort(lo, hi) {
        if (lo >= hi) {
            return;
        }
        const mid = Math.floor((lo + hi) / 2);
        sort(lo, mid);
        sort(mid + 1, hi);
        merge(lo, mid, hi);
    }

    function merge(lo, mid, hi) {
        const left = arr.slice(lo, mid + 1);
        const right = arr.slice(mid + 1, hi + 1);

        operations.push({
            type: "mergeRange",
            start: lo,
            mid,
            end: hi,
            message: `Merge two sorted runs: bars ${lo} to ${mid} (left) and ${mid + 1} to ${hi} (right).`
        });

        // Phase 1: work out the merged order by comparing the fronts of each run.
        const merged = [];
        let i = 0;
        let j = 0;

        while (i < left.length && j < right.length) {
            const takeLeft = left[i] <= right[j];
            const posLeft = lo + i;
            const posRight = mid + 1 + j;

            operations.push({
                type: "compare",
                indices: [posLeft, posRight],
                take: takeLeft ? posLeft : posRight,
                message: takeLeft
                    ? `Left ${left[i]} vs right ${right[j]}: left is smaller or equal, so take it.`
                    : `Left ${left[i]} vs right ${right[j]}: right is smaller, so take it.`
            });

            merged.push(takeLeft ? left[i++] : right[j++]);
        }

        // One run is empty, so the rest of the other run just follows.
        while (i < left.length) merged.push(left[i++]);
        while (j < right.length) merged.push(right[j++]);

        // Phase 2: write the merged order back into the array.
        for (let k = 0; k < merged.length; k++) {
            arr[lo + k] = merged[k];
            operations.push({
                type: "overwrite",
                index: lo + k,
                value: merged[k],
                message: k === 0
                    ? `Now write the merged order back: ${merged[k]} goes to position ${lo + k}.`
                    : `Write ${merged[k]} to position ${lo + k}.`
            });
        }
    }

    sort(0, arr.length - 1);

    operations.push({
        type: "sortedRange",
        end: arr.length - 1,
        message: "All runs merged: the array is sorted."
    });

    return operations;
}