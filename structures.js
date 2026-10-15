// ===================================================================
// shared helpers
// ===================================================================
const $ = id => document.getElementById(id);

const stage = $("stage");
const info = $("info");
const msg = $("step-message");
const opsBar = $("ops");
const picker = $("structure-select");
const speed = $("speed");
const speedValue = $("speed-value");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const wait = (factor = 1) => sleep(Number(speed.value) * factor);
const say = text => { msg.textContent = text; };
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const hl = (map, key) => (map[key] ? " " + map[key] : "");

const esc = text => String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// read a whole number 0-99 from an input, or explain what's wrong
function num(raw, name = "a value") {
    const text = String(raw ?? "").trim();
    if (!/^\d{1,2}$/.test(text)) {
        say(`Enter a whole number from 0 to 99 for ${name}.`);
        return null;
    }
    return Number(text);
}

function distinct(count, lo = 1, hi = 99) {
    const set = new Set();
    while (set.size < count) {
        set.add(rand(lo, hi));
    }
    return [...set];
}

// draws a tree (BST or heap) as SVG. `extra` is HTML shown underneath.
function drawTree(nodes, edges, w, h, extra = "") {
    if (!nodes.length) {
        stage.innerHTML = `<div class="empty-note">Empty. Add something to begin.</div>`;
        return;
    }

    const at = Object.fromEntries(nodes.map(n => [n.id, n]));

    const lines = edges.map(([a, b]) =>
        `<line class="edge" x1="${at[a].x}" y1="${at[a].y}" x2="${at[b].x}" y2="${at[b].y}"/>`
    ).join("");

    const circles = nodes.map(n =>
        `<g class="vnode${n.cls || ""}">` +
        `<circle cx="${n.x}" cy="${n.y}" r="20"/>` +
        `<text x="${n.x}" y="${n.y}" dy="0.35em">${n.label}</text></g>`
    ).join("");

    stage.innerHTML =
        `<div class="svg-wrap"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `${lines}${circles}</svg>${extra}</div>`;
}

const structures = {};

// ===================================================================
// STACK
// ===================================================================
structures.stack = (() => {
    const CAP = 8;
    let items = [];

    function show(h = {}) {
        const cells = items
            .map((v, i) => `<div class="cell${i === items.length - 1 ? " top" : ""}${hl(h, i)}">${v}</div>`)
            .join("");

        stage.innerHTML =
            `<div class="v-stack">${cells}` +
            `${items.length ? "" : '<div class="empty-note">empty</div>'}</div>`;
        info.textContent = `Size: ${items.length} / ${CAP}`;
    }

    return {
        name: "Stack",
        blurb: "Last in, first out (LIFO). You can only add to or remove from the top, like a pile of plates.",
        hint: "Type a number and press Push.",
        complexity: [["Push", "O(1)"], ["Pop", "O(1)"], ["Peek", "O(1)"], ["Search", "O(n)"]],
        space: "O(n)",
        inputs: [{ id: "value", placeholder: "Value (0-99)" }],
        buttons: [
            {
                label: "Push",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (items.length >= CAP) {
                        show({ [items.length - 1]: "miss" });
                        say(`Stack overflow: it's full (${CAP} items). Pop something first.`);
                        return;
                    }
                    items.push(n);
                    show({ [items.length - 1]: "new" });
                    say(`Push ${n}: place it on top of the stack. O(1)`);
                }
            },
            {
                label: "Pop",
                run: async () => {
                    if (!items.length) {
                        say("Stack underflow: there is nothing to pop.");
                        return;
                    }
                    const top = items.length - 1;
                    const value = items[top];
                    show({ [top]: "visit" });
                    say(`Pop: take the top item (${value}) off the stack. O(1)`);
                    await wait();
                    show({ [top]: "out" });
                    await wait(0.6);
                    items.pop();
                    show();
                    say(`Popped ${value}. ${items.length
                        ? `The new top is ${items[items.length - 1]}.`
                        : "The stack is empty now."}`);
                }
            },
            {
                label: "Peek",
                run: async () => {
                    if (!items.length) {
                        say("The stack is empty, so there is no top item.");
                        return;
                    }
                    show({ [items.length - 1]: "found" });
                    say(`Peek: the top item is ${items[items.length - 1]}. Looking doesn't remove it. O(1)`);
                }
            },
            {
                label: "Search",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    for (let i = items.length - 1; i >= 0; i--) {
                        show({ [i]: "visit" });
                        say(`Looking for ${n}: is ${items[i]} the one? ${items[i] === n ? "Yes!" : "No, go one deeper."}`);
                        await wait();
                        if (items[i] === n) {
                            show({ [i]: "found" });
                            say(`Found ${n}, ${items.length - 1 - i} item(s) down from the top.`);
                            return;
                        }
                    }
                    show();
                    say(`${n} isn't in the stack. Searching means checking from the top down: O(n).`);
                }
            }
        ],
        fill() {
            items = distinct(5);
            show();
            say("Filled with 5 random items.");
        },
        clear() {
            items = [];
            show();
            say("Stack cleared.");
        },
        show
    };
})();

