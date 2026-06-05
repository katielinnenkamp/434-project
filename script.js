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
    const feedback = [];
    const breakdown = { length: 0, variety: 0, structure: 0, deductions: 0, bonuses: 0 };

    const length = password.length;
    const lower = password.toLowerCase();

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const types = [hasLower, hasUpper, hasDigit, hasSymbol];
    const typeCount = types.filter(Boolean).length;

    const uniqueChars = new Set(password);
    const uniqueCount = uniqueChars.size;

    // --- Length score (0-25): graduated with diminishing returns ---
    if (length <= 4) {
        breakdown.length = length * 1.5;
    } else if (length <= 8) {
        breakdown.length = 6 + (length - 4) * 2;
    } else if (length <= 12) {
        breakdown.length = 14 + (length - 8) * 1.5;
    } else if (length <= 16) {
        breakdown.length = 20 + (length - 12) * 1;
    } else {
        breakdown.length = 24 + Math.min((length - 16) * 0.25, 1);
    }

    // --- Variety score (0-20): scaled by number of types used ---
    const varietyScores = [0, 4, 8, 14, 20];
    breakdown.variety = varietyScores[Math.min(typeCount, 4)];

    // --- Structure quality score (0-10) ---
    // Measures interleaving and even distribution of character types
    const typeRuns = [];
    for (let i = 0; i < length; i++) {
        const ch = password[i];
        let t;
        if (/[a-z]/.test(ch)) t = "l";
        else if (/[A-Z]/.test(ch)) t = "u";
        else if (/[0-9]/.test(ch)) t = "d";
        else t = "s";
        if (typeRuns.length === 0 || typeRuns[typeRuns.length - 1].type !== t) {
            typeRuns.push({ type: t, count: 1 });
        } else {
            typeRuns[typeRuns.length - 1].count++;
        }
    }

    const runCount = typeRuns.length;
    if (runCount >= length * 0.6) breakdown.structure += 4;
    else if (runCount >= length * 0.4) breakdown.structure += 2;

    const typeDistribution = { l: 0, u: 0, d: 0, s: 0 };
    for (const run of typeRuns) typeDistribution[run.type] += run.count;
    const dominantRatio = Math.max(...Object.values(typeDistribution)) / length;
    if (dominantRatio < 0.5) breakdown.structure += 3;
    else if (dominantRatio < 0.7) breakdown.structure += 1;

    const charRuns = [];
    for (let i = 0; i < length; i++) {
        if (charRuns.length === 0 || charRuns[charRuns.length - 1].char !== password[i]) {
            charRuns.push({ char: password[i], count: 1 });
        } else {
            charRuns[charRuns.length - 1].count++;
        }
    }
    const maxCharRun = Math.max(...charRuns.map(r => r.count));
    if (maxCharRun <= 2) breakdown.structure += 3;
    else if (maxCharRun <= 3) breakdown.structure += 1;

    // --- Deductions ---

    // Common word exact match -> score 0
    for (const word of commonWords) {
        if (lower === word) {
            feedback.push("This is a very common password.");
            breakdown.deductions = 50;
            return { score: 0, feedback, breakdown };
        }
    }

    // Common word substring (penalty scales with matched word length)
    for (const word of commonWords) {
        if (lower.includes(word)) {
            const penalty = Math.min(15 + word.length * 2, 35);
            breakdown.deductions += penalty;
            feedback.push(`Contains common word: ${word}`);
            break;
        }
    }

    // Keyboard pattern (penalty scales with pattern length)
    for (const pattern of keyboardPatterns) {
        if (lower.includes(pattern)) {
            const penalty = Math.min(8 + pattern.length * 2, 20);
            breakdown.deductions += penalty;
            feedback.push(`Contains keyboard pattern: ${pattern}`);
            break;
        }
    }

    // Sequential characters (forward and reverse)
    if (/(?:123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password) ||
        /(?:987|876|765|654|543|432|321|210)/.test(password)) {
        breakdown.deductions += 20;
        feedback.push("Contains sequential characters.");
    }

    // Common year
    if (/19\d{2}|20\d{2}/.test(password)) {
        breakdown.deductions += 15;
        feedback.push("Contains a common year.");
    }

    // Repeated characters (scaled by total repeated length)
    const repeatMatches = password.match(/(.)\1{2,}/g);
    if (repeatMatches) {
        const totalRepeated = repeatMatches.reduce((s, m) => s + m.length, 0);
        breakdown.deductions += totalRepeated >= 5 ? 20 : 12;
        feedback.push("Contains repeated characters.");
    }

    // Capital only at beginning
    if (/^[A-Z][^A-Z]*$/.test(password) && /[a-z]/.test(password)) {
        breakdown.deductions += 10;
        feedback.push("Capital letter only at the beginning.");
    }

    // Numbers only at end
    if (/^[^0-9]+[0-9]+$/.test(password) && hasDigit) {
        breakdown.deductions += 10;
        feedback.push("Numbers only at the end.");
    }

    // Special characters only at end
    if (/^[^!@#$%^&*()\-_=+\[\]{}|;:',.<>?\/~`]+[!@#$%^&*()\-_=+\[\]{}|;:',.<>?\/~`]+$/.test(password) && hasSymbol) {
        breakdown.deductions += 8;
        feedback.push("Special characters only at the end.");
    }

    // Single character type
    if (typeCount === 1) {
        const isDigitOnly = /^[0-9]+$/.test(password);
        breakdown.deductions += isDigitOnly ? 30 : 25;
        feedback.push("Uses only one character type.");
    }

    // Common name
    for (const name of commonNames) {
        if (lower.includes(name)) {
            breakdown.deductions += 12;
            feedback.push(`Contains common name: ${name}`);
            break;
        }
    }

    // Common English word (only words >= 4 chars to avoid noise)
    for (const word of englishWords) {
        if (word.length >= 4 && lower.includes(word)) {
            breakdown.deductions += 12;
            feedback.push(`Contains common English word: ${word}`);
            break;
        }
    }

    // Palindrome
    if (length > 2 && password === password.split("").reverse().join("")) {
        breakdown.deductions += 8;
        feedback.push("Password is a palindrome, making it predictable.");
    }

    // Low unique character count
    if (uniqueCount <= 3 && length > 5) {
        breakdown.deductions += 15;
        feedback.push("Uses very few unique characters.");
    }

    // Base word + year
    if (/[a-zA-Z]+(?:19|20)\d{2}/.test(password)) {
        breakdown.deductions += 15;
        feedback.push("Uses a common base word with a year appended.");
    }

    // --- Bonuses ---

    // Long + well-mixed
    if (length >= 12 && typeCount >= 3) breakdown.bonuses += 8;
    if (length >= 16 && typeCount >= 3) breakdown.bonuses += 10;

    // Passphrase structure (4+ segments separated by delimiters)
    if (/^[a-z0-9]+(?:[-_][a-z0-9]+){3,}$/i.test(password) && length >= 16) {
        const segments = password.split(/[-_]/);
        const hasMixed = segments.some(s => /[0-9]/.test(s)) &&
                        segments.some(s => /[a-z]/i.test(s));
        const allValid = segments.every(s => s.length >= 3);
        if (hasMixed && allValid) breakdown.bonuses += 12;
    }

    // True randomness bonus: all 4 types, well-interleaved, high unique ratio
    if (typeCount === 4 && length >= 8) {
        const uniqueRatio = uniqueCount / length;
        const wellInterleaved = runCount >= length * 0.5;
        const noCharRepeats = maxCharRun <= 2;
        const highUniqueRatio = uniqueRatio >= 0.6;
        let randomBonus = 0;
        if (wellInterleaved) randomBonus += 8;
        if (noCharRepeats) randomBonus += 7;
        if (highUniqueRatio) randomBonus += 5;
        if (length >= 12) randomBonus += 5;
        if (length >= 16) randomBonus += 5;
        breakdown.bonuses += randomBonus;
    }

    // No weaknesses flagged at all
    if (feedback.length === 0) breakdown.bonuses += 5;

    // --- Calculate final score ---
    let score = breakdown.length + breakdown.variety + breakdown.structure
              - breakdown.deductions + breakdown.bonuses;

    // Moderation: if score is high but issues exist, shave off some excess
    if (score > 85 && feedback.length >= 1) {
        score -= Math.min(score - 85, 10);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    return { score, feedback, breakdown };
}

function getStrength(score) {
    if (score >= 85) return "Strong";
    if (score >= 70) return "Good";
    if (score >= 55) return "Average";
    if (score >= 40) return "Below Average";
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

function yieldToUI() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

async function tryBruteForce(password, charset, maxLen, startTime, timeLimitMs, state) {
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
                await yieldToUI();
            }
        }
    }
    return false;
}

