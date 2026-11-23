import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { jsPDF } from "jspdf";
const categories = [
  "Food",
  "Shopping",
  "Travel",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const getMonthKey = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function App() {
  // Load saved transactions
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("transactions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
// Edit transaction state
const [editingId, setEditingId] = useState(null);
  // Month selection
  const [selectedMonth, setSelectedMonth] = useState(
    getLocalDate().slice(0, 7)
  );
const [darkMode, setDarkMode] = useState(false);
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Save transactions
  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Money formatter
  const money = (value) =>
    `₹${Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // All-time totals
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount), 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const balance = income - expenses;

  // Monthly transactions
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (item) => getMonthKey(item.date) === selectedMonth
      ),
    [transactions, selectedMonth]
  );

  // Monthly income and expenses
  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  // Last six months chart
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        year,
        month - 1 - (5 - index),
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthTransactions = transactions.filter(
        (item) => getMonthKey(item.date) === key
      );

      const monthIncome = monthTransactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const monthExpenses = monthTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return {
        key,
        label: date.toLocaleDateString("en-IN", {
          month: "short",
        }),
        income: monthIncome,
        expenses: monthExpenses,
      };
    });
  }, [transactions, selectedMonth]);

  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((item) => [
      item.income,
      item.expenses,
    ])
  );

  // Category breakdown
  const categoryData = categories
    .map((name) => {
      const total = monthlyTransactions
        .filter(
          (item) =>
            item.type === "expense" &&
            (item.category || "Other") === name
        )
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return { name, total };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const categoryColors = [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#ec4899",
    "#10b981",
    "#f97316",
    "#64748b",
  ];

  // Search and filter logic
  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter((item) => {
      const matchesSearch = (item.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());

      const matchesType =
        filterType === "all" || item.type === filterType;

      const itemCategory =
        item.category ||
        (item.type === "income" ? "Income" : "Other");

      const matchesCategory =
        filterCategory === "all" ||
        itemCategory === filterCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      );
    });
  }, [
    monthlyTransactions,
    searchTerm,
    filterType,
    filterCategory,
  ]);

  // Add transaction
  const addTransaction = (e) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      alert("Please enter valid details!");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      title: title.trim(),
      amount: Number(amount),
      type,
      category: type === "expense" ? category : "Income",
      date: getLocalDate(),
    };

    if (editingId !== null) {
  setTransactions((previous) =>
    previous.map((item) =>
      item.id === editingId
        ? { ...newTransaction, id: editingId }
        : item
    )
  );

  setEditingId(null);
} else {
  setTransactions((previous) => [
    newTransaction,
    ...previous,
  ]);
}

    setTitle("");
    setAmount("");
    setType("expense");
    setCategory("Food");
  };

  // Delete transaction

  const deleteTransaction = (id) => {
    if (!window.confirm("Delete this transaction?")) return;

    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };
  // Edit transaction
const editTransaction = (item) => {
  setTitle(item.title);
  setAmount(item.amount);
  setType(item.type);
  setCategory(item.category);
  setEditingId(item.id);

  window.scrollTo({ top: 0, behavior: "smooth" });
};
  // Export transactions to CSV
const exportCSV = () => {
  if (transactions.length === 0) {
    alert("No transactions to export!");
    return;
  }

  const headers = [
    "Title",
    "Amount",
    "Type",
    "Category",
    "Date"
  ];
const formatExportDate = (value, id) => {
  const date = value
    ? new Date(value)
    : new Date(Number(id));

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

  const rows = transactions.map((item) => [
    item.title || "",
    Number(item.amount) || 0,
    item.type || "",
    item.category || "Other",
formatExportDate(
  item.date || item.createdAt || item.timestamp,
  item.id
)  ]);

  const csvContent = [
    headers,
    ...rows
  ].map(row =>
    row.map(value =>
      `"${String(value).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "expense-report.csv";
  link.click();

  URL.revokeObjectURL(url);
};
// Export transactions to PDF
const exportPDF = () => {
  if (transactions.length === 0) {
    alert("No transactions to export!");
    return;
  }
const totalIncome = transactions
  .filter((item) => item.type === "income")
  .reduce((sum, item) => sum + Number(item.amount), 0);

const totalExpenses = transactions
  .filter((item) => item.type === "expense")
  .reduce((sum, item) => sum + Number(item.amount), 0);

const balance = totalIncome - totalExpenses;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Expense Tracker Report", 20, 20);
doc.setFontSize(12);

doc.text(`Total Income: Rs. ${totalIncome}`, 20, 40);

doc.text(`Total Expenses: Rs. ${totalExpenses}`, 20, 50);

doc.text(`Final Balance: Rs. ${balance}`, 20, 60);

doc.text(`Report Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 70);
  doc.setFontSize(11);
  doc.text(`Total Transactions: ${transactions.length}`, 20, 85);

  doc.text("Transaction Details", 20, 100);

  let y = 105;

  transactions.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.text(
      `${index + 1}. ${item.title} | Rs. ${item.amount} | ${item.type} | ${item.category || "Other"} | ${item.date ? new Date(item.date).toLocaleDateString("en-IN") : "Date not available"}`,
      20,
      y
    );

    y += 10;
  });

  doc.save("expense-report.pdf");
};
  // Reset search and filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
  };

  return (
    <main className={`dashboard ${darkMode ? "dark-mode" : ""}`}>

      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">₹</div>

          <div>
            <h1>Expense Tracker</h1>
            <p>Your personal finance dashboard</p>
          </div>
        </div>

        <span className="live-badge">
          ● Personal Finance
        </span>
        <button
  className="theme-toggle"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
</button>
      </header>

      {/* Welcome */}
      <section className="welcome">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h2>Welcome back! 👋</h2>
          <p>Here's how your money is looking.</p>
        </div>

        <div className="date-display">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </section>

      {/* All-time summary */}
      <section className="summary">

        <div className="summary-card balance-card">
          <div className="card-heading">
            <span>Total Balance</span>
            <span className="card-icon">₹</span>
          </div>

          <h2>{money(balance)}</h2>
          <p>Your overall balance</p>
        </div>

        <div className="summary-card income-card">
          <div className="card-heading">
            <span>Total Income</span>
            <span className="card-icon">↗</span>
          </div>

          <h2>{money(income)}</h2>
          <p>All-time earnings</p>
        </div>

        <div className="summary-card expense-card">
          <div className="card-heading">
            <span>Total Expenses</span>
            <span className="card-icon">↘</span>
          </div>

          <h2>{money(expenses)}</h2>
          <p>All-time spending</p>
        </div>

      </section>

      {/* Financial Analytics */}
      <section className="analytics-header">
        <div>
          <h2>Financial Analytics</h2>
          <p>Understand your monthly spending</p>
        </div>

        <input
          className="month-picker"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </section>

      {/* Monthly Summary */}
      <section className="monthly-summary">

        <div className="mini-card">
          <span>Monthly Income</span>
          <h3 className="green-text">
            {money(monthlyIncome)}
          </h3>
        </div>

        <div className="mini-card">
          <span>Monthly Expenses</span>
          <h3 className="red-text">
            {money(monthlyExpenses)}
          </h3>
        </div>

        <div className="mini-card">
          <span>Monthly Savings</span>
          <h3>
            {money(monthlyIncome - monthlyExpenses)}
          </h3>
        </div>

      </section>

      {/* Income vs Expenses Chart */}
      <section className="chart-card">

        <div className="section-heading">
          <div>
            <h2>Income vs Expenses</h2>
            <p>Last six months</p>
          </div>

          <div className="chart-legend">
            <span>
              <i className="income-dot" /> Income
            </span>

            <span>
              <i className="expense-dot" /> Expenses
            </span>
          </div>
        </div>

        <div className="bar-chart">
          {chartData.map((item) => (
            <div className="chart-column" key={item.key}>

              <div className="bars">
                <div
                  className="bar income-bar"
                  style={{
                    height: `${
                      (item.income / maxChartValue) * 100
                    }%`,
                  }}
                  title={`Income: ${money(item.income)}`}
                />

                <div
                  className="bar expense-bar"
                  style={{
                    height: `${
                      (item.expenses / maxChartValue) * 100
                    }%`,
                  }}
                  title={`Expenses: ${money(item.expenses)}`}
                />
              </div>

              <span>{item.label}</span>
            </div>
          ))}
        </div>

      </section>

      {/* Category Breakdown */}
      <section className="chart-card">

        <div className="section-heading">
          <div>
            <h2>Spending by Category</h2>
            <p>Where your money goes this month</p>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <p className="empty-message">
            No expense data for this month yet.
          </p>
        ) : (

          <div className="category-list">

            {categoryData.map((item) => {
              const percentage =
                monthlyExpenses > 0
                  ? (item.total / monthlyExpenses) * 100
                  : 0;

              const color =
                categoryColors[categories.indexOf(item.name)] ||
                "#64748b";

              return (
                <div className="category-item" key={item.name}>

                  <div className="category-info">
                    <span>{item.name}</span>
                    <strong>{money(item.total)}</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                        background: color,
                      }}
                    />
                  </div>

                  <small>{percentage.toFixed(1)}%</small>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* Add Transaction */}
      <section className="chart-card">

        <div className="section-heading">
          <div>
            <h2>Add Transaction</h2>
            <p>Record your income or expenses</p>
          </div>
        </div>

        <form
          className="transaction-form"
          onSubmit={addTransaction}
        >

          <input
            type="text"
            placeholder="Transaction name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          {type === "expense" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="primary-button"
          >
            {editingId !== null ? "Update Transaction" : "+ Add Transaction"}
          </button>

        </form>

      </section>

      {/* Transaction History */}
      <section className="chart-card">

        <div className="section-heading">
          <div>
            <h2>Transaction History</h2>
            <p>
              {filteredTransactions.length} transactions found
            </p>
          </div>
          <button
  className="export-button"
  onClick={exportCSV}
>
  📥 Export CSV
</button>
<button
  className="export-button"
  onClick={exportPDF}
>
  📄 Export PDF
</button>
        </div>

        {/* Search and Filters */}
        <div className="transaction-filters">

          <input
            type="text"
            placeholder="🔍 Search transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Transactions</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Income">Income</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="reset-button"
            onClick={resetFilters}
          >
            Reset
          </button>

        </div>

        {/* Transactions */}
        <div className="history">

          {filteredTransactions.length === 0 ? (
            <p className="empty-message">
              No matching transactions found.
            </p>
          ) : (

            [...filteredTransactions]
              .sort(
                (a, b) =>
                  new Date(b.date) - new Date(a.date)
              )
              .map((item) => (

                <div className="transaction" key={item.id}>

                  <div className="transaction-left">

                    <div
                      className={`transaction-icon ${item.type}`}
                    >
                      {item.type === "income" ? "↗" : "↘"}
                    </div>

                    <div>
                      <h3>{item.title}</h3>

                      <p>
                        {item.category || "Other"} ·{" "}
                        {formatDate(item.date)}
                      </p>
                    </div>

                  </div>

                  <div className="transaction-right">

                    <strong
                      className={
                        item.type === "income"
                          ? "green-text"
                          : "red-text"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {money(item.amount)}
                    </strong>
<button
  type="button"
  className="edit-button"
  onClick={() => editTransaction(item)}
>
  ✏️ Edit
</button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteTransaction(item.id)}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))

          )}

        </div>

      </section>

      {/* Footer */}
      <footer className="footer">
        Made with ❤️ using React.js
      </footer>

    </main>
  );
}

export default App;