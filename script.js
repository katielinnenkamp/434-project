const commonWords = [
    "password", "admin", "welcome", "summer", "winter", "dragon",
    "qwerty", "letmein", "monkey", "football", "baseball", "login", "user"
];

const keyboardPatterns = ["qwerty", "asdf", "zxcv", "12345", "abcde"];

function togglePassword(button) {
    const input = document.getElementById("password");

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
    } else {
        input.type = "password";
        button.textContent = "Show";
    }
}

function validateRequirements(password) {
    const errors = [];

    const minLength = Number(document.getElementById("minLength").value);
    const requireUpper = document.getElementById("upper").checked;

    const requireDigit = document.getElementById("digit").checked;
    const requireSymbol = document.getElementById("symbol").checked;

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long.`);
    }

    if (requireUpper && !/[A-Z]/.test(password)) {
        errors.push("Password must contain an uppercase letter.");
    }

    if (requireDigit && !/[0-9]/.test(password)) {
        errors.push("Password must contain a number.");
    }

    if (requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
        errors.push("Password must contain a special character.");
    }

    return errors;
}

function analyzePassword(password) {
    let score = 0;
    let feedback = [];

    const length = password.length;

    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    score += Math.min(length * 4, 40);

    const varietyCount = [hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
    score += varietyCount * 10;

    const lower = password.toLowerCase();

    for (let word of commonWords) {
        if (lower === word) {
            feedback.push("This is a very common password.");
            return { score: 0, feedback };
        }

        if (lower.includes(word)) {
            score -= 40;
            feedback.push(`Contains common word: ${word}`);
            break;
        }
    }

    for (let pattern of keyboardPatterns) {
        if (lower.includes(pattern)) {
            score -= 30;
            feedback.push(`Contains keyboard pattern: ${pattern}`);
            break;
        }
    }

    if (/123|234|345|456|567|678|789/.test(password) ||
        /abc|bcd|cde|def/.test(lower)) {
        score -= 25;
        feedback.push("Contains sequential characters.");
    }

    if (/19\d{2}|20\d{2}/.test(password)) {
        score -= 25;
        feedback.push("Contains a common year.");
    }

    if (/(.)\1\1/.test(password)) {
        score -= 20;
        feedback.push("Contains repeated characters.");
    }

    if (/^[A-Z][a-z0-9!@#$%^&*]+$/.test(password)) {
        score -= 15;
        feedback.push("Capital letter only at the beginning.");
    }

    if (/^[A-Za-z!@#$%^&*]+[0-9]+$/.test(password)) {
        score -= 15;
        feedback.push("Numbers only at the end.");
    }

    if (/^[A-Za-z0-9]+[^A-Za-z0-9]+$/.test(password)) {
        score -= 10;
        feedback.push("Special characters only at the end.");
    }

    if (/^[a-z]+$/.test(password) ||
        /^[A-Z]+$/.test(password) ||
        /^[0-9]+$/.test(password)) {
        score -= 30;
        feedback.push("Uses only one character type.");
    }

    if (
        hasUpper &&
        hasDigit &&
        hasSymbol &&
        !/^[A-Z]/.test(password) &&
        !/[0-9]+$/.test(password)
    ) {
        score += 10;
    }

    if (length >= 12 && varietyCount >= 3) {
        score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return { score, feedback };
}

function getStrength(score) {
    if (score >= 85) return "Strong";
    if (score >= 65) return "Medium";
    if (score >= 40) return "Weak";
    return "Very Weak";
}

function simulateCrackTest(score, timeLimit) {
    let cracked;
    let simulatedTime;
    let guesses;
    let mode;

    if (score < 20) {

        cracked = true;
        simulatedTime = Math.min(0.15, timeLimit);
        guesses = Math.floor(500 + Math.random() * 4500);
        mode = "Smart guessing";

    } else if (score < 40) {

        cracked = true;
        simulatedTime = Math.min(timeLimit * 0.20, timeLimit);
        guesses = Math.floor(5000 + Math.random() * 45000);
        mode = "Smart guessing";

    } else if (score < 60) {

        cracked = true;
        simulatedTime = Math.min(timeLimit * 0.50, timeLimit);
        guesses = Math.floor(50000 + Math.random() * 450000);
        mode = "Pattern attack";

    } else if (score < 80) {

        cracked = false;
        simulatedTime = timeLimit;
        guesses = Math.floor(500000 + Math.random() * 4500000);
        mode = "Timed brute force";

    } else {

        cracked = false;
        simulatedTime = timeLimit;
        guesses = Math.floor(5000000 + Math.random() * 95000000);
        mode = "Timed brute force";
    }

    return {
        cracked,
        time: simulatedTime,
        guesses,
        mode
    };
}

function getSuggestions(feedback, score) {
    const suggestions = [];

    for (let item of feedback) {

        if (item.includes("common word")) {
            suggestions.push("Avoid common words and dictionary terms.");
        }

        if (item.includes("keyboard pattern")) {
            suggestions.push("Avoid keyboard patterns like qwerty or asdf.");
        }

        if (item.includes("sequential")) {
            suggestions.push("Avoid sequences such as 123 or abc.");
        }

        if (item.includes("year")) {
            suggestions.push("Avoid years, birthdays, or dates.");
        }

        if (item.includes("repeated")) {
            suggestions.push("Avoid repeated characters like aaa or 111.");
        }

        if (item.includes("Capital letter only")) {
            suggestions.push("Place uppercase letters in less predictable locations.");
        }

        if (item.includes("Numbers only")) {
            suggestions.push("Mix numbers throughout the password.");
        }

        if (item.includes("Special characters only")) {
            suggestions.push("Place special characters in the middle as well.");
        }

        if (item.includes("one character type")) {
            suggestions.push("Use uppercase, lowercase, numbers, and symbols.");
        }
    }

    if (score < 75) {
        suggestions.push("Increase password length to at least 12 characters.");
    }

    if (suggestions.length === 0) {
        suggestions.push("No major improvements recommended.");
    }

    return [...new Set(suggestions)];
}

function runAnalysis() {
    const password = document.getElementById("password").value;
    const resultsDiv = document.getElementById("results");
    const errorBox = document.getElementById("errorBox");
    const timeLimit = Number(document.getElementById("timeLimit").value) || 2;

    errorBox.style.display = "none";
    errorBox.innerHTML = "";

    if (!password) {
        errorBox.textContent = "Please enter a password.";
        errorBox.style.display = "block";
        resultsDiv.style.display = "none";
        return;
    }

    const validationErrors = validateRequirements(password);

    if (validationErrors.length > 0) {
        errorBox.innerHTML =
            "<strong>Password does not meet the selected requirements:</strong><br><br>" +
            validationErrors.join("<br>");

        errorBox.style.display = "block";
        resultsDiv.style.display = "none";
        return;
    }

    const analysis = analyzePassword(password);
    const crackResult = simulateCrackTest(analysis.score, timeLimit);

    document.getElementById("score").textContent = analysis.score;
    document.getElementById("strength").textContent = getStrength(analysis.score);

    const feedbackList = document.getElementById("feedback");
    feedbackList.innerHTML = "";

    if (analysis.feedback.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No obvious weaknesses detected.";
        feedbackList.appendChild(li);
    } else {
        analysis.feedback.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            feedbackList.appendChild(li);
        });
    }

    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = "";

    const suggestions = getSuggestions(
        analysis.feedback,
        analysis.score
    );

    suggestions.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        suggestionsList.appendChild(li);
    });

    document.getElementById("cracked").textContent = crackResult.cracked ? "Yes" : "No";
    document.getElementById("mode").textContent = crackResult.mode;
    document.getElementById("time").textContent = crackResult.time.toFixed(2);
    document.getElementById("guesses").textContent = crackResult.guesses.toLocaleString();

    let comparison;

    if (crackResult.cracked && analysis.score < 60) {
        comparison = "Weak and cracked quickly.";
    } else if (!crackResult.cracked && analysis.score >= 75) {
        comparison = "Strong and not cracked within the time limit.";
    } else if (!crackResult.cracked) {
        comparison = "Not cracked, but still has weaknesses.";
    } else {
        comparison = "Mixed result. Check weaknesses.";
    }

    document.getElementById("comparison").textContent = comparison;
    resultsDiv.style.display = "block";
}