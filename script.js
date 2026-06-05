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

    if (/(.)\1\1+/.test(password)) {
        score -= 15;
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

    for (let name of commonNames) {
        if (lower.includes(name)) {
            score -= 15;
            feedback.push(`Contains common name: ${name}`);
            break;
        }
    }

    for (let word of englishWords) {
        if (lower.includes(word)) {
            score -= 15;
            feedback.push(`Contains common English word: ${word}`);
            break;
        }
    }

    if (password.length > 2 && password === password.split("").reverse().join("")) {
        score -= 10;
        feedback.push("Password is a palindrome, making it predictable.");
    }

    const uniqueChars = new Set(password).size;
    if (uniqueChars <= 3 && password.length > 5) {
        score -= 20;
        feedback.push("Uses very few unique characters.");
    }

    if (/[a-z]+(19|20)\d{2}/i.test(password)) {
        score -= 15;
        feedback.push("Uses a common base word with a year appended.");
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

    if (length >= 16 && varietyCount >= 3) {
        score += 20;
    }

    if (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(password) && length >= 16) {
        score += 15;
    }

    const looksRandomSegmented =
        /^[a-z0-9]+(-[a-z0-9]+)+$/i.test(password);

    const segmentParts = password.split("-");

    const hasEnoughSegments = segmentParts.length >= 4;
    const segmentsAreReasonable = segmentParts.every(part => part.length >= 3);
    const hasMixedSegmentContent = segmentParts.some(part => /[0-9]/.test(part)) &&
                                segmentParts.some(part => /[a-z]/i.test(part));

    if (
        looksRandomSegmented &&
        password.length >= 16 &&
        hasEnoughSegments &&
        segmentsAreReasonable &&
        hasMixedSegmentContent
    ) {
        score += 20;
    }

    if (score > 85 && feedback.length >= 1) {
        score -= 10;
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

function generateVariations(word) {
    const results = new Set();
    results.add(word);
    results.add(word.charAt(0).toUpperCase() + word.slice(1));
    results.add(word.toUpperCase());
    const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    for (const d of digits) {
        results.add(word + d);
        results.add(d + word);
    }
    results.add(word.replace(/a/g, "@"));
    results.add(word.replace(/a/g, "4"));
    results.add(word.replace(/e/g, "3"));
    results.add(word.replace(/i/g, "1"));
    results.add(word.replace(/l/g, "1"));
    results.add(word.replace(/o/g, "0"));
    results.add(word.replace(/s/g, "$"));
    results.add(word.replace(/s/g, "5"));
    results.add(word.replace(/t/g, "7"));
    return results;
}

function tryBruteForce(password, charset, maxLen, startTime, timeLimitMs, state) {
    const cl = charset.length;
    let checkCounter = 0;
    for (let len = 1; len <= maxLen; len++) {
        const total = Math.pow(cl, len);
        for (let i = 0; i < total; i++) {
            let candidate = "";
            let n = i;
            for (let j = 0; j < len; j++) {
                candidate = charset[n % cl] + candidate;
                n = Math.floor(n / cl);
            }
            state.guesses++;
            if (candidate === password) {
                return true;
            }
            checkCounter++;
            if (checkCounter >= 10000) {
                if (Date.now() - startTime >= timeLimitMs) return false;
                checkCounter = 0;
            }
        }
    }
    return false;
}

function crackTest(password, timeLimitSeconds) {
    const timeLimitMs = timeLimitSeconds * 1000;
    const startTime = Date.now();
    const state = { guesses: 0 };

    const elapsed = () => (Date.now() - startTime) / 1000;
    const hasTime = () => (Date.now() - startTime) < timeLimitMs;

    // Phase 1: Dictionary attack with variations
    for (const word of [...commonWords, ...keyboardPatterns, ...commonPasswords]) {
        if (!hasTime()) break;
        const wordLower = word.toLowerCase();
        for (const variant of generateVariations(wordLower)) {
            if (!hasTime()) break;
            state.guesses++;
            if (variant === password) {
                return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Smart guessing" };
            }
        }
    }

    // Phase 2: Repeated-character patterns (e.g. aaa, 111, aaaaa)
    for (let len = 3; len <= 8; len++) {
        if (!hasTime()) break;
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (let ci = 0; ci < chars.length; ci++) {
            if (!hasTime()) break;
            state.guesses++;
            if (chars[ci].repeat(len) === password) {
                return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Pattern attack" };
            }
        }
    }

    // Phase 3: Sequential patterns (e.g. abcdef, 123456)
    for (let start = 0; start < 23; start++) {
        if (!hasTime()) break;
        for (let len = 3; len <= Math.min(8, 26 - start); len++) {
            if (!hasTime()) break;
            const seq = "abcdefghijklmnopqrstuvwxyz".slice(start, start + len);
            state.guesses++;
            if (seq === password) {
                return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Pattern attack" };
            }
            const numSeq = "0123456789".slice(start, start + len);
            state.guesses++;
            if (numSeq === password) {
                return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Pattern attack" };
            }
        }
    }

    // Phase 4: Brute-force with limited character sets and lengths
    // Strategy: try smaller charsets first, then expand, prioritizing shorter lengths
    const fullCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:',.<>?/~`";
    const bruteForcePhases = [
        { charset: "abcdefghijklmnopqrstuvwxyz", maxLen: 4 },
        { charset: "abcdefghijklmnopqrstuvwxyz0123456789", maxLen: 4 },
        { charset: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", maxLen: 3 },
        { charset: "abcdefghijklmnopqrstuvwxyz", maxLen: 5 },
        { charset: "abcdefghijklmnopqrstuvwxyz0123456789", maxLen: 5 },
        { charset: fullCharset, maxLen: 4 },
        { charset: "abcdefghijklmnopqrstuvwxyz", maxLen: 6 },
        { charset: "abcdefghijklmnopqrstuvwxyz0123456789", maxLen: 6 },
    ];

    for (const phase of bruteForcePhases) {
        if (!hasTime()) break;
        const found = tryBruteForce(password, phase.charset, phase.maxLen, startTime, timeLimitMs, state);
        if (found) {
            return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Brute force" };
        }
    }

    // Phase 5: Continuous fallback - keep trying with full charset at increasing
    // lengths until the time limit expires
    for (let len = 5; hasTime(); len++) {
        const found = tryBruteForce(password, fullCharset, len, startTime, timeLimitMs, state);
        if (found) {
            return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Brute force" };
        }
    }

    // Not cracked within time limit
    return {
        cracked: false,
        time: elapsed(),
        guesses: state.guesses,
        mode: "Timed brute force"
    };
}

function getSuggestions(feedback, score) {
    const suggestions = [];

    for (let item of feedback) {

        if (item.includes("common word") || item.includes("common password")) {
            suggestions.push(
                "Avoid common words and dictionary terms. Attackers use rainbow tables and dictionary attacks as their first strategy - they can test millions of common passwords per second. Even common words with a number tacked on the end (like \"password123\") are instantly checked. Instead, use a random passphrase of 4+ unrelated words (e.g., \"correct-horse-battery-staple\") or a randomly generated string."
            );
        }

        if (item.includes("common name")) {
            suggestions.push(
                "Avoid using names (your own, family, pets, or common names). Attackers build custom dictionaries with personal information from social media. Names are among the first guesses in any targeted attack. Use phrases that have no connection to you personally."
            );
        }

        if (item.includes("common English word")) {
            suggestions.push(
                "Avoid using common English words even if they seem strong. Attackers use dictionaries of hundreds of thousands of words. A single word is always weak - it takes trivial effort to try every word in the English language. Combine multiple unrelated words into a passphrase instead."
            );
        }

        if (item.includes("keyboard pattern")) {
            suggestions.push(
                "Avoid keyboard patterns like qwerty, asdf, or 1qaz2wsx. These are the first patterns automated tools check because they're extremely common and visually obvious. Even if you offset the pattern or add characters, pattern-based password crackers will find it. Use random character sequences instead."
            );
        }

        if (item.includes("sequential")) {
            suggestions.push(
                "Avoid sequential characters like \"123\", \"abc\", or \"987\". Sequential runs are some of the most common patterns found in breached password databases. Even partial sequences (like \"abc123\") are checked early in brute-force attempts. Break up sequences with unrelated characters."
            );
        }

        if (item.includes("year")) {
            suggestions.push(
                "Avoid years, birthdays, and dates. Birth years and common years (1984, 2000, 2024) are among the most commonly used password suffixes. Attackers always add recent decades to their guessing lists. If you need a number, use a non-date value with no personal significance."
            );
        }

        if (item.includes("repeated")) {
            suggestions.push(
                "Avoid repeated characters like \"aaa\", \"111\", or \"!!!!\". Repetition dramatically reduces the effective search space - an attacker only needs to guess one character plus the length, rather than every combination. No random password generator would produce repeated characters by design."
            );
        }

        if (item.includes("Capital letter only")) {
            suggestions.push(
                "Place uppercase letters in less predictable locations. Passwords with a single capital letter at the start (like \"Password\") follow the most common capitalization pattern, so it's the first variant attackers try. Use uppercase unpredictably - middle of words, separated by other character types."
            );
        }

        if (item.includes("Numbers only")) {
            suggestions.push(
                "Mix numbers throughout the password, not just at the end. Putting all digits as a suffix (like \"...123\") is the second most common pattern after all-lowercase. Attackers check this pattern early in their cracking attempts. Distribute numbers randomly between letters and symbols."
            );
        }

        if (item.includes("Special characters only")) {
            suggestions.push(
                "Place special characters throughout the password instead of appending them at the end. A common trick is a predictable symbol at the end (\"...!\"), which adds almost no real security. Weave symbols between other character types: for example, \"p@ssw!rd\" is stronger than \"password!\"."
            );
        }

        if (item.includes("one character type")) {
            suggestions.push(
                "Use a mix of uppercase, lowercase, numbers, and symbols. A password using only one character type (like all lowercase) is vulnerable to brute-force with that character set alone. Adding types exponentially increases the search space. With all four types, an 8-character password has 62^8 ≈ 218 trillion combinations versus 26^8 ≈ 208 billion with lowercase only - over 1000x harder."
            );
        }

        if (item.includes("palindrome")) {
            suggestions.push(
                "Avoid palindromic passwords. A palindrome reads the same forwards and backwards, which means half the characters are fully predictable from the other half. This cuts the effective keyspace nearly in half. No random generation produces a palindrome by chance - it is always a deliberate choice."
            );
        }

        if (item.includes("few unique characters")) {
            suggestions.push(
                "Use a wider variety of distinct characters. A password that repeats the same few characters (like \"a1a1a1a1\" or \"abababab\") creates strong patterns that compression-based and rule-based crackers exploit. Aim for at least 6-8 unique characters in any password over 8 characters long."
            );
        }

        if (item.includes("base word with a year")) {
            suggestions.push(
                "Avoid appending a year to a base word (e.g., \"summer2024\"). This is one of the most common password patterns leaked from breaches. Attackers build rules that specifically try every dictionary word with every recent year appended. Use unrelated chunks instead: \"correct-horse-battery-staple\" not \"summer2024\"."
            );
        }
    }

    const passwordLength = document.getElementById("password").value.length;

    if (score < 75 && passwordLength < 12) {
        suggestions.push(
            "Increase password length to at least 12 characters. Length is the single most important factor in password strength - each additional character exponentially multiplies the number of possible combinations. A 12-character password with mixed types has roughly 62^12 ≈ 3.2 × 10^21 possibilities. Every extra character adds years to brute-force time at current hardware speeds."
        );
    }

    if (suggestions.length === 0) {
        suggestions.push(
            "Your password shows no major structural weaknesses. To maintain strong security, ensure you are not reusing this password across multiple sites, enable two-factor authentication where available, and consider using a password manager to generate and store unique passwords for every account."
        );
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
    const crackResult = crackTest(password, timeLimit);

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
    const crackedDetail = crackResult.cracked
        ? `Cracked in ${crackResult.time.toFixed(2)}s via ${crackResult.mode.toLowerCase()} with ${crackResult.guesses.toLocaleString()} guesses.`
        : `Resisted cracking for ${crackResult.time.toFixed(2)}s (${crackResult.guesses.toLocaleString()} guesses attempted via ${crackResult.mode.toLowerCase()}).`;

    if (crackResult.cracked && analysis.score < 40) {
        comparison = `Very weak password. ${crackedDetail} The analytical score confirms it has minimal resistance to any attack method.`;
    } else if (crackResult.cracked && analysis.score < 65) {
        comparison = `Weak password. ${crackedDetail} The analytical score indicates structural weaknesses that made it an easy target.`;
    } else if (crackResult.cracked) {
        comparison = `Moderate password. ${crackedDetail} Despite a decent analytical score, the cracking engine found it within the time limit. Consider the weaknesses above.`;
    } else if (!crackResult.cracked && analysis.score >= 85) {
        comparison = `Strong password. ${crackedDetail} The analytical score is excellent and it withstood the time-bounded brute-force attempt. Good password practices in use.`;
    } else if (!crackResult.cracked && analysis.score >= 65) {
        comparison = `Moderately strong password. ${crackedDetail} It resisted cracking within the time limit, but the analytical score shows room for improvement - address the weaknesses listed above to strengthen it further.`;
    } else {
        comparison = `Mixed result. ${crackedDetail} The password resisted cracking, but the analytical score reveals clear structural issues. Fix the weaknesses above before relying on this password.`;
    }

    document.getElementById("comparison").textContent = comparison;
    resultsDiv.style.display = "block";
}