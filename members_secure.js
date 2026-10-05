// club-auth.js
const clubPasswordHash = "5dbc2a24c8c56972c17c2b2f9de2d59aec574f1405d6a127d7b779a434f17e66";

async function checkClubPassword(event) {
    event.preventDefault();
    
    const userInput = prompt("Please enter the club password to access the Members Area:");
    if (!userInput) return; 

    const encoder = new TextEncoder();
    const data = encoder.encode(userInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const userHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (userHash === clubPasswordHash) {
        // Change this to your exact members page filename
        window.location.href = "members-page.html"; 
    } else {
        alert("Incorrect password. Please try again.");
    }
}

