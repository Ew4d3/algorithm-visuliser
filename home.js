const dialog = document.getElementById("auth-dialog");
const tabs = document.querySelectorAll(".tab");

const forms = {
    login: document.getElementById("login-form"),
    register: document.getElementById("register-form")
};

// ---------- open / close ----------
function showMode(mode) {
    tabs.forEach(tab => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
    });

    Object.entries(forms).forEach(([name, form]) => {
        form.hidden = name !== mode;
        clearErrors(form);
    });
}

function openDialog(mode) {
    showMode(mode);
    dialog.showModal();
    forms[mode].querySelector("input").focus();
}

document.getElementById("open-login").addEventListener("click", () => openDialog("login"));
document.getElementById("open-register").addEventListener("click", () => openDialog("register"));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());

// clicking the dark backdrop closes it (the dialog has no padding, so the
// backdrop is the only thing that makes the dialog itself the click target)
dialog.addEventListener("click", event => {
    if (event.target === dialog) {
        dialog.close();
    }
});

// tabs and the "No account? / Already registered?" links
document.querySelectorAll("[data-mode]").forEach(el => {
    el.addEventListener("click", () => openDialog(el.dataset.mode));
});

// ---------- validation ----------
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rules = {
    login: {
        email: v => emailPattern.test(v) ? "" : "Enter a valid email address.",
        password: v => v ? "" : "Enter your password."
    },
    register: {
        username: v => v.length >= 3 ? "" : "Username must be at least 3 characters.",
        email: v => emailPattern.test(v) ? "" : "Enter a valid email address.",
        password: v => v.length >= 8 ? "" : "Password must be at least 8 characters.",
        confirm: (v, data) => v === data.password ? "" : "Passwords don't match."
    }
};

function clearErrors(form) {
    form.querySelectorAll(".field").forEach(field => {
        field.classList.remove("invalid");
        field.querySelector(".error").textContent = "";
    });
    setStatus(form, "", "");
}

function setStatus(form, text, kind) {
    const status = form.querySelector(".form-status");
    status.textContent = text;
    status.className = `form-status ${kind}`.trim();
}

function validate(mode, form) {
    const data = Object.fromEntries(new FormData(form));
    let valid = true;

    for (const [name, check] of Object.entries(rules[mode])) {
        const field = form.elements[name].closest(".field");
        const message = check((data[name] ?? "").trim(), data);

        field.classList.toggle("invalid", Boolean(message));
        field.querySelector(".error").textContent = message;

        if (message) {
            valid = false;
        }
    }

    return valid ? data : null;
}

// ---------- submitting ----------
// TODO: replace this with a real request once the backend exists, e.g.
//   const res = await fetch(`/api/${mode}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data)
//   });
//   return { ok: res.ok, message: (await res.json()).message };
async function submitToServer(mode, data) {
    return {
        ok: true,
        message: "Form looks good, but there's no backend connected yet, so nothing was saved."
    };
}

Object.entries(forms).forEach(([mode, form]) => {
    // clear a field's error as soon as the user edits it
    form.addEventListener("input", event => {
        const field = event.target.closest(".field");
        if (field) {
            field.classList.remove("invalid");
            field.querySelector(".error").textContent = "";
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        setStatus(form, "", "");

        const data = validate(mode, form);
        if (!data) {
            return;
        }

        try {
            const result = await submitToServer(mode, data);
            setStatus(form, result.message, result.ok ? "ok" : "fail");
        } catch {
            setStatus(form, "Couldn't reach the server. Please try again.", "fail");
        }
    });
});