// ===================================================================
// QUEUE
// ===================================================================
structures.queue = (() => {
    const CAP = 8;
    let items = [];

    function show(h = {}) {
        const cells = items.map((v, i) => {
            const tags =
                (i === 0 ? '<span class="tag up">FRONT</span>' : "") +
                (i === items.length - 1 ? '<span class="tag down">REAR</span>' : "");
            return `<div class="cell${hl(h, i)}">${tags}${v}</div>`;
        }).join("");

        stage.innerHTML =
            `<div class="q-row"><span class="q-end">OUT ←</span>` +
            `${cells || '<div class="empty-note">empty</div>'}` +
            `<span class="q-end">← IN</span></div>`;
        info.textContent = `Size: ${items.length} / ${CAP}`;
    }

    return {
        name: "Queue",
        blurb: "First in, first out (FIFO). New items join at the rear and leave from the front, like a line at a shop.",
        hint: "Type a number and press Enqueue.",
        complexity: [["Enqueue", "O(1)"], ["Dequeue", "O(1)"], ["Peek", "O(1)"], ["Search", "O(n)"]],
        space: "O(n)",
        inputs: [{ id: "value", placeholder: "Value (0-99)" }],
        buttons: [
            {
                label: "Enqueue",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (items.length >= CAP) {
                        show({ [items.length - 1]: "miss" });
                        say(`The queue is full (${CAP} items). Dequeue something first.`);
                        return;
                    }
                    items.push(n);
                    show({ [items.length - 1]: "new" });
                    say(`Enqueue ${n}: it joins the back of the line (the rear). O(1)`);
                }
            },
            {
                label: "Dequeue",
                run: async () => {
                    if (!items.length) {
                        say("The queue is empty: there is nothing to dequeue.");
                        return;
                    }
                    const value = items[0];
                    show({ 0: "visit" });
                    say(`Dequeue: the front item (${value}) leaves first, because it has waited longest. O(1)`);
                    await wait();
                    show({ 0: "out" });
                    await wait(0.6);
                    items.shift();
                    show();
                    say(`Dequeued ${value}. ${items.length
                        ? `${items[0]} is the new front.`
                        : "The queue is empty now."}`);
                }
            },
            {
                label: "Peek",
                run: async () => {
                    if (!items.length) {
                        say("The queue is empty, so there is no front item.");
                        return;
                    }
                    show({ 0: "found" });
                    say(`Peek: the front item is ${items[0]}. It stays in the queue. O(1)`);
                }
            },
            {
                label: "Search",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    for (let i = 0; i < items.length; i++) {
                        show({ [i]: "visit" });
                        say(`Looking for ${n}: is ${items[i]} the one? ${items[i] === n ? "Yes!" : "No, check the next one."}`);
                        await wait();
                        if (items[i] === n) {
                            show({ [i]: "found" });
                            say(`Found ${n}, with ${i} item(s) ahead of it in the queue.`);
                            return;
                        }
                    }
                    show();
                    say(`${n} isn't in the queue. Searching is O(n).`);
                }
            }
        ],
        fill() {
            items = distinct(5);
            show();
            say("Filled with 5 random items.");
        },
        clear() {
            items = [];
            show();
            say("Queue cleared.");
        },
        show
    };
})();

// ===================================================================
// ARRAY
// ===================================================================
structures.array = (() => {
    const CAP = 12;
    let arr = [];

    function show(h = {}) {
        const cells = Array.from({ length: CAP }, (_, i) => {
            const v = arr[i];
            const filled = v !== undefined && v !== null;
            return `<div class="arr-cell"><div class="cell${filled ? "" : " empty"}${hl(h, i)}">${filled ? v : ""}</div>` +
                   `<span class="idx">${i}</span></div>`;
        }).join("");

        stage.innerHTML = `<div class="arr-row">${cells}</div>`;
        info.textContent = `Length: ${arr.length} / ${CAP} slots (an array has a fixed capacity)`;
    }

    // validates an index input; returns null (after explaining) if it's no good
    function indexOf(raw, max) {
        const i = num(raw, "the index");
        if (i === null) return null;
        if (i > max) {
            say(`Index ${i} is out of range. Valid indexes right now are 0 to ${max}.`);
            return null;
        }
        return i;
    }

    return {
        name: "Array",
        blurb: "Values stored side by side in memory. Jumping to any index is instant, but inserting or deleting in the middle means shifting everything after it.",
        hint: "Try Insert with an index and a value. Leave the index empty to append.",
        complexity: [["Access", "O(1)"], ["Search", "O(n)"], ["Insert", "O(n)"], ["Delete", "O(n)"]],
        space: "O(n)",
        inputs: [
            { id: "index", placeholder: "Index" },
            { id: "value", placeholder: "Value (0-99)" }
        ],
        buttons: [
            {
                label: "Insert",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (arr.length >= CAP) {
                        say(`The array is full (${CAP} slots). Real arrays have to be resized, which means copying everything.`);
                        return;
                    }

                    const len = arr.length;
                    let at = len;
                    if (v.index.trim() !== "") {
                        at = num(v.index, "the index");
                        if (at === null) return;
                        if (at > len) {
                            say(`Index ${at} is too far. You can insert at 0 to ${len}.`);
                            return;
                        }
                    }

                    if (at < len) {
                        say(`Insert ${n} at index ${at}: everything from index ${at} onward has to shift right first. O(n)`);
                        arr.push(null);   // make room at the end
                        show();
                        await wait();
                        for (let k = len; k > at; k--) {
                            arr[k] = arr[k - 1];
                            show({ [k]: "swap", [k - 1]: "visit" });
                            say(`Shift ${arr[k]} from index ${k - 1} to index ${k}.`);
                            await wait();
                        }
                    }

                    arr[at] = n;
                    show({ [at]: "new" });
                    say(at === len
                        ? `Appended ${n} at the end. No shifting needed, so this is O(1).`
                        : `The gap is open, so ${n} goes into index ${at}.`);
                }
            },
            {
                label: "Delete",
                run: async v => {
                    if (!arr.length) { say("The array is empty."); return; }
                    const i = indexOf(v.index, arr.length - 1);
                    if (i === null) return;

                    const removed = arr[i];
                    show({ [i]: "miss" });
                    say(`Delete ${removed} at index ${i}, then close the gap by shifting everything after it left. O(n)`);
                    await wait();

                    for (let k = i; k < arr.length - 1; k++) {
                        arr[k] = arr[k + 1];
                        show({ [k]: "swap", [k + 1]: "visit" });
                        say(`Shift ${arr[k]} from index ${k + 1} to index ${k}.`);
                        await wait();
                    }

                    arr.pop();
                    show();
                    say(`Deleted ${removed}. The array is now ${arr.length} long.`);
                }
            },
            {
                label: "Access",
                run: async v => {
                    if (!arr.length) { say("The array is empty."); return; }
                    const i = indexOf(v.index, arr.length - 1);
                    if (i === null) return;
                    show({ [i]: "found" });
                    say(`arr[${i}] = ${arr[i]}. The computer jumps straight to the slot using its address, so it takes one step however long the array is. O(1)`);
                }
            },
            {
                label: "Update",
                run: async v => {
                    if (!arr.length) { say("The array is empty."); return; }
                    const i = indexOf(v.index, arr.length - 1);
                    if (i === null) return;
                    const n = num(v.value);
                    if (n === null) return;
                    const old = arr[i];
                    arr[i] = n;
                    show({ [i]: "new" });
                    say(`Overwrote arr[${i}]: ${old} → ${n}. One step, O(1).`);
                }
            },
            {
                label: "Search",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    for (let i = 0; i < arr.length; i++) {
                        show({ [i]: "visit" });
                        say(`Looking for ${n}: is arr[${i}] = ${arr[i]} the one? ${arr[i] === n ? "Yes!" : "No, next."}`);
                        await wait();
                        if (arr[i] === n) {
                            show({ [i]: "found" });
                            say(`Found ${n} at index ${i} after ${i + 1} check(s).`);
                            return;
                        }
                    }
                    show();
                    say(`${n} isn't in the array. Without any order to rely on, every element had to be checked: O(n).`);
                }
            }
        ],
        fill() {
            arr = distinct(8);
            show();
            say("Filled with 8 random values.");
        },
        clear() {
            arr = [];
            show();
            say("Array cleared.");
        },
        show
    };
})();

