
/* =========================================
   MONEYVERSE - COMPLETE JAVASCRIPT
   Crimson Future Edition
========================================= */

// 1. DATA AND STORAGE

const STORAGE_KEY = "moneyverse_save_v1";

const defaultData = {
    balance: 500,
    xp: 0,
    transactions: [],
    goals: [],
    requests: [],
    completedMissions: []
};

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            balance: Number.isFinite(Number(parsed.balance))
                ? Number(parsed.balance)
                : defaultData.balance,

            xp: Number.isFinite(Number(parsed.xp))
                ? Number(parsed.xp)
                : 0,

            transactions: Array.isArray(parsed.transactions)
                ? parsed.transactions
                : [],

            goals: Array.isArray(parsed.goals)
                ? parsed.goals
                : [],

            requests: Array.isArray(parsed.requests)
                ? parsed.requests
                : [],

            completedMissions: Array.isArray(parsed.completedMissions)
                ? parsed.completedMissions
                : []
        };
    } catch (error) {
        console.error("MoneyVerse loading error:", error);
        return structuredClone(defaultData);
    }
}

let data = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("MoneyVerse saving error:", error);
        showToast("Unable to save your data!", "error");
        return false;
    }
}


// 2. HELPER FUNCTIONS

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = "toast";

    if (type === "error") {
        notification.classList.add("error");
    }

    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

function addXP(amount) {
    const oldLevel = levelNumber();

    data.xp += amount;
    saveData();

    const newLevel = levelNumber();

    if (newLevel > oldLevel) {
        showLevelUp(newLevel);
    }

    showToast("⭐ You earned " + amount + " XP!");
}

function levelNumber() {
    return Math.floor(data.xp / 100) + 1;
}


// 3. MISSIONS

const missions = [
    {
        id: "first-expense",
        title: "The Money Detective",
        description: "Record your first expense.",
        reward: 30,
        icon: "🔎",
        check: () => data.transactions.some(t => t.type === "expense")
    },
    {
        id: "first-goal",
        title: "Dream Builder",
        description: "Create your first savings goal.",
        reward: 40,
        icon: "🎯",
        check: () => data.goals.length > 0
    },
    {
        id: "save-100",
        title: "Little Saver",
        description: "Save at least ₹100 towards a goal.",
        reward: 50,
        icon: "💰",
        check: () => data.goals.some(g => Number(g.saved) >= 100)
    },
    {
        id: "three-expenses",
        title: "Spending Expert",
        description: "Record three expenses.",
        reward: 40,
        icon: "📊",
        check: () => data.transactions.filter(t => t.type === "expense").length >= 3
    },
    {
        id: "parent-request",
        title: "Think Before You Buy",
        description: "Create a purchase request.",
        reward: 30,
        icon: "👨‍👩‍👧",
        check: () => data.requests.length > 0
    }
];


// 4. NAVIGATION

const titles = {
    dashboard: "Welcome to MoneyVerse!",
    wallet: "Your virtual wallet",
    detective: "Investigate your spending",
    dreams: "Build your dreams",
    ripple: "Your decisions matter",
    family: "The Family Decision Room",
    missions: "Complete your missions"
};

function showPage(pageName) {
    const page = document.getElementById(pageName);
    if (!page) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const title = document.getElementById("page-title");
    if (title) {
        title.textContent = titles[pageName] || "MoneyVerse";
    }

    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
    const navigationButton = event.target.closest("[data-page], [data-go]");
    if (!navigationButton) return;

    showPage(
        navigationButton.dataset.page ||
        navigationButton.dataset.go
    );
});


// 5. WALLET

function addTransaction(type, name, amount, category) {
    data.transactions.unshift({
        id: Date.now() + Math.random(),
        type,
        name,
        amount,
        category,
        date: new Date().toLocaleDateString("en-IN")
    });
}

document.getElementById("income-form").addEventListener("submit", event => {
    event.preventDefault();

    const amount = Number(document.getElementById("income-amount").value);
    const source = document.getElementById("income-source").value.trim();

    if (!source || !Number.isSafeInteger(amount) || amount <= 0 || amount > 100000) {
        showToast("Please enter a valid amount and source.", "error");
        return;
    }

    data.balance += amount;
    addTransaction("income", source, amount, "Income");

    addXP(10);
    saveData();

    event.target.reset();
    renderAll();

    showToast("Your pocket money has been added!");
});