async function crackTest(password, timeLimitSeconds) {
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
        const found = await tryBruteForce(password, phase.charset, phase.maxLen, startTime, timeLimitMs, state);
        if (found) {
            return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Brute force" };
        }
    }

    // Phase 5: Continuous fallback
    for (let len = 5; hasTime(); len++) {
        const found = await tryBruteForce(password, fullCharset, len, startTime, timeLimitMs, state);
        if (found) {
            return { cracked: true, time: elapsed(), guesses: state.guesses, mode: "Brute force" };
        }
    }

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

let isAnalyzing = false;

function runAnalysis() {
    const password = document.getElementById("password").value;
    const resultsDiv = document.getElementById("results");
    const errorBox = document.getElementById("errorBox");
    const timeLimit = Number(document.getElementById("timeLimit").value) || 2;
    const btn = document.getElementById("analyzeBtn");

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

    if (isAnalyzing) return;
    isAnalyzing = true;

    btn.disabled = true;
    let dotCount = 0;
    let animating = true;

    function animateDots() {
        if (!animating) return;
        dotCount = (dotCount % 3) + 1;
        btn.textContent = "Running" + ".".repeat(dotCount);
        setTimeout(animateDots, 180);
    }

    function doneAndReset() {
        btn.textContent = "Done";
        setTimeout(() => {
            btn.textContent = "Run Analysis";
            btn.disabled = false;
            isAnalyzing = false;
        }, 1000);
    }

    async function runWork() {
        const analysis = analyzePassword(password);
        const crackResult = await crackTest(password, timeLimit);

        document.getElementById("score").textContent = analysis.score;
        document.getElementById("strength").textContent = getStrength(analysis.score);

        if (analysis.breakdown) {
            document.getElementById("bd-length").textContent = Math.round(analysis.breakdown.length);
            document.getElementById("bd-variety").textContent = Math.round(analysis.breakdown.variety);
            document.getElementById("bd-structure").textContent = Math.round(analysis.breakdown.structure);
            document.getElementById("bd-deductions").textContent = `-${analysis.breakdown.deductions}`;
            document.getElementById("bd-bonuses").textContent = `+${analysis.breakdown.bonuses}`;
            document.getElementById("bd-score").textContent = analysis.score;
        }

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
        } else if (crackResult.cracked && analysis.score < 55) {
            comparison = `Weak password. ${crackedDetail} The analytical score indicates structural weaknesses that made it an easy target.`;
        } else if (crackResult.cracked && analysis.score < 70) {
            comparison = `Below average password. ${crackedDetail} Despite a moderate analytical score, the cracking engine found it within the time limit. Address the weaknesses above.`;
        } else if (crackResult.cracked) {
            comparison = `Average password. ${crackedDetail} It was cracked despite a decent score - likely a dictionary word or pattern that automated tools check early.`;
        } else if (!crackResult.cracked && analysis.score >= 85) {
            comparison = `Strong password. ${crackedDetail} The analytical score is excellent and it withstood the time-bounded brute-force attempt. Good password practices in use.`;
        } else if (!crackResult.cracked && analysis.score >= 70) {
            comparison = `Good password. ${crackedDetail} It resisted cracking within the time limit, though minor improvements could still help. Check the suggestions above.`;
        } else if (!crackResult.cracked && analysis.score >= 55) {
            comparison = `Average password. ${crackedDetail} It resisted cracking, but the analytical score shows clear room for improvement - address the weaknesses listed above.`;
        } else {
            comparison = `Weak but not cracked. ${crackedDetail} The password survived the time limit but the analytical score reveals serious structural issues. Do not rely on this password.`;
        }

        document.getElementById("comparison").textContent = comparison;
        resultsDiv.style.display = "block";

        animating = false;
        doneAndReset();
    }

    animateDots();
    runWork();
}