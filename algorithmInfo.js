// ---------- helpers for building best / worst case inputs ----------

// n distinct values, ascending, between 30 and 320
function ascending(n) {
    if (n === 1) {
        return [175];
    }
    return Array.from({ length: n }, (_, i) => 30 + Math.round((i * 290) / (n - 1)));
}

function descending(n) {
    return ascending(n).reverse();
}

// Quick sort (last-element pivot) best case: every pivot is the median.
// The partition step rotates the first element of the right half to the end,
// so the right half is pre-rotated the other way to cancel that out.
function quickBestCase(values) {
    if (values.length <= 1) {
        return [...values];
    }
    const mid = Math.floor((values.length - 1) / 2);
    const lower = quickBestCase(values.slice(0, mid));
    const upper = quickBestCase(values.slice(mid + 1));
    const rotated = upper.length > 1
        ? [upper[upper.length - 1], ...upper.slice(0, -1)]
        : upper;
    return [...lower, ...rotated, values[mid]];
}

// Merge sort worst case: split into even/odd positions so that every merge
// has to alternate between the left and right run.
function mergeWorstCase(values) {
    if (values.length <= 1) {
        return [...values];
    }
    const left = values.filter((_, i) => i % 2 === 0);
    const right = values.filter((_, i) => i % 2 === 1);
    return [...mergeWorstCase(left), ...mergeWorstCase(right)];
}

// ---------- legend entries (swatch classes live in style.css) ----------
export const legendItems = {
    unsorted:  { label: "Unsorted",              cls: "swatch-default" },
    sorted:    { label: "Sorted",                cls: "swatch-sorted" },
    comparing: { label: "Comparing",             cls: "swatch-comparing" },
    greater:   { label: "Bigger than key",       cls: "swatch-greater" },
    done:      { label: "Key's spot found",      cls: "swatch-done" },
    gap:       { label: "Gap",                   cls: "swatch-gap" },
    pivot:     { label: "Pivot",                 cls: "swatch-pivot" },
    outside:   { label: "Outside current range", cls: "swatch-dim" },
    left:      { label: "Left run",              cls: "swatch-left" },
    right:     { label: "Right run",             cls: "swatch-right" },
    written:   { label: "Just written",          cls: "swatch-written" },
    taken:     { label: "Already merged",        cls: "swatch-taken" },
    wrong:     { label: "Out-of-order pair",     cls: "swatch-greater" }
};

// ---------- per-algorithm info ----------
export const algorithmInfo = {
    bubble: {
        name: "Bubble Sort",
        time: { best: "O(n)", avg: "O(n²)", worst: "O(n²)" },
        space: "O(1)",
        legend: ["unsorted", "comparing", "sorted"],
        cases: {
            best:  { label: "already sorted, so no swaps are needed", build: ascending },
            worst: { label: "reverse sorted, so every pair needs swapping", build: descending }
        }
    },

    selection: {
        name: "Selection Sort",
        time: { best: "O(n²)", avg: "O(n²)", worst: "O(n²)" },
        space: "O(1)",
        legend: ["unsorted", "comparing", "sorted"],
        cases: {
            best:  { label: "already sorted, so no swaps (it still makes every comparison)", build: ascending },
            worst: { label: "reverse sorted, so lots of swaps (same comparisons as always)", build: descending }
        }
    },

    insertion: {
        name: "Insertion Sort",
        time: { best: "O(n)", avg: "O(n²)", worst: "O(n²)" },
        space: "O(1)",
        legend: ["unsorted", "sorted", "greater", "done", "gap"],
        cases: {
            best:  { label: "already sorted, so every key stays where it is", build: ascending },
            worst: { label: "reverse sorted, so every key travels all the way to the front", build: descending }
        }
    },

    quick: {
        name: "Quick Sort",
        time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)" },
        space: "O(log n)",
        legend: ["unsorted", "pivot", "comparing", "outside", "sorted"],
        cases: {
            best:  { label: "every pivot is the median, so the partitions are perfectly balanced", build: n => quickBestCase(ascending(n)) },
            worst: { label: "already sorted, so the pivot is always the largest and one side is empty", build: ascending }
        }
    },

    merge: {
        name: "Merge Sort",
        time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)" },
        space: "O(n)",
        legend: ["unsorted", "left", "right", "comparing", "taken", "written", "sorted"],
        cases: {
            best:  { label: "already sorted, so the left run empties first (fewest comparisons)", build: ascending },
            worst: { label: "interleaved, so every merge compares right up to the last element", build: n => mergeWorstCase(ascending(n)) }
        }
    },

    bogo: {
        name: "Bogo Sort",
        time: { best: "O(n)", avg: "O(n·n!)", worst: "O(∞)" },
        space: "O(1)",
        legend: ["unsorted", "wrong", "sorted"],
        cases: {
            best:  { label: "already sorted, so one check and done", build: ascending },
            worst: { label: "reverse sorted, but the worst case has no upper bound at all", build: descending }
        }
    },

    rot: {
        name: "Rot Sort",
        time: { best: "O(∞)", avg: "O(∞)", worst: "O(∞)" },
        space: "O(1)",
        legend: ["unsorted"],
        cases: null   // a year either way, so no case buttons
    }
};