// ===================================================================
// LINKED LIST
// ===================================================================
structures.linkedlist = (() => {
    const MAX = 9;
    let list = [];

    function show(h = {}) {
        const nodes = list.map((v, i) =>
            `<div class="ll-node${hl(h, i)}">` +
            `${i === 0 ? '<span class="tag up">HEAD</span>' : ""}` +
            `${i === list.length - 1 ? '<span class="tag down">TAIL</span>' : ""}` +
            `<span class="ll-val">${v}</span><span class="ll-ptr"></span></div>` +
            `<span class="ll-arrow">→</span>`
        ).join("");

        stage.innerHTML = `<div class="ll-row">${list.length
            ? nodes + '<span class="ll-null">NULL</span>'
            : '<span class="ll-null">HEAD → NULL (the list is empty)</span>'}</div>`;
        info.textContent = `Length: ${list.length} / ${MAX}. Each node holds a value and a pointer to the next node.`;
    }

    // visit nodes 0..last one at a time; returns the highlight map
    async function walkTo(last, describe) {
        const h = {};
        for (let i = 0; i <= last; i++) {
            h[i] = "visit";
            show(h);
            say(describe(i));
            await wait();
            h[i] = "done";
        }
        return h;
    }

    return {
        name: "Linked List",
        blurb: "Nodes scattered in memory, each pointing to the next. Adding at the front is instant, but to reach any other node you have to follow the pointers from the head.",
        hint: "Type a number and press Insert Head.",
        complexity: [["Access", "O(n)"], ["Search", "O(n)"], ["Insert head", "O(1)"], ["Delete head", "O(1)"]],
        space: "O(n)",
        inputs: [
            { id: "value", placeholder: "Value (0-99)" },
            { id: "index", placeholder: "Index" }
        ],
        buttons: [
            {
                label: "Insert Head",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (list.length >= MAX) { say(`The demo list is full (${MAX} nodes).`); return; }
                    list.unshift(n);
                    show({ 0: "new" });
                    say(`Insert ${n} at the head: point the new node at the old head, then make it the head. Nothing else moves. O(1)`);
                }
            },
            {
                label: "Insert Tail",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (list.length >= MAX) { say(`The demo list is full (${MAX} nodes).`); return; }
                    if (list.length) {
                        const h = await walkTo(list.length - 1, i => `Following pointers to find the end: now at node ${i}.`);
                        list.push(n);
                        show({ ...h, [list.length - 1]: "new" });
                        say(`Reached the last node, so link the new node (${n}) after it. Without a tail pointer, walking there makes this O(n).`);
                    } else {
                        list.push(n);
                        show({ 0: "new" });
                        say(`The list was empty, so ${n} becomes the head.`);
                    }
                }
            },
            {
                label: "Insert At",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    const at = num(v.index, "the index");
                    if (at === null) return;
                    if (list.length >= MAX) { say(`The demo list is full (${MAX} nodes).`); return; }
                    if (at > list.length) { say(`Index ${at} is too far. You can insert at 0 to ${list.length}.`); return; }

                    if (at === 0) {
                        list.unshift(n);
                        show({ 0: "new" });
                        say(`Index 0 is the head, so this is the O(1) head insert.`);
                        return;
                    }

                    const h = await walkTo(at - 1, i => `Walking to the node before index ${at}: now at node ${i}.`);
                    list.splice(at, 0, n);
                    show({ ...h, [at]: "new" });
                    say(`Point the new node at what came next, then point node ${at - 1} at the new node.`);
                }
            },
            {
                label: "Delete Head",
                run: async () => {
                    if (!list.length) { say("The list is empty."); return; }
                    const value = list[0];
                    show({ 0: "miss" });
                    say(`Delete the head (${value}): move HEAD to the next node. O(1)`);
                    await wait();
                    list.shift();
                    show();
                    say(`Deleted ${value}. ${list.length ? `${list[0]} is the new head.` : "The list is empty now."}`);
                }
            },
            {
                label: "Delete Value",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    const h = {};
                    for (let i = 0; i < list.length; i++) {
                        h[i] = "visit";
                        show(h);
                        say(`Looking for ${n}: node ${i} holds ${list[i]}. ${list[i] === n ? "Found it." : "Not it, follow the pointer."}`);
                        await wait();
                        if (list[i] === n) {
                            h[i] = "miss";
                            show(h);
                            say(i === 0
                                ? `It's the head, so move HEAD to the next node.`
                                : `Point node ${i - 1} at node ${i + 1}, skipping over ${n}.`);
                            await wait();
                            list.splice(i, 1);
                            show();
                            say(`Deleted ${n}.`);
                            return;
                        }
                        h[i] = "done";
                    }
                    show();
                    say(`${n} isn't in the list. We had to walk all of it: O(n).`);
                }
            },
            {
                label: "Search",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    const h = {};
                    for (let i = 0; i < list.length; i++) {
                        h[i] = "visit";
                        show(h);
                        say(`Looking for ${n}: node ${i} holds ${list[i]}. ${list[i] === n ? "Yes!" : "No, follow the pointer."}`);
                        await wait();
                        if (list[i] === n) {
                            h[i] = "found";
                            show(h);
                            say(`Found ${n} at position ${i}.`);
                            return;
                        }
                        h[i] = "done";
                    }
                    show(h);
                    say(`${n} isn't in the list. O(n).`);
                }
            },
            {
                label: "Reverse",
                run: async () => {
                    if (list.length < 2) { say("A list with fewer than two nodes is already reversed."); return; }
                    const h = {};
                    for (let i = 0; i < list.length; i++) {
                        h[i] = "visit";
                        show(h);
                        say(`Flip node ${i}'s pointer so it points backwards, to the node before it.`);
                        await wait();
                        h[i] = "done";
                    }
                    list.reverse();
                    show(Object.fromEntries(list.map((_, i) => [i, "done"])));
                    say("Reversed: the old tail is now the head. One pass, O(n) time and O(1) extra space.");
                }
            }
        ],
        fill() {
            list = distinct(5);
            show();
            say("Filled with 5 random nodes.");
        },
        clear() {
            list = [];
            show();
            say("List cleared.");
        },
        show
    };
})();