document.getElementById("expense-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("expense-name").value.trim();
    const amount = Number(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;

    if (!name || !Number.isSafeInteger(amount) || amount <= 0 || amount > 100000) {
        showToast("Enter a valid expense.", "error");
        return;
    }

    if (amount > data.balance) {
        showToast("Not enough virtual money in your wallet!", "error");
        return;
    }

    data.balance -= amount;
    addTransaction("expense", name, amount, category);

    addXP(10);
    saveData();

    event.target.reset();
    renderAll();

    showToast("Expense recorded successfully!");
});

function renderWallet() {
    const balance = money(data.balance);

    ["top-balance", "wallet-balance", "dash-balance"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = balance;
    });
}


// 6. TRANSACTION HISTORY

function renderTransactions() {
    const container = document.getElementById("transactions");
    if (!container) return;

    if (!data.transactions.length) {
        container.innerHTML = `
            <div class="empty-goals">
                <div class="empty-goals-icon">🏙️</div>
                <h2>Your Spend City is quiet!</h2>
                <p>No transactions recorded yet.</p>
                <p>Add your first transaction to start tracking where your money goes.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = data.transactions.map((t, index) => `
        <div class="transaction">
            <div>
                <strong>${escapeHTML(t.name)}</strong>
                <p>${escapeHTML(t.category)} · ${escapeHTML(t.date)}</p>
            </div>

            <span class="${t.type === "income" ? "positive" : "negative"}">
                ${t.type === "income" ? "+" : "-"}${money(t.amount)}
            </span>

            <button class="delete-btn" data-delete-transaction="${index}">
                Delete
            </button>
        </div>
    `).join("");
}

document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-transaction]");
    if (!button) return;

    const index = Number(button.dataset.deleteTransaction);
    const transaction = data.transactions[index];

    if (!transaction) return;

    if (!confirm("Are you sure you want to delete this transaction?")) return;

    // Reverse the wallet effect.
    if (transaction.type === "income") {
        data.balance -= transaction.amount;
    } else if (transaction.type === "expense") {
        data.balance += transaction.amount;
    }

    data.transactions.splice(index, 1);

    saveData();
    renderAll();

    showToast("Transaction deleted and wallet updated!");
});


// 7. MONEY DETECTIVE

const categorySymbols = {
    Food: "🍔",
    Stationery: "📚",
    Toys: "🧸",
    Transport: "🚌",
    Entertainment: "🎮",
    Other: "📦"
};

const realityItems = {
    Food: { item: "samosas", price: 20 },
    Stationery: { item: "notebooks", price: 50 },
    Toys: { item: "toy cars", price: 100 },
    Transport: { item: "bus rides", price: 10 },
    Entertainment: { item: "game tokens", price: 20 },
    Other: { item: "₹10 treats", price: 10 }
};

function renderDetective() {
    const expenses = data.transactions.filter(
        t => t.type === "expense" && t.category !== "Savings"
    );

    const total = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSaved = data.goals.reduce(
        (sum, goal) => sum + Number(goal.saved || 0),
        0
    );

    const categories = {};

    expenses.forEach(t => {
        categories[t.category] =
            (categories[t.category] || 0) + Number(t.amount || 0);
    });

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);

    document.getElementById("detective-total").textContent = money(total);
    document.getElementById("detective-saved").textContent = money(totalSaved);
    document.getElementById("detective-count").textContent = expenses.length;

    document.getElementById("detective-biggest").textContent =
        sorted.length ? sorted[0][0] : "None";

    const chart = document.getElementById("spending-chart");

    if (!sorted.length || total <= 0) {
        chart.innerHTML = '<p class="empty">Your spending chart will appear here once you record expenses.</p>';
    } else {
        chart.innerHTML = sorted.map(([category, amount]) => {
            const percentage = amount / total * 100;

            return `
                <div class="chart-row">
                    <div class="chart-info">
                        <strong>${categorySymbols[category] || "📦"} ${escapeHTML(category)}</strong>
                        <span>${money(amount)} · ${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="chart-track">
                        <div class="chart-fill" style="width:${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    const insight = document.getElementById("spending-insight");

    if (!sorted.length) {
        insight.textContent = "Start recording expenses to discover your spending habits!";
    } else {
        const biggestCategory = sorted[0][0];
        const biggestAmount = sorted[0][1];
        const percentage = biggestAmount / total * 100;

        const advice = percentage >= 50
            ? "More than half your spending is going into this category. Think about whether you can balance your spending."
            : "Your spending is spread across different categories. Keep tracking it to understand your habits.";

        insight.textContent =
            "🔎 Your biggest spending category is " + biggestCategory +
            ". You spent " + money(biggestAmount) +
            " here (" + percentage.toFixed(1) +
            "% of your total spending). " + advice +
            " Before your next purchase, ask yourself: Is this a need or a want?";
    }

    const reality = document.getElementById("reality-result");

    if (!sorted.length) {
        reality.innerHTML = '<p class="empty">Your real-world spending comparisons will appear here.</p>';
    } else {
        reality.innerHTML = sorted.map(([category, amount]) => {
            const item = realityItems[category] || realityItems.Other;
            const quantity = Math.floor(amount / item.price);

            return `
                <div class="transaction">
                    <div>
                        <strong>${categorySymbols[category] || "📦"} ${escapeHTML(category)}</strong>
                        <p>Could buy approximately ${quantity} ${item.item}</p>
                    </div>
                    <strong>${money(amount)}</strong>
                </div>
            `;
        }).join("");
    }
}


// 8. DREAM BUILDER

document.getElementById("goal-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("goal-name").value.trim();
    const target = Number(document.getElementById("goal-target").value);
    const saved = Number(document.getElementById("goal-current").value);
    const category = document.getElementById("goal-category").value;

    if (
        !name ||
        !Number.isSafeInteger(target) ||
        !Number.isSafeInteger(saved) ||
        target <= 0 ||
        target > 1000000 ||
        saved < 0 ||
        saved > target
    ) {
        showToast("Please enter valid goal details.", "error");
        return;
    }

    data.goals.push({
        id: Date.now() + Math.random(),
        name,
        target,
        saved,
        category
    });

    saveData();
    addXP(20);

    event.target.reset();
    document.getElementById("goal-current").value = 0;

    renderAll();
    showToast("Your new dream has been created!");
});

function renderGoals() {
    const container = document.getElementById("goals-list");

    if (!data.goals.length) {
        container.innerHTML = `
            <div class="empty-goals">
                <div class="empty-goals-icon">🏝️</div>
                <h2>Your Dream Island awaits!</h2>
                <p>You haven't created any savings goals yet.</p>
                <p>Start saving virtual money and turn your dreams into achievements!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = data.goals.map(goal => {
        const percentage = Math.min(100, goal.saved / goal.target * 100);
        const remaining = Math.max(0, goal.target - goal.saved);

        return `
            <div class="goal-card">
                <div class="goal-top">
                    <div>
                        <h3>🏆 ${escapeHTML(goal.name)}</h3>
                        <p class="goal-category">${escapeHTML(goal.category || "Other")}</p>
                        <p>${money(goal.saved)} saved out of ${money(goal.target)}</p>
                    </div>

                    <div class="goal-ring" style="--progress:${percentage}%">
                        <div class="goal-ring-inner">
                            <span>${percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <p>${remaining === 0 ? "🎉 Goal completed!" : money(remaining) + " left to reach your dream."}</p>

                <div class="goal-actions">
                    <button class="small-btn" data-save-goal="${goal.id}" ${remaining === 0 ? "disabled" : ""}>
                        + Save money
                    </button>

                    <button class="small-btn delete-btn" data-delete-goal="${goal.id}">
                        Delete goal
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

document.addEventListener("click", event => {
    const saveButton = event.target.closest("[data-save-goal]");
    const deleteButton = event.target.closest("[data-delete-goal]");

    if (saveButton) {
        const goal = data.goals.find(
            g => String(g.id) === saveButton.dataset.saveGoal
        );

        if (!goal) return;

        const remaining = goal.target - goal.saved;

        const amountText = prompt(
            "How much virtual money would you like to save towards " +
            goal.name + "?\nAvailable balance: " + money(data.balance)
        );

        if (amountText === null || amountText.trim() === "") return;

        const amount = Number(amountText);

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            amount > data.balance ||
            amount > remaining
        ) {
            showToast("Check your wallet balance and remaining goal amount.", "error");
            return;
        }

        const previousPercentage = goal.saved / goal.target * 100;

        goal.saved += amount;
        data.balance -= amount;

        const newPercentage = goal.saved / goal.target * 100;

        // Savings transfers are not ordinary expenses.
        data.transactions.unshift({
            id: Date.now() + Math.random(),
            type: "saving",
            name: "Savings: " + goal.name,
            amount,
            category: "Savings",
            date: new Date().toLocaleDateString("en-IN")
        });

        saveData();
        addXP(10);
        renderAll();

        let message = "You're closer to your dream!";

        if (previousPercentage < 25 && newPercentage >= 25) {
            message = "🌱 Amazing! You've reached 25% of your dream!";
        } else if (previousPercentage < 50 && newPercentage >= 50) {
            message = "⭐ Fantastic! You're halfway there!";
        } else if (previousPercentage < 75 && newPercentage >= 75) {
            message = "🚀 Incredible! Your dream is almost yours!";
        } else if (previousPercentage < 100 && newPercentage >= 100) {
            message = "🏆 CONGRATULATIONS! You've achieved your dream!";
        }

        showToast(message);
    }

    if (deleteButton) {
        const id = deleteButton.dataset.deleteGoal;

        if (!confirm("Delete this savings goal?")) return;

        data.goals = data.goals.filter(g => String(g.id) !== id);

        saveData();
        renderAll();
        showToast("Goal deleted.");
    }
});


// 9. MONEY RIPPLE

function showRipple(choice) {
    const result = document.getElementById("ripple-result");

    if (choice === "spend") {
        result.innerHTML = `
            <h3>🧸 You chose the toy!</h3>
            <p>Your bicycle fund remains ₹2,000.</p>
            <p>You still need ₹3,000 to reach your goal.</p>
            <p>Enjoying something now is okay, but remember your bigger goal too!</p>
        `;
    } else {
        result.innerHTML = `
            <h3>🌟 You chose to save!</h3>
            <p>Your bicycle fund becomes ₹2,200.</p>
            <p>You now need only ₹2,800.</p>
            <p>One small decision brought you closer to your dream!</p>
        `;
    }
}

document.getElementById("spend-choice").addEventListener("click", () => {
    showRipple("spend");
});

document.getElementById("save-choice").addEventListener("click", () => {
    showRipple("save");
});


// 10. FAMILY DECISION ROOM

document.getElementById("parent-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("request-name").value.trim();
    const price = Number(document.getElementById("request-price").value);
    const reason = document.getElementById("request-reason").value.trim();

    if (
        !name ||
        !reason ||
        !Number.isSafeInteger(price) ||
        price <= 0 ||
        price > 100000
    ) {
        showToast("Please enter valid request details.", "error");
        return;
    }

    data.requests.unshift({
        id: Date.now() + Math.random(),
        name,
        price,
        reason,
        status: "Pending"
    });

    saveData();
    addXP(10);

    event.target.reset();
    renderAll();

    showToast("Your request is ready for parent review!");
});

function renderRequests() {
    const container = document.getElementById("requests-list");

    if (!data.requests.length) {
        container.innerHTML = '<p class="empty">You haven\'t made any purchase requests yet.</p>';
        return;
    }

    container.innerHTML = data.requests.map(request => {
        const statusClass =
            request.status === "Approved" ? "approved" :
            request.status === "Not now" ? "declined" : "";

        return `
            <div class="request-card">
                <div class="goal-top">
                    <h3>🛍️ ${escapeHTML(request.name)}</h3>
                    <span class="status ${statusClass}">${escapeHTML(request.status)}</span>
                </div>

                <h3>${money(request.price)}</h3>
                <p>${escapeHTML(request.reason)}</p>
                <p><strong>Parent review simulation:</strong></p>

                <div class="goal-actions">
                    <button class="small-btn" data-decision="Approved" data-id="${request.id}">
                        Approve
                    </button>

                    <button class="small-btn delete-btn" data-decision="Not now" data-id="${request.id}">
                        Not now
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

document.addEventListener("click", event => {
    const button = event.target.closest("[data-decision]");
    if (!button) return;

    const request = data.requests.find(
        r => String(r.id) === button.dataset.id
    );

    if (!request) return;

    request.status = button.dataset.decision;

    saveData();
    renderRequests();

    showToast("Demo decision recorded: " + request.status);
});


// 11. MISSIONS

function renderMissions() {
    const container = document.getElementById("missions-list");

    document.getElementById("mission-xp").textContent = data.xp;
    document.getElementById("mission-count").textContent =
        data.completedMissions.length;

    container.innerHTML = missions.map(mission => {
        const completed = data.completedMissions.includes(mission.id);

        return `
            <div class="mission-card ${completed ? "completed" : ""}">
                <div>
                    <h3>${mission.icon} ${mission.title}</h3>
                    <p>${mission.description}</p>
                    <div class="mission-reward">⭐ ${mission.reward} XP</div>
                </div>

                <button class="small-btn"
                    data-mission="${mission.id}"
                    ${completed ? "disabled" : ""}>
                    ${completed ? "Completed ✓" : "Claim reward"}
                </button>
            </div>
        `;
    }).join("");
}

document.addEventListener("click", event => {
    const button = event.target.closest("[data-mission]");
    if (!button) return;

    const mission = missions.find(m => m.id === button.dataset.mission);

    if (!mission || data.completedMissions.includes(mission.id)) return;

    if (!mission.check()) {
        showToast("Complete the mission task first!", "error");
        return;
    }

    data.completedMissions.push(mission.id);

    addXP(mission.reward);
    saveData();

    renderAll();
    showToast("🏆 Mission completed! +" + mission.reward + " XP");
});


// 12. DASHBOARD, BADGES AND LEVELS

function renderDashboard() {
    const spent = data.transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const saved = data.goals.reduce(
        (sum, goal) => sum + Number(goal.saved || 0),
        0
    );

    document.getElementById("dash-spent").textContent = money(spent);
    document.getElementById("dash-saved").textContent = money(saved);
    document.getElementById("dash-xp").textContent = data.xp + " XP";
}

function showLevelUp(level) {
    const oldPopup = document.querySelector(".level-up-popup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.className = "level-up-popup";

    popup.innerHTML = `
        <div class="level-up-content">
            <span>🎉</span>
            <h2>LEVEL UP!</h2>
            <p>You reached Level ${level}</p>
        </div>
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

function renderLevel() {
    const level = levelNumber();
    const currentXP = data.xp % 100;

    document.getElementById("level").textContent = "Level " + level;
    document.getElementById("xp-text").textContent = currentXP + " / 100 XP";

    const ring = document.getElementById("xp-ring");
    const ringNumber = document.getElementById("xp-ring-number");

    if (ring) {
        ring.style.setProperty("--progress", currentXP + "%");
    }

    if (ringNumber) {
        ringNumber.textContent = currentXP + "%";
    }
}

function renderBadges() {
    const container = document.getElementById("dashboard-badges");
    if (!container) return;

    const totalSaved = data.goals.reduce(
        (total, goal) => total + Number(goal.saved || 0),
        0
    );

    const achievements = [
        {
            id: "first-mission",
            icon: "🎯",
            name: "First Mission",
            description: "Complete your first mission",
            unlocked: data.completedMissions.length >= 1
        },
        {
            id: "smart-saver",
            icon: "💰",
            name: "Smart Saver",
            description: "Save ₹500 towards your goals",
            unlocked: totalSaved >= 500
        },
        {
            id: "dream-chaser",
            icon: "🏝️",
            name: "Dream Chaser",
            description: "Complete a savings goal",
            unlocked: data.goals.some(
                goal => Number(goal.saved) >= Number(goal.target)
            )
        },
        {
            id: "money-master",
            icon: "👑",
            name: "Money Master",
            description: "Reach Level 5",
            unlocked: levelNumber() >= 5
        }
    ];

    let savedBadges = [];

    try {
        savedBadges = JSON.parse(
            localStorage.getItem("moneyverse-earned-badges") || "[]"
        );

        if (!Array.isArray(savedBadges)) savedBadges = [];
    } catch (error) {
        savedBadges = [];
    }

    achievements.forEach(badge => {
        if (badge.unlocked && !savedBadges.includes(badge.id)) {
            savedBadges.push(badge.id);
        }
    });

    localStorage.setItem(
        "moneyverse-earned-badges",
        JSON.stringify(savedBadges)
    );

    container.innerHTML = achievements.map(badge => {
        const unlocked = savedBadges.includes(badge.id);

        return `
            <div class="achievement ${unlocked ? "unlocked" : "locked"}">
                <span class="achievement-icon">${badge.icon}</span>
                <div>
                    <strong>${badge.name}</strong>
                    <p>${badge.description}</p>
                </div>
                <span>${unlocked ? "✓" : "🔒"}</span>
            </div>
        `;
    }).join("");
}


// 13. RENDER EVERYTHING

function renderAll() {
    renderWallet();
    renderDashboard();
    renderTransactions();
    renderDetective();
    renderGoals();
    renderRequests();
    renderMissions();
    renderLevel();
    renderBadges();
}


// 14. START MONEYVERSE

document.addEventListener("DOMContentLoaded", () => {
    // Data has already been loaded before rendering.
    // All balance displays are updated from the same data object.
    showPage("dashboard");

    console.log("MoneyVerse successfully loaded!");
});

// If this script runs after the HTML has already loaded:
if (document.readyState !== "loading") {
    showPage("dashboard");
}
