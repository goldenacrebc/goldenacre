// club-auth.js
const clubPasswordHash = "5dbc2a24c8c56972c17c2b2f9de2d59aec574f1405d6a127d7b779a434f17e66";

const membersLoginDialog = document.getElementById("members-login");
const membersLoginForm = document.getElementById("members-login-form");
const membersPasswordInput = document.getElementById("members-password");
const membersLoginError = document.getElementById("members-login-error");

document.querySelector('nav a[href="#members-login"]').addEventListener("click", event => {
    event.preventDefault();
    membersLoginError.hidden = true;
    membersLoginError.textContent = "";
    membersLoginForm.reset();
    membersLoginDialog.showModal();
    membersPasswordInput.focus();
});

membersLoginDialog.querySelector(".members-login-close").addEventListener("click", () => {
    membersLoginDialog.close();
});

membersLoginForm.addEventListener("submit", async event => {
    event.preventDefault();
    membersLoginError.hidden = true;
    membersLoginError.textContent = "";

    const encoder = new TextEncoder();
    const data = encoder.encode(membersPasswordInput.value);

    try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const userHash = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

        if (userHash === clubPasswordHash) {
            window.location.href = "members_secure.html";
            return;
        }

        membersLoginError.textContent = "Incorrect password. Please try again.";
        membersLoginError.hidden = false;
        membersPasswordInput.select();
    } catch (error) {
        membersLoginError.textContent = "Could not verify the password. Please try again.";
        membersLoginError.hidden = false;
        console.error("Members Area password verification failed:", error);
    }
});