// ===================================================================
// HASH MAP (separate chaining)
// ===================================================================
structures.hashmap = (() => {
    const BUCKETS = 7;
    const MAX = 14;
    let table = Array.from({ length: BUCKETS }, () => []);

    const size = () => table.reduce((sum, chain) => sum + chain.length, 0);
    const codes = key => [...key].map(c => c.charCodeAt(0));
    const hashOf = key => codes(key).reduce((a, b) => a + b, 0) % BUCKETS;
    const hashText = key => `(${codes(key).join(" + ")}) mod ${BUCKETS}`;

    function show(h = {}) {
        const rows = table.map((chain, b) => {
            const entries = chain.map((e, j) =>
                `<div class="ll-node kv${hl(h, `${b}.${j}`)}">` +
                `<span class="ll-val">${esc(e.k)}</span><span class="kv-sep">:</span>` +
                `<span class="ll-val">${esc(e.v)}</span></div>` +
                `${j < chain.length - 1 ? '<span class="ll-arrow">→</span>' : ""}`
            ).join("");

            return `<div class="bucket${hl(h, b)}"><span class="b-idx">${b}</span>` +
                   `<div class="b-chain">${entries || '<span class="b-empty">empty</span>'}</div></div>`;
        }).join("");

        stage.innerHTML = `<div class="buckets">${rows}</div>`;
        const n = size();
        info.textContent = `Entries: ${n} · Buckets: ${BUCKETS} · Load factor: ${(n / BUCKETS).toFixed(2)}`;
    }

    function keyFrom(raw) {
        const k = raw.trim();
        if (!k) {
            say("Enter a key first (up to 8 characters).");
            return null;
        }
        return k;
    }

    // adds without animation (used by Fill random)
    function quickPut(k, v) {
        const chain = table[hashOf(k)];
        const hit = chain.find(e => e.k === k);
        if (hit) hit.v = v; else chain.push({ k, v });
    }

    return {
        name: "Hash Map",
        blurb: "Turns each key into a bucket number with a hash function, so lookups jump straight to the right bucket. When two keys land in the same bucket (a collision) they form a chain.",
        hint: "Enter a key and a value, then press Put. Try keys like cat, dog and bird to see a collision.",
        complexity: [["Put", "O(1) avg"], ["Get", "O(1) avg"], ["Remove", "O(1) avg"], ["Worst", "O(n)"]],
        space: "O(n)",
        inputs: [
            { id: "key", placeholder: "Key", maxLength: 8 },
            { id: "value", placeholder: "Value", maxLength: 6 }
        ],
        buttons: [
            {
                label: "Put",
                run: async v => {
                    const k = keyFrom(v.key);
                    if (k === null) return;
                    const val = v.value.trim();
                    if (!val) { say("Enter a value to store."); return; }

                    const b = hashOf(k);
                    say(`hash("${k}") = ${hashText(k)} = ${b}. So it belongs in bucket ${b}.`);
                    show({ [b]: "visit" });
                    await wait();

                    const chain = table[b];
                    for (let j = 0; j < chain.length; j++) {
                        show({ [b]: "visit", [`${b}.${j}`]: "visit" });
                        say(`Bucket ${b} already holds "${chain[j].k}". ${chain[j].k === k
                            ? "Same key!"
                            : "Different key: a collision, so keep walking the chain."}`);
                        await wait();
                        if (chain[j].k === k) {
                            chain[j].v = val;
                            show({ [`${b}.${j}`]: "found" });
                            say(`"${k}" already existed, so its value is updated to ${val}.`);
                            return;
                        }
                    }

                    if (size() >= MAX) {
                        show();
                        say(`The demo table is full (${MAX} entries).`);
                        return;
                    }

                    chain.push({ k, v: val });
                    show({ [`${b}.${chain.length - 1}`]: "new" });
                    say(chain.length > 1
                        ? `Added to the end of bucket ${b}'s chain. That's how chaining resolves collisions.`
                        : `Bucket ${b} was empty, so the entry goes straight in. O(1)`);
                }
            },
            {
                label: "Get",
                run: async v => {
                    const k = keyFrom(v.key);
                    if (k === null) return;
                    const b = hashOf(k);
                    say(`hash("${k}") = ${hashText(k)} = ${b}. Go straight to bucket ${b}.`);
                    show({ [b]: "visit" });
                    await wait();

                    const chain = table[b];
                    for (let j = 0; j < chain.length; j++) {
                        show({ [b]: "visit", [`${b}.${j}`]: "visit" });
                        say(`Is "${chain[j].k}" the key "${k}"? ${chain[j].k === k ? "Yes!" : "No, next in the chain."}`);
                        await wait();
                        if (chain[j].k === k) {
                            show({ [`${b}.${j}`]: "found" });
                            say(`Found: "${k}" → ${chain[j].v}. We only looked in one bucket, not the whole table.`);
                            return;
                        }
                    }
                    show({ [b]: "miss" });
                    say(`"${k}" isn't in the map. Only bucket ${b} had to be checked.`);
                }
            },
            {
                label: "Remove",
                run: async v => {
                    const k = keyFrom(v.key);
                    if (k === null) return;
                    const b = hashOf(k);
                    say(`hash("${k}") = ${hashText(k)} = ${b}. Look in bucket ${b}.`);
                    show({ [b]: "visit" });
                    await wait();

                    const chain = table[b];
                    for (let j = 0; j < chain.length; j++) {
                        show({ [b]: "visit", [`${b}.${j}`]: "visit" });
                        say(`Is "${chain[j].k}" the key "${k}"? ${chain[j].k === k ? "Yes!" : "No, next."}`);
                        await wait();
                        if (chain[j].k === k) {
                            show({ [`${b}.${j}`]: "miss" });
                            await wait();
                            chain.splice(j, 1);
                            show();
                            say(`Removed "${k}" by unlinking it from the chain.`);
                            return;
                        }
                    }
                    show({ [b]: "miss" });
                    say(`"${k}" isn't in the map, so there is nothing to remove.`);
                }
            }
        ],
        fill() {
            table = Array.from({ length: BUCKETS }, () => []);
            [["cat", "1"], ["dog", "2"], ["bird", "3"], ["fish", "4"], ["owl", "5"], ["bee", "6"]]
                .forEach(([k, v]) => quickPut(k, v));
            show();
            say("Loaded 6 animals. Several share a bucket, which is a collision.");
        },
        clear() {
            table = Array.from({ length: BUCKETS }, () => []);
            show();
            say("Hash map cleared.");
        },
        show
    };
})();

