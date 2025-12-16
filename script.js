const STORAGE_KEY = "pf-tracker-transactions";

const categories = {
  transportation: { label: "Transportation", icon: "🚌", color: "#f97316" },
  food: { label: "Food & Drink", icon: "🍽️", color: "#f43f5e" },
  shopping: { label: "Shopping", icon: "🛍️", color: "#0ea5e9" },
  travel: { label: "Travelling", icon: "✈️", color: "#8b5cf6" },
  personal: { label: "Personal Care", icon: "💆", color: "#ec4899" },
  other: { label: "Other", icon: "💸", color: "#22d3ee" },
};

const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const list = document.getElementById("transaction-list");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const monthEl = document.getElementById("current-month");
const donutEl = document.getElementById("donut-chart");
const chartTotalEl = document.getElementById("chart-total");
const legendEl = document.getElementById("chart-legend");

let transactions = [];

init();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amountValue = parseFloat(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;

  if (!description || isNaN(amountValue) || amountValue <= 0) {
    alert("Please enter a description and a positive amount.");
    return;
  }

  const transaction = {
    id: Date.now(),
    description,
    amount: amountValue,
    type,
    category,
    createdAt: new Date().toISOString(),
  };

  transactions.unshift(transaction);
  persistTransactions();
  refreshUI();

  form.reset();
  typeInput.value = "income";
});

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  transactions = saved ? parseStoredTransactions(saved) : [];

  if (monthEl) {
    const now = new Date();
    monthEl.textContent = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  refreshUI();
}

function parseStoredTransactions(saved) {
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function refreshUI() {
  renderTransactions();
  updateTotals();
  updateChart();
}

function persistTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function renderTransactions() {
  list.innerHTML = "";

  if (!transactions.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet. Log your first income or expense.";
    list.appendChild(empty);
    return;
  }

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = `transaction-item ${transaction.type}`;

    const categoryMeta = categories[transaction.category] || categories.other;
    const dateStamp = formatDate(transaction.createdAt || transaction.id);

    li.innerHTML = `
      <div class="transaction-meta">
        <span class="icon" style="background:${categoryMeta.color}">${categoryMeta.icon}</span>
        <div>
          <strong>${transaction.description}</strong>
          <small>${categoryMeta.label} · ${dateStamp}</small>
        </div>
      </div>
      <span class="amount ${transaction.type}">
        ${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}
      </span>
    `;

    list.appendChild(li);
  });
}

function updateTotals() {
  const incomeTotal = sumByType("income");
  const expenseTotal = sumByType("expense");
  const balance = incomeTotal - expenseTotal;

  incomeEl.textContent = `$${formatCurrency(incomeTotal)}`;
  expensesEl.textContent = `$${formatCurrency(expenseTotal)}`;
  balanceEl.textContent = `$${formatCurrency(balance)}`;
}

function sumByType(type) {
  return transactions
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0);
}

function updateChart() {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalsByCategory = expenses.reduce((acc, item) => {
    const key = item.category || "other";
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});

  const entries = Object.entries(totalsByCategory).map(([key, amount]) => {
    const meta = categories[key] || categories.other;
    return { ...meta, amount };
  });

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  chartTotalEl.textContent = `$${formatCurrency(totalExpense)}`;

  if (!entries.length) {
    donutEl.style.setProperty(
      "--chart",
      "conic-gradient(#e2e8f0 0deg, #e2e8f0 360deg)"
    );
    legendEl.innerHTML = `<li class="empty-state">Add expenses to see the chart</li>`;
    return;
  }

  const gradientSegments = [];
  let cumulative = 0;

  entries.forEach((entry) => {
    const start = (cumulative / totalExpense) * 360;
    cumulative += entry.amount;
    const end = (cumulative / totalExpense) * 360;
    gradientSegments.push(`${entry.color} ${start}deg ${end}deg`);
  });

  donutEl.style.setProperty(
    "--chart",
    `conic-gradient(${gradientSegments.join(",")})`
  );

  legendEl.innerHTML = "";
  entries
    .sort((a, b) => b.amount - a.amount)
    .forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="meta">
          <span class="icon" style="background:${entry.color}">${entry.icon}</span>
          <div>
            <strong>${entry.label}</strong>
            <small>${((entry.amount / totalExpense) * 100).toFixed(0)}%</small>
          </div>
        </div>
        <span class="amount expense">-$${formatCurrency(entry.amount)}</span>
      `;
      legendEl.appendChild(li);
    });
}

function formatCurrency(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
