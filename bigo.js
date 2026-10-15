(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    // ===================================================================
    // 1. CHEAT SHEET TABLES
    // ===================================================================
    const TABLES = {
        sorting: {
            cols: ["Algorithm", "Best", "Average", "Worst", "Space", "Stable"],
            plain: [5],
            rows: [
                ["Bubble Sort",    "O(n)",       "O(n²)",       "O(n²)",       "O(1)",     "Yes"],
                ["Selection Sort", "O(n²)",      "O(n²)",       "O(n²)",       "O(1)",     "No"],
                ["Insertion Sort", "O(n)",       "O(n²)",       "O(n²)",       "O(1)",     "Yes"],
                ["Quick Sort",     "O(n log n)", "O(n log n)",  "O(n²)",       "O(log n)", "No"],
                ["Merge Sort",     "O(n log n)", "O(n log n)",  "O(n log n)",  "O(n)",     "Yes"],
                ["Heap Sort",      "O(n log n)", "O(n log n)",  "O(n log n)",  "O(1)",     "No"],
                ["Bogo Sort",      "O(n)",       "O(n·n!)",     "O(∞)",        "O(1)",     "No"],
                ["Rot Sort",       "O(1 year)",  "O(1 year)",   "O(1 year)",   "O(1)",     "Yes"]
            ],
            note: "Bubble sort is only O(n) best case if it stops early when a pass makes no swaps. " +
                  "Quick sort's O(n²) worst case happens with bad pivots, such as a sorted array with a last-element pivot. " +
                  "Stable means equal values keep their original order."
        },

        searching: {
            cols: ["Algorithm", "Best", "Average", "Worst", "Space", "Needs sorted input"],
            plain: [5],
            rows: [
                ["Linear Search",              "O(1)",   "O(n)",     "O(n)",     "O(1)", "No"],
                ["Binary Search",              "O(1)",   "O(log n)", "O(log n)", "O(1)", "Yes"],
                ["Breadth-first search (BFS)", "O(V+E)", "O(V+E)",   "O(V+E)",   "O(V)", "No (graph)"],
                ["Depth-first search (DFS)",   "O(V+E)", "O(V+E)",   "O(V+E)",   "O(V)", "No (graph)"]
            ],
            note: "For graphs, V is the number of vertices (nodes) and E is the number of edges."
        },

        structures: {
            cols: ["Structure", "Access", "Search", "Insert", "Delete", "Space"],
            plain: [],
            rows: [
                ["Array",                 "O(1)",         "O(n)",         "O(n)",          "O(n)",          "O(n)"],
                ["Stack",                 "O(n)",         "O(n)",         "O(1)",          "O(1)",          "O(n)"],
                ["Queue",                 "O(n)",         "O(n)",         "O(1)",          "O(1)",          "O(n)"],
                ["Linked List",           "O(n)",         "O(n)",         "O(1) head",     "O(1) head",     "O(n)"],
                ["Hash Map",              "—",            "O(1) avg",     "O(1) avg",      "O(1) avg",      "O(n)"],
                ["Binary Search Tree",    "O(log n) avg", "O(log n) avg", "O(log n) avg",  "O(log n) avg",  "O(n)"],
                ["Heap",                  "O(1) peek",    "O(n)",         "O(log n)",      "O(log n)",      "O(n)"],
                ["Graph (adjacency list)", "—",           "O(V+E)",       "O(1)",          "O(V+E)",        "O(V+E)"]
            ],
            note: "Mostly average case. A hash map degrades to O(n) with many collisions, and an unbalanced BST degrades to O(n). " +
                  "Stack and queue operations are on the top or ends. Heap access means peeking at the root, and heap delete means extracting it."
        }
    };

    // pick a colour class from the text of a complexity
    function rate(text) {
        if (/!|∞|year|2ⁿ|\^n/.test(text)) return "awful";
        if (/²|³/.test(text)) return "bad";
        if (/n log n/.test(text)) return "fair";
        if (/^O\(1\)/.test(text)) return "great";
        if (/log/.test(text)) return "great";
        if (/^O\(/.test(text)) return "good";
        return "none";
    }

    const badge = text => `<span class="cx cx-${rate(text)}">${text}</span>`;

    function renderTable(key) {
        const t = TABLES[key];

        const head = t.cols.map(c => `<th scope="col">${c}</th>`).join("");
        const body = t.rows.map(row =>
            "<tr>" + row.map((cell, i) => {
                if (i === 0) return `<th scope="row">${cell}</th>`;
                if (t.plain.includes(i)) return `<td>${cell}</td>`;
                return `<td>${badge(cell)}</td>`;
            }).join("") + "</tr>"
        ).join("");

        $("bigo-table").innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
        $("bigo-note").textContent = t.note;
    }

    document.querySelectorAll(".bigo-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".bigo-tab").forEach(other => {
                const on = other === tab;
                other.classList.toggle("active", on);
                other.setAttribute("aria-selected", String(on));
            });
            renderTable(tab.dataset.table);
        });
    });

    // ===================================================================
    // 2. GROWTH CURVES
    // ===================================================================
    // f(n)     = number of operations (used to draw the line chart)
    // log10(n) = log10 of the number of operations (used by the bar chart,
    //            because 2^n and n! overflow ordinary numbers)
    const stirling = n => Math.sqrt(2 * Math.PI * n) * Math.pow(n / Math.E, n);

    const CURVES = [
        {
            id: "c1", label: "O(1)", color: "#2ee6a6",
            f: () => 1,
            log10: () => 0
        },
        {
            id: "c2", label: "O(log n)", color: "#00e5ff",
            f: n => Math.log2(n),
            log10: n => Math.log10(Math.log2(n))
        },
        {
            id: "c3", label: "O(n)", color: "#5ea8ff",
            f: n => n,
            log10: n => Math.log10(n)
        },
        {
            id: "c4", label: "O(n log n)", color: "#ffd60a",
            f: n => n * Math.log2(n),
            log10: n => Math.log10(n) + Math.log10(Math.log2(n))
        },
        {
            id: "c5", label: "O(n²)", color: "#ff8a4c",
            f: n => n * n,
            log10: n => 2 * Math.log10(n)
        },
        {
            id: "c6", label: "O(2ⁿ)", color: "#ff5c7a",
            f: n => Math.pow(2, n),
            log10: n => n * Math.log10(2)
        },
        {
            id: "c7", label: "O(n!)", color: "#b388ff",
            f: n => stirling(n),
            log10: n => (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n)) / Math.LN10
        }
    ];

    const visible = new Set(CURVES.map(c => c.id));
    const nSlider = $("n-slider");
    const chart = $("growth-chart");

    $("growth-legend").innerHTML = CURVES.map(c =>
        `<button type="button" class="curve-btn" data-id="${c.id}" aria-pressed="true">` +
        `<i style="background:${c.color}"></i>${c.label}</button>`
    ).join("");

    $("growth-legend").addEventListener("click", event => {
        const button = event.target.closest(".curve-btn");
        if (!button) return;

        const id = button.dataset.id;
        if (visible.has(id)) visible.delete(id); else visible.add(id);

        button.classList.toggle("off", !visible.has(id));
        button.setAttribute("aria-pressed", String(visible.has(id)));
        drawGrowth();
    });

    function drawGrowth() {
        const N = Number(nSlider.value);
        $("n-value").textContent = N;

        const W = 720;
        const H = 380;
        const m = { l: 54, r: 22, t: 16, b: 44 };
        const pw = W - m.l - m.r;
        const ph = H - m.t - m.b;
        const yMax = N * 6;
        const STEPS = 160;

        const px = x => m.l + ((x - 1) / (N - 1)) * pw;
        const py = y => m.t + ph - (y / yMax) * ph;

        const muted = "#6f8f96";
        const font = `font-family="JetBrains Mono, monospace" font-size="11"`;

        // y grid + labels
        let grid = "";
        for (let k = 0; k <= 5; k++) {
            const value = (yMax * k) / 5;
            const y = py(value).toFixed(1);
            grid +=
                `<line x1="${m.l}" y1="${y}" x2="${W - m.r}" y2="${y}" stroke="rgba(255,255,255,0.08)"/>` +
                `<text x="${m.l - 8}" y="${y}" dy="0.35em" text-anchor="end" fill="${muted}" ${font}>${Math.round(value)}</text>`;
        }

        // x grid + labels
        const step = Math.ceil(N / 8);
        const ticks = [1];
        for (let t = step; t <= N; t += step) {
            if (t !== 1) ticks.push(t);
        }
        ticks.forEach(t => {
            const x = px(t).toFixed(1);
            grid +=
                `<line x1="${x}" y1="${m.t}" x2="${x}" y2="${m.t + ph}" stroke="rgba(255,255,255,0.05)"/>` +
                `<text x="${x}" y="${m.t + ph + 18}" text-anchor="middle" fill="${muted}" ${font}>${t}</text>`;
        });

        const axes =
            `<line x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${m.t + ph}" stroke="#3b5a61"/>` +
            `<line x1="${m.l}" y1="${m.t + ph}" x2="${W - m.r}" y2="${m.t + ph}" stroke="#3b5a61"/>` +
            `<text x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle" fill="${muted}" ${font}>n (number of items)</text>` +
            `<text transform="rotate(-90)" x="${-(m.t + ph / 2)}" y="14" text-anchor="middle" fill="${muted}" ${font}>operations</text>`;

        // curves
        const paths = CURVES.filter(c => visible.has(c.id)).map(c => {
            let d = "";
            for (let i = 0; i <= STEPS; i++) {
                const x = 1 + ((N - 1) * i) / STEPS;
                const y = Math.min(c.f(x), yMax * 4);   // clamp so huge values stay drawable
                d += `${i ? "L" : "M"}${px(x).toFixed(1)} ${py(y).toFixed(1)}`;
            }
            return `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="2.5" ` +
                   `stroke-linejoin="round" clip-path="url(#bigo-plot-clip)"/>`;
        }).join("");

        const empty = visible.size
            ? ""
            : `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="${muted}" font-size="14">Turn on at least one curve above.</text>`;

        chart.setAttribute("viewBox", `0 0 ${W} ${H}`);
        chart.innerHTML =
            `<defs><clipPath id="bigo-plot-clip">` +
            `<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/></clipPath></defs>` +
            grid + axes + paths + empty;
    }

    nSlider.addEventListener("input", drawGrowth);

    // ===================================================================
    // 3. STEPS FOR n ITEMS (log-scale bars)
    // ===================================================================
    const SIZES = [10, 100, 1000, 10000];
    const OPS_PER_SECOND = 1e9;
    const BAR_CAP = 12;   // bars run up to 10^12 steps; anything bigger is "off the chart"

    const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
    const sup = num => String(num).split("").map(d => SUP[d] ?? d).join("");

    function sci(l) {
        const e = Math.floor(l);
        const mantissa = Math.pow(10, l - e);
        return `${mantissa.toFixed(1)} × 10${sup(e)}`;
    }

    function fmtCount(l) {
        if (l < 15) {
            return Math.max(1, Math.round(Math.pow(10, l))).toLocaleString();
        }
        return sci(l);
    }

    function fmtUnit(value, unit) {
        const text = value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString();
        return `${text} ${unit}`;
    }

    // l = log10(number of steps)
    function timeText(l) {
        const s = l - Math.log10(OPS_PER_SECOND);   // log10 of seconds
        const seconds = Math.pow(10, s);

        if (s < -6) return "under 1 µs";
        if (s < -3) return fmtUnit(seconds * 1e6, "µs");
        if (s < 0) return fmtUnit(seconds * 1e3, "ms");
        if (s < Math.log10(60)) return fmtUnit(seconds, "seconds");
        if (s < Math.log10(3600)) return fmtUnit(seconds / 60, "minutes");
        if (s < Math.log10(86400)) return fmtUnit(seconds / 3600, "hours");
        if (s < Math.log10(31557600)) return fmtUnit(seconds / 86400, "days");

        const years = s - Math.log10(31557600);   // log10 of years
        if (years > Math.log10(1.38e10)) return "longer than the age of the universe";
        if (years < 6) return `${Math.round(Math.pow(10, years)).toLocaleString()} years`;
        return `${sci(years)} years`;
    }

    function drawBars(n) {
        $("bars").innerHTML = CURVES.map(c => {
            const l = Math.max(0, c.log10(n));
            const fraction = (l + 1) / (BAR_CAP + 1);
            const over = fraction > 1;
            const width = Math.min(1, fraction) * 100;

            return `<div class="bar-row">` +
                   `<span class="bar-label" style="color:${c.color}">${c.label}</span>` +
                   `<div class="bar-track"><div class="bar-fill${over ? " over" : ""}" ` +
                   `style="width:${width.toFixed(1)}%;background:${c.color}"></div></div>` +
                   `<span class="bar-count">${fmtCount(l)}</span>` +
                   `<span class="bar-time">${timeText(l)}</span></div>`;
        }).join("");
    }

    const picker = $("size-picker");
    picker.innerHTML = SIZES.map(n =>
        `<button type="button" class="size-btn${n === 100 ? " active" : ""}" data-n="${n}">${n.toLocaleString()}</button>`
    ).join("");

    picker.addEventListener("click", event => {
        const button = event.target.closest(".size-btn");
        if (!button) return;

        picker.querySelectorAll(".size-btn").forEach(b => b.classList.toggle("active", b === button));
        drawBars(Number(button.dataset.n));
    });

    // ===================================================================
    // start up
    // ===================================================================
    renderTable("sorting");
    drawGrowth();
    drawBars(100);
})();