// ===================================================================
// BINARY SEARCH TREE
// ===================================================================
structures.tree = (() => {
    const MAX = 15;
    let root = null;

    const count = n => (n ? 1 + count(n.left) + count(n.right) : 0);
    const height = n => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);

    function show(h = {}) {
        const nodes = [];
        const edges = [];
        let i = 0;
        let maxDepth = 0;

        // in-order walk: x = position in sorted order, y = depth
        (function walk(n, depth) {
            if (!n) return;
            walk(n.left, depth + 1);
            n.col = i++;
            n.depth = depth;
            maxDepth = Math.max(maxDepth, depth);
            nodes.push(n);
            walk(n.right, depth + 1);
        })(root, 0);

        nodes.forEach(n => {
            if (n.left) edges.push([n.value, n.left.value]);
            if (n.right) edges.push([n.value, n.right.value]);
        });

        const w = Math.max(i * 46 + 40, 220);
        const ht = (maxDepth + 1) * 68 + 20;

        drawTree(
            nodes.map(n => ({
                id: n.value,
                x: 43 + n.col * 46,
                y: 36 + n.depth * 68,
                label: n.value,
                cls: hl(h, n.value)
            })),
            edges, w, ht
        );
        info.textContent = `Nodes: ${count(root)} · Height: ${height(root)} · Left subtree < node < right subtree`;
    }

    // walks down from the root toward n, animating; returns the node or null
    async function locate(n, h) {
        let cur = root;
        while (cur) {
            h[cur.value] = "visit";
            show(h);
            if (n === cur.value) return cur;
            const left = n < cur.value;
            say(`${n} ${left ? "<" : ">"} ${cur.value}, so go ${left ? "left" : "right"}.`);
            await wait();
            h[cur.value] = "done";
            cur = left ? cur.left : cur.right;
        }
        return null;
    }

    function removeFrom(node, val) {
        if (!node) return null;
        if (val < node.value) { node.left = removeFrom(node.left, val); return node; }
        if (val > node.value) { node.right = removeFrom(node.right, val); return node; }
        if (!node.left) return node.right;
        if (!node.right) return node.left;
        let s = node.right;
        while (s.left) s = s.left;
        node.value = s.value;
        node.right = removeFrom(node.right, s.value);
        return node;
    }

    function inorder(n, o = []) { if (n) { inorder(n.left, o); o.push(n.value); inorder(n.right, o); } return o; }
    function preorder(n, o = []) { if (n) { o.push(n.value); preorder(n.left, o); preorder(n.right, o); } return o; }
    function postorder(n, o = []) { if (n) { postorder(n.left, o); postorder(n.right, o); o.push(n.value); } return o; }
    function levelorder(n) {
        const o = [];
        const q = n ? [n] : [];
        while (q.length) {
            const c = q.shift();
            o.push(c.value);
            if (c.left) q.push(c.left);
            if (c.right) q.push(c.right);
        }
        return o;
    }

    async function traverse(title, rule, order) {
        if (!root) { say("The tree is empty."); return; }
        const seq = order(root);
        const h = {};
        for (let i = 0; i < seq.length; i++) {
            h[seq[i]] = "visit";
            show(h);
            say(`${title} (${rule}). Visiting ${seq[i]}. Order so far: ${seq.slice(0, i + 1).join(", ")}`);
            await wait();
            h[seq[i]] = "done";
        }
        show(h);
        say(`${title} order: ${seq.join(", ")}`);
    }

    return {
        name: "Binary Search Tree",
        blurb: "Every value to the left of a node is smaller and every value to the right is bigger, so each comparison throws away a whole branch.",
        hint: "Insert a few numbers, then try Search or one of the traversals.",
        complexity: [["Search", "O(log n) avg"], ["Insert", "O(log n) avg"], ["Delete", "O(log n) avg"], ["Worst", "O(n)"]],
        space: "O(n)",
        inputs: [{ id: "value", placeholder: "Value (0-99)" }],
        buttons: [
            {
                label: "Insert",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (count(root) >= MAX) { say(`The demo tree is full (${MAX} nodes).`); return; }

                    if (!root) {
                        root = { value: n, left: null, right: null };
                        show({ [n]: "new" });
                        say(`The tree was empty, so ${n} becomes the root.`);
                        return;
                    }

                    const h = {};
                    let cur = root;
                    while (true) {
                        h[cur.value] = "visit";
                        show(h);

                        if (n === cur.value) {
                            h[cur.value] = "found";
                            show(h);
                            say(`${n} is already in the tree. A BST ignores duplicates.`);
                            return;
                        }

                        const left = n < cur.value;
                        say(`${n} ${left ? "<" : ">"} ${cur.value}, so go ${left ? "left" : "right"}.`);
                        await wait();
                        h[cur.value] = "done";

                        const next = left ? cur.left : cur.right;
                        if (!next) {
                            const node = { value: n, left: null, right: null };
                            if (left) cur.left = node; else cur.right = node;
                            h[n] = "new";
                            show(h);
                            say(`Empty spot found: ${n} becomes the ${left ? "left" : "right"} child of ${cur.value}.`);
                            return;
                        }
                        cur = next;
                    }
                }
            },
            {
                label: "Delete",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (!root) { say("The tree is empty."); return; }

                    const h = {};
                    const target = await locate(n, h);
                    if (!target) {
                        show(h);
                        say(`${n} isn't in the tree, so there is nothing to delete.`);
                        return;
                    }

                    h[n] = "miss";
                    show(h);

                    if (target.left && target.right) {
                        say(`${n} has two children. Replace it with its in-order successor: the smallest value in its right subtree.`);
                        await wait();
                        let s = target.right;
                        while (true) {
                            h[s.value] = "visit";
                            show(h);
                            await wait();
                            if (!s.left) break;
                            h[s.value] = "done";
                            s = s.left;
                        }
                        say(`The successor is ${s.value}. Copy it into the deleted node's spot, then remove its old position.`);
                        h[s.value] = "found";
                        show(h);
                        await wait();
                    } else if (!target.left && !target.right) {
                        say(`${n} is a leaf (no children), so it can simply be removed.`);
                        await wait();
                    } else {
                        say(`${n} has one child, so that child takes its place.`);
                        await wait();
                    }

                    root = removeFrom(root, n);
                    show();
                    say(`Deleted ${n}. The tree is still a valid BST.`);
                }
            },
            {
                label: "Search",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (!root) { say("The tree is empty."); return; }

                    const h = {};
                    const node = await locate(n, h);
                    if (node) {
                        h[n] = "found";
                        show(h);
                        say(`Found ${n}!`);
                    } else {
                        show(h);
                        say(`Reached an empty spot, so ${n} isn't in the tree. Each step discarded a whole subtree, which is why this is O(log n) on a balanced tree.`);
                    }
                }
            },
            { label: "In-order",    run: () => traverse("In-order", "left, node, right: gives sorted output", inorder) },
            { label: "Pre-order",   run: () => traverse("Pre-order", "node, left, right", preorder) },
            { label: "Post-order",  run: () => traverse("Post-order", "left, right, node", postorder) },
            { label: "Level-order", run: () => traverse("Level-order", "row by row, breadth-first", levelorder) }
        ],
        fill() {
            root = null;
            const add = n => {
                const node = { value: n, left: null, right: null };
                if (!root) { root = node; return; }
                let cur = root;
                while (true) {
                    const side = n < cur.value ? "left" : "right";
                    if (!cur[side]) { cur[side] = node; return; }
                    cur = cur[side];
                }
            };
            distinct(8).forEach(add);
            show();
            say("Inserted 8 random values.");
        },
        clear() {
            root = null;
            show();
            say("Tree cleared.");
        },
        show
    };
})();

