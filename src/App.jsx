import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // Load saved transactions
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  // Save transactions
  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Calculate totals
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const balance = income - expenses;

  // Add transaction
  const addTransaction = () => {
    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter valid details!");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      title: title.trim(),
      amount: Number(amount),
      type,
      date: new Date().toLocaleString()
    };

    setTransactions([...transactions, newTransaction]);

    setTitle("");
    setAmount("");
    setType("expense");
  };

  // Delete transaction
  const deleteTransaction = (id) => {
    setTransactions(
      transactions.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="container">
      <h1>Expense Tracker 💰</h1>
      <p>Manage Your Money Smartly</p>

      <div className="summary">
        <div className="card">
          <h3>Balance</h3>
          <h2>₹{balance}</h2>
        </div>

        <div className="card">
          <h3>Income</h3>
          <h2>₹{income}</h2>
        </div>

        <div className="card">
          <h3>Expenses</h3>
          <h2>₹{expenses}</h2>
        </div>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Transaction Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <button onClick={addTransaction}>
          Add Transaction
        </button>
      </div>

      <h2>Transaction History</h2>

      <div className="history">
        {transactions.length === 0 ? (
          <p>No transactions yet!</p>
        ) : (
          transactions.map((item) => (
            <div className="transaction" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <small>{item.date}</small>
                <p>{item.type}</p>
              </div>

              <div>
                <strong>
                  {item.type === "income" ? "+" : "-"}₹
                  {item.amount}
                </strong>

                <button
                  className="delete-btn"
                  onClick={() => deleteTransaction(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;