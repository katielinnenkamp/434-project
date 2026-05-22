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

function analyzePassword(password) {
    let score = 0;
    let feedback = [];

    const length = password.length;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    score += Math.min(length * 4, 40);

    const varietyCount = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
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
        hasLower &&
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

    if (score < 30) {
        cracked = true;
        simulatedTime = Math.min(0.25, timeLimit);
        guesses = Math.floor(25000 * simulatedTime);
        mode = "Smart guessing";
    } else if (score < 50) {
        cracked = true;
        simulatedTime = Math.min(timeLimit * 0.45, timeLimit);
        guesses = Math.floor(90000 * simulatedTime);
        mode = "Smart guessing";
    } else if (score < 70) {
        cracked = timeLimit >= 3;
        simulatedTime = cracked ? Math.min(timeLimit * 0.85, timeLimit) : timeLimit;
        guesses = Math.floor(250000 * simulatedTime);
        mode = cracked ? "Smart guessing" : "Timed brute force";
    } else {
        cracked = false;
        simulatedTime = timeLimit;
        guesses = Math.floor(800000 * simulatedTime);
        mode = "Timed brute force";
    }

    return {
        cracked,
        time: simulatedTime,
        guesses,
        mode
    };
}

function runAnalysis() {
    const password = document.getElementById("password").value;
    const resultsDiv = document.getElementById("results");
    const timeLimit = Number(document.getElementById("timeLimit").value) || 2;

    if (!password) {
        alert("Enter a password.");
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