// ===================================================================
// HEAP
// ===================================================================
structures.heap = (() => {
    const MAX = 15;
    let heap = [];
    let type = "min";

    const above = (a, b) => (type === "min" ? a < b : a > b);
    const word = () => (type === "min" ? "smaller" : "larger");

    function show(h = {}) {
        info.textContent =
            `${type === "min" ? "Min" : "Max"}-heap · Size ${heap.length} / ${MAX} · ` +
            `for index i: parent = ⌊(i−1)/2⌋, children = 2i+1 and 2i+2`;

        if (!heap.length) {
            stage.innerHTML = `<div class="empty-note">The heap is empty</div>`;
            return;
        }

        const depth = Math.floor(Math.log2(heap.length));
        const w = Math.max(2 ** depth * 56, 220);
        const ht = depth * 68 + 60;

        const nodes = heap.map((v, i) => {
            const d = Math.floor(Math.log2(i + 1));
            const p = i - (2 ** d - 1);
            return { id: i, x: (p + 0.5) * (w / 2 ** d), y: 30 + d * 68, label: v, cls: hl(h, i) };
        });
        const edges = heap.map((_, i) => (i ? [(i - 1) >> 1, i] : null)).filter(Boolean);

        const strip =
            `<div class="arr-row">${heap.map((v, i) =>
                `<div class="arr-cell"><div class="cell${hl(h, i)}">${v}</div><span class="idx">${i}</span></div>`
            ).join("")}</div>`;

        drawTree(nodes, edges, w, ht, strip);
    }

    function silentInsert(n) {
        heap.push(n);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (!above(heap[i], heap[p])) break;
            [heap[i], heap[p]] = [heap[p], heap[i]];
            i = p;
        }
    }

    return {
        name: "Heap",
        blurb: "A tree where every parent beats its children (smaller in a min-heap, larger in a max-heap), stored compactly in an array. The best value is always at the root.",
        hint: "Insert a few numbers and watch them bubble up. Then try Extract.",
        complexity: [["Insert", "O(log n)"], ["Extract", "O(log n)"], ["Peek", "O(1)"], ["Build", "O(n)"]],
        space: "O(n)",
        inputs: [
            { id: "value", placeholder: "Value (0-99)" },
            {
                id: "type",
                options: [["min", "Min-heap"], ["max", "Max-heap"]],
                value: () => type,
                onChange: async val => {
                    type = val;
                    const old = [...heap];
                    heap = [];
                    old.forEach(silentInsert);
                    show();
                    say(`Switched to a ${type}-heap. The same values, rearranged so the ${type === "min" ? "smallest" : "largest"} is at the root.`);
                }
            }
        ],
        buttons: [
            {
                label: "Insert",
                run: async v => {
                    const n = num(v.value);
                    if (n === null) return;
                    if (heap.length >= MAX) { say(`The demo heap is full (${MAX} items).`); return; }

                    heap.push(n);
                    let i = heap.length - 1;
                    show({ [i]: "new" });
                    say(`Insert ${n}: add it at the next free spot (index ${i}) so the tree stays complete. Then bubble it up.`);
                    await wait();

                    while (i > 0) {
                        const p = (i - 1) >> 1;
                        show({ [i]: "visit", [p]: "visit" });
                        say(`Compare ${heap[i]} with its parent ${heap[p]}.`);
                        await wait();

                        if (!above(heap[i], heap[p])) {
                            show({ [i]: "found" });
                            say(`${heap[i]} is not ${word()} than ${heap[p]}, so it stays. The heap rule holds.`);
                            return;
                        }

                        [heap[i], heap[p]] = [heap[p], heap[i]];
                        show({ [i]: "swap", [p]: "swap" });
                        say(`${heap[p]} is ${word()} than its parent, so swap them.`);
                        await wait();
                        i = p;
                    }

                    show({ 0: "found" });
                    say(`${heap[0]} bubbled all the way to the root.`);
                }
            },
            {
                label: "Extract",
                run: async () => {
                    if (!heap.length) { say("The heap is empty."); return; }

                    const top = heap[0];
                    show({ 0: "miss" });
                    say(`Extract: the root (${top}) is the ${type === "min" ? "smallest" : "largest"} value, so take it out.`);
                    await wait();

                    if (heap.length === 1) {
                        heap = [];
                        show();
                        say(`Removed ${top}. The heap is empty now.`);
                        return;
                    }

                    heap[0] = heap.pop();
                    show({ 0: "new" });
                    say(`Move the last item (${heap[0]}) to the root to keep the tree complete. Then sink it down.`);
                    await wait();

                    let i = 0;
                    while (true) {
                        const l = 2 * i + 1;
                        const r = 2 * i + 2;
                        let best = i;
                        if (l < heap.length && above(heap[l], heap[best])) best = l;
                        if (r < heap.length && above(heap[r], heap[best])) best = r;

                        const marks = { [i]: "visit" };
                        if (l < heap.length) marks[l] = "visit";
                        if (r < heap.length) marks[r] = "visit";
                        show(marks);
                        say(l < heap.length
                            ? `Compare ${heap[i]} with its children.`
                            : `${heap[i]} has no children, so it can't sink any further.`);
                        await wait();

                        if (best === i) {
                            show({ [i]: "found" });
                            say(`${heap[i]} is in the right place. Extracted ${top}.`);
                            return;
                        }

                        [heap[i], heap[best]] = [heap[best], heap[i]];
                        show({ [i]: "swap", [best]: "swap" });
                        say(`Swap with the ${word()} child (${heap[i]}).`);
                        await wait();
                        i = best;
                    }
                }
            },
            {
                label: "Peek",
                run: async () => {
                    if (!heap.length) { say("The heap is empty."); return; }
                    show({ 0: "found" });
                    say(`Peek: the root is ${heap[0]}, the ${type === "min" ? "minimum" : "maximum"}. Looking is O(1).`);
                }
            }
        ],
        fill() {
            heap = [];
            distinct(7).forEach(silentInsert);
            show();
            say("Built a heap from 7 random values.");
        },
        clear() {
            heap = [];
            show();
            say("Heap cleared.");
        },
        show
    };
})();

