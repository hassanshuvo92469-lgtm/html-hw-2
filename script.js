const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const list = document.getElementById("transaction-list");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");

let transactions = [];

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amountValue = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!description || isNaN(amountValue) || amountValue <= 0) {
    alert("Please enter a description and a positive amount.");
    return;
  }

  const transaction = {
    id: Date.now(),
    description,
    amount: amountValue,
    type,
  };

  transactions.push(transaction);
  form.reset();
  typeInput.value = "income";

  renderTransactions();
  updateTotals();
});

function renderTransactions() {
  list.innerHTML = "";

  if (transactions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet. Log your first income or expense.";
    list.appendChild(empty);
    return;
  }

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = `transaction-item ${transaction.type}`;

    li.innerHTML = `
      <div class="transaction-meta">
        <strong>${transaction.description}</strong>
        <small>${transaction.type === "income" ? "Income" : "Expense"}</small>
      </div>
      <div class="amount ${transaction.type}">${
        transaction.type === "income" ? "+" : "-"
      }${formatCurrency(transaction.amount)}</div>
    `;

    list.appendChild(li);
  });
}

function updateTotals() {
  const incomeTotal = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseTotal = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = incomeTotal - expenseTotal;

  incomeEl.textContent = `$${formatCurrency(incomeTotal)}`;
  expensesEl.textContent = `$${formatCurrency(expenseTotal)}`;
  balanceEl.textContent = `$${formatCurrency(balance)}`;
}

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

renderTransactions();
updateTotals();
