const codeView = document.getElementById("code-view");

// Each sample has the lines to display and a function that says which line
// (0-based) a given animation operation corresponds to.
const samples = {
    bubble: {
        lines: [
            "function bubbleSort(arr) {",
            "  for (let i = 0; i < arr.length - 1; i++) {",
            "    for (let j = 0; j < arr.length - 1 - i; j++) {",
            "      if (arr[j] > arr[j + 1]) {",
            "        swap(arr, j, j + 1);",
            "      }",
            "    }",
            "  }",
            "  return arr;",
            "}"
        ],
        lineFor: op => ({ compare: 3, swap: 4, sorted: 1, sortedRange: 1 })[op.type]
    },

    selection: {
        lines: [
            "function selectionSort(arr) {",
            "  for (let i = 0; i < arr.length - 1; i++) {",
            "    let min = i;",
            "    for (let j = i + 1; j < arr.length; j++) {",
            "      if (arr[j] < arr[min]) {",
            "        min = j;",
            "      }",
            "    }",
            "    swap(arr, i, min);",
            "  }",
            "  return arr;",
            "}"
        ],
        lineFor: op => ({ compare: 4, swap: 8, sorted: 1, sortedRange: 1 })[op.type]
    },

    insertion: {
        lines: [
            "function insertionSort(arr) {",
            "  for (let i = 1; i < arr.length; i++) {",
            "    const key = arr[i];",
            "    let j = i - 1;",
            "    while (j >= 0 && arr[j] > key) {",
            "      arr[j + 1] = arr[j];",
            "      j--;",
            "    }",
            "    arr[j + 1] = key;",
            "  }",
            "  return arr;",
            "}"
        ],
        lineFor: op => ({ pickUpKey: 2, compare: 4, shift: 5, insertKey: 8, sortedRange: 1 })[op.type]
    },

    quick: {
        lines: [
            "function quickSort(arr, lo = 0, hi = arr.length - 1) {",
            "  if (lo >= hi) return;",
            "  const pivot = arr[hi];",
            "  let boundary = lo;",
            "  for (let j = lo; j < hi; j++) {",
            "    if (arr[j] < pivot) {",
            "      swap(arr, boundary, j);",
            "      boundary++;",
            "    }",
            "  }",
            "  swap(arr, boundary, hi);",
            "  quickSort(arr, lo, boundary - 1);",
            "  quickSort(arr, boundary + 1, hi);",
            "}"
        ],
        lineFor: op => {
            switch (op.type) {
                case "pivot":   return 2;
                case "compare": return 5;
                case "swap":    return 6;
                case "place":   return op.single ? 1 : 10;
            }
        }
    },

    merge: {
        lines: [
            "function mergeSort(arr, lo = 0, hi = arr.length - 1) {",
            "  if (lo >= hi) return;",
            "  const mid = Math.floor((lo + hi) / 2);",
            "  mergeSort(arr, lo, mid);",
            "  mergeSort(arr, mid + 1, hi);",
            "  merge(arr, lo, mid, hi);",
            "}",
            "",
            "function merge(arr, lo, mid, hi) {",
            "  const left = arr.slice(lo, mid + 1);",
            "  const right = arr.slice(mid + 1, hi + 1);",
            "  const merged = [];",
            "  while (left.length && right.length) {",
            "    if (left[0] <= right[0]) merged.push(left.shift());",
            "    else merged.push(right.shift());",
            "  }",
            "  merged.push(...left, ...right);",
            "  merged.forEach((v, k) => arr[lo + k] = v);",
            "}"
        ],
        lineFor: op => {
            switch (op.type) {
                case "mergeRange": return 5;
                case "compare":    return op.take === op.indices[0] ? 13 : 14;
                case "overwrite":  return 17;
            }
        }
    },

    bogo: {
        lines: [
            "function bogoSort(arr) {",
            "  while (!isSorted(arr)) {",
            "    shuffle(arr);",
            "  }",
            "  return arr;",
            "}"
        ],
        lineFor: op => {
            switch (op.type) {
                case "check":   return op.badIndex >= 0 ? 1 : 4;
                case "shuffle": return 2;
            }
        }
    },

    rot: {
        lines: [
            "function rotSort(arr) {",
            "  const oneYear = 365 * 24 * 60 * 60;",
            "  for (let s = oneYear; s > 0; s--) {",
            "    wait(1000);   // one second",
            "  }",
            "  return arr;   // untouched",
            "}"
        ],
        lineFor: () => 3
    }
};

// ---------- rendering ----------
let lineElements = [];
let activeLine = null;

function esc(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// very small syntax highlighter: comments, keywords, numbers
function highlightSyntax(line) {
    const pattern = /(\/\/.*$)|\b(function|let|const|for|while|if|else|return)\b|\b(\d+)\b/g;
    let out = "";
    let last = 0;
    let match;

    while ((match = pattern.exec(line))) {
        out += esc(line.slice(last, match.index));
        if (match[1]) {
            out += `<span class="tok-comment">${esc(match[1])}</span>`;
        } else if (match[2]) {
            out += `<span class="tok-kw">${esc(match[2])}</span>`;
        } else {
            out += `<span class="tok-num">${esc(match[3])}</span>`;
        }
        last = pattern.lastIndex;
    }

    return out + esc(line.slice(last));
}

export function renderCode(key) {
    renderLines(samples[key].lines);
}

export function renderLines(lines) {
    codeView.innerHTML = "";
    activeLine = null;

    lineElements = lines.map((text, i) => {
        const row = document.createElement("div");
        row.className = "code-line";
        row.innerHTML =
            `<span class="ln">${i + 1}</span>` +
            `<span class="lc">${highlightSyntax(text)}</span>`;
        codeView.appendChild(row);
        return row;
    });

    codeView.scrollTop = 0;
}

// keep the active line visible inside the code box (without scrolling the page)
function scrollToLine(row) {
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    const viewTop = codeView.scrollTop;
    const viewBottom = viewTop + codeView.clientHeight;

    if (top < viewTop + 24 || bottom > viewBottom - 24) {
        codeView.scrollTo({
            top: top - codeView.clientHeight / 2,
            behavior: "smooth"
        });
    }
}

export function highlightLine(index) {
    if (index == null || !lineElements[index]) {
        return;   // unknown operation: leave the current highlight alone
    }
    if (activeLine !== null) {
        lineElements[activeLine].classList.remove("active");
    }
    lineElements[index].classList.add("active");
    activeLine = index;
    scrollToLine(lineElements[index]);
}

export function clearHighlight() {
    if (activeLine !== null && lineElements[activeLine]) {
        lineElements[activeLine].classList.remove("active");
    }
    activeLine = null;
}

export function lineForOperation(key, operation) {
    return samples[key]?.lineFor(operation);
}