// ===================================================================
// GRAPH (undirected, adjacency list)
// ===================================================================
structures.graph = (() => {
    const LETTERS = "ABCDEFGH";
    let nodes = [];
    let edges = [];   // "A-B" with the letters sorted

    const key = (a, b) => [a, b].sort().join("-");
    const neighbours = L => edges
        .filter(e => e.split("-").includes(L))
        .map(e => e.split("-").find(x => x !== L))
        .sort();

    // each letter has a fixed slot around a circle, so nodes never jump
    function pos(L) {
        const angle = -Math.PI / 2 + LETTERS.indexOf(L) * (Math.PI / 4);
        return { x: 220 + 140 * Math.cos(angle), y: 180 + 140 * Math.sin(angle) };
    }

    function show(hn = {}, he = {}) {
        if (!nodes.length) {
            stage.innerHTML = `<div class="empty-note">No nodes yet. Press Add Node, or Fill random.</div>`;
            info.textContent = "";
            return;
        }

        const lines = edges.map(e => {
            const [a, b] = e.split("-");
            const p = pos(a);
            const q = pos(b);
            return `<line class="edge${hl(he, e)}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
        }).join("");

        const dots = nodes.map(L => {
            const p = pos(L);
            return `<g class="vnode${hl(hn, L)}"><circle cx="${p.x}" cy="${p.y}" r="22"/>` +
                   `<text x="${p.x}" y="${p.y}" dy="0.35em">${L}</text></g>`;
        }).join("");

        stage.innerHTML = `<div class="svg-wrap"><svg class="graph-svg" viewBox="0 0 440 360">${lines}${dots}</svg></div>`;
        info.textContent = "Adjacency list:\n" +
            nodes.map(L => `${L}: ${neighbours(L).join(", ") || "-"}`).join("\n");
    }

    function startFrom(raw) {
        if (!nodes.length) {
            say("Add some nodes first, or press Fill random.");
            return null;
        }
        const s = (raw || "").trim().toUpperCase() || nodes[0];
        if (!nodes.includes(s)) {
            say(`There is no node "${s}". Existing nodes: ${nodes.join(", ")}.`);
            return null;
        }
        return s;
    }

    function finish(order, name) {
        const missed = nodes.length - order.length;
        say(`${name} finished. Visit order: ${order.join(" → ")}.` +
            (missed ? ` ${missed} node(s) weren't reached: they're in a separate connected component.` : ""));
    }

    async function bfs(start) {
        const hn = { [start]: "queued" };
        const he = {};
        const seen = new Set([start]);
        const queue = [start];
        const order = [];

        show(hn, he);
        say(`BFS starts at ${start}: put it in the queue. Queue: [${queue.join(", ")}]`);
        await wait();

        while (queue.length) {
            const cur = queue.shift();
            order.push(cur);
            hn[cur] = "visit";
            show(hn, he);
            say(`Dequeue ${cur} and visit it. Order so far: ${order.join(" → ")}`);
            await wait();

            for (const nb of neighbours(cur)) {
                if (seen.has(nb)) continue;
                seen.add(nb);
                queue.push(nb);
                hn[nb] = "queued";
                he[key(cur, nb)] = "used";
            }
            hn[cur] = "done";
            show(hn, he);
            say(`Add ${cur}'s unseen neighbours to the back of the queue. Queue: [${queue.join(", ") || "empty"}]`);
            await wait();
        }
        finish(order, "BFS");
    }

    async function dfs(start) {
        const hn = { [start]: "queued" };
        const he = {};
        const visited = new Set();
        const stack = [start];
        const from = {};
        const order = [];

        show(hn, he);
        say(`DFS starts at ${start}: push it on the stack. Stack: [${stack.join(", ")}]`);
        await wait();

        while (stack.length) {
            const cur = stack.pop();
            if (visited.has(cur)) continue;   // reached another way already

            visited.add(cur);
            order.push(cur);
            hn[cur] = "visit";
            if (from[cur]) he[key(from[cur], cur)] = "used";
            show(hn, he);
            say(`Pop ${cur} and visit it. Order so far: ${order.join(" → ")}`);
            await wait();

            const next = neighbours(cur).filter(n => !visited.has(n));
            [...next].reverse().forEach(n => {
                stack.push(n);
                from[n] = cur;
                hn[n] = "queued";
            });
            hn[cur] = "done";
            show(hn, he);
            say(`Push ${cur}'s unvisited neighbours (alphabetically first ends up on top). Stack: [${stack.join(", ") || "empty"}]`);
            await wait();
        }
        finish(order, "DFS");
    }

    return {
        name: "Graph",
        blurb: "Nodes joined by edges, stored here as an adjacency list: each node keeps a list of its neighbours. Breadth-first search explores outwards in rings, depth-first search dives down one path before backing up.",
        hint: "Press Add Node a few times, join them with Add Edge, then run BFS or DFS.",
        complexity: [["Add node", "O(1)"], ["Add edge", "O(1)"], ["BFS", "O(V+E)"], ["DFS", "O(V+E)"]],
        space: "O(V+E)",
        inputs: [
            { id: "from", placeholder: "From (A)", maxLength: 1 },
            { id: "to", placeholder: "To (B)", maxLength: 1 }
        ],
        buttons: [
            {
                label: "Add Node",
                run: async () => {
                    if (nodes.length >= LETTERS.length) {
                        say(`The demo graph holds at most ${LETTERS.length} nodes.`);
                        return;
                    }
                    const L = LETTERS[nodes.length];
                    nodes.push(L);
                    show({ [L]: "new" });
                    say(`Added node ${L} with an empty neighbour list. O(1)`);
                }
            },
            {
                label: "Add Edge",
                run: async v => {
                    const a = (v.from || "").trim().toUpperCase();
                    const b = (v.to || "").trim().toUpperCase();
                    if (!nodes.includes(a) || !nodes.includes(b)) {
                        say(`Both ends must be existing nodes (${nodes.join(", ") || "none yet"}).`);
                        return;
                    }
                    if (a === b) { say("A node can't connect to itself in this demo."); return; }
                    const k = key(a, b);
                    if (edges.includes(k)) { say(`${a} and ${b} are already connected.`); return; }
                    edges.push(k);
                    show({}, { [k]: "used" });
                    say(`Added the undirected edge ${a}–${b}: ${b} goes in ${a}'s list and ${a} goes in ${b}'s list. O(1)`);
                }
            },
            {
                label: "Remove Edge",
                run: async v => {
                    const a = (v.from || "").trim().toUpperCase();
                    const b = (v.to || "").trim().toUpperCase();
                    const k = key(a, b);
                    if (!edges.includes(k)) { say(`There's no edge between ${a || "?"} and ${b || "?"}.`); return; }
                    edges = edges.filter(e => e !== k);
                    show();
                    say(`Removed the edge ${a}–${b}.`);
                }
            },
            {
                label: "BFS",
                run: async v => {
                    const s = startFrom(v.from);
                    if (s) await bfs(s);
                }
            },
            {
                label: "DFS",
                run: async v => {
                    const s = startFrom(v.from);
                    if (s) await dfs(s);
                }
            }
        ],
        fill() {
            nodes = LETTERS.slice(0, 6).split("");
            edges = [];
            for (let i = 1; i < 6; i++) {
                edges.push(key(nodes[i], nodes[rand(0, i - 1)]));   // keeps it connected
            }
            for (let t = 0; t < 2; t++) {
                const a = rand(0, 5);
                const b = rand(0, 5);
                const k = key(nodes[a], nodes[b]);
                if (a !== b && !edges.includes(k)) edges.push(k);
            }
            show();
            say("Built a random connected graph with 6 nodes. Type a start node in 'From', then run BFS or DFS.");
        },
        clear() {
            nodes = [];
            edges = [];
            show();
            say("Graph cleared.");
        },
        show
    };
})();

// ===================================================================
// page wiring
// ===================================================================
let busy = false;
let current = null;

function setBusy(on) {
    opsBar.querySelectorAll("button").forEach(b => { b.disabled = on; });
    picker.disabled = on;
}

async function runAction(fn) {
    if (busy) return;
    busy = true;
    setBusy(true);
    try {
        await fn();
    } catch (error) {
        console.error(error);
        say("Something went wrong. Check the browser console.");
    } finally {
        busy = false;
        setBusy(false);
    }
}

function readInputs(s) {
    return Object.fromEntries(s.inputs.map(def => [def.id, $("in-" + def.id).value]));
}

function buildControls(s) {
    opsBar.innerHTML = "";

    s.inputs.forEach(def => {
        let el;

        if (def.options) {
            el = document.createElement("select");
            def.options.forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                el.appendChild(option);
            });
            if (def.value) el.value = def.value();
            el.addEventListener("change", () => runAction(() => def.onChange(el.value)));
        } else {
            el = document.createElement("input");
            el.type = "text";
            el.placeholder = def.placeholder;
            el.maxLength = def.maxLength ?? 2;
            el.autocomplete = "off";
        }

        el.id = "in-" + def.id;
        el.className = "op-input";
        el.setAttribute("aria-label", def.placeholder ?? def.id);
        opsBar.appendChild(el);
    });

    const buttons = [
        ...s.buttons,
        { label: "Fill random", run: async () => s.fill() },
        { label: "Clear", danger: true, run: async () => s.clear() }
    ];

    buttons.forEach((def, i) => {
        const b = document.createElement("button");
        b.textContent = def.label;
        b.className = "btn " + (def.danger ? "btn-ghost" : i === 0 ? "btn-primary" : "btn-secondary");
        b.addEventListener("click", () => runAction(() => def.run(readInputs(s))));
        opsBar.appendChild(b);
    });

    // Enter in a text box presses the first button
    opsBar.querySelectorAll("input").forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") opsBar.querySelector("button").click();
        });
    });
}

function choose(key) {
    current = structures[key];

    $("s-name").textContent = current.name;
    $("s-blurb").textContent = current.blurb;
    $("s-complexity").innerHTML =
        `<div class="cx-group"><span class="cx-label">Time</span>` +
        current.complexity.map(([k, v]) => `<span class="chip"><i>${k}</i><b>${v}</b></span>`).join("") +
        `</div><div class="cx-group"><span class="cx-label">Space</span>` +
        `<span class="chip"><b>${current.space}</b></span></div>`;

    buildControls(current);
    current.show();
    say(current.hint);
}

picker.addEventListener("change", () => choose(picker.value));

function updateSpeedLabel() {
    const ms = Number(speed.value);
    speedValue.textContent = ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}
speed.addEventListener("input", updateSpeedLabel);

updateSpeedLabel();
choose("stack");









