import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import {PieChart, Pie, Cell, Tooltip, Legend, BarChart,Bar,XAxis,YAxis,CartesianGrid,ResponsiveContainer} from "recharts";
import AIBudgetPlanner from "./AIBudgetPlanner";

function Dashboard() {
    const [analysis, setAnalysis]=useState({
        balance:0,
        total_income:0,
        total_expense:0
    });
const loadAnalysis=async()=>{
    try{
        const currentUser = getCurrentUser();
        const response = await fetch(`http://127.0.0.1:5000/api/analysis?email=${encodeURIComponent(currentUser.email)}`);
        if(!response.ok){
            throw new Error("Failed to load anaysis");
        }
        const data = await response.json();
        console.log("analysis data:",data);
        setAnalysis(data);
    }catch(error)
    {
       console.error("Analysis error:",error);
    }
};

const chartData = [
    {
        name: "Income",
        value: (analysis.total_income) || 0,
    },
    {
        name: "Expense",
        value: (analysis.total_expense) || 0,
    }
];

const [transaction, setTransaction] = useState([]);
const monthlyData = Object.values(
    transaction.reduce((acc, item) => {
        const rawDate = String(item.date || "").trim();

        if (!rawDate) return acc;

        let month;
        let year;

        // Handle DD-MM-YYYY format
        if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
            const parts = rawDate.split("-");
            month = parts[1];
            year = parts[2];
        } 
        // Handle YYYY-MM-DD format
        else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            const parts = rawDate.split("-");
            year = parts[0];
            month = parts[1];
        } 
        else {
            return acc;
        }

        const key = `${year}-${month}`;

        if (!acc[key]) {
            acc[key] = {
                month: `${month}-${year}`,
                income: 0,
                expenses: 0
            };
        }

        if (item.type?.toLowerCase() === "income") {
            acc[key].income += Number(item.amount) || 0;
        }

        if (item.type?.toLowerCase() === "expense") {
            acc[key].expenses += Number(item.amount) || 0;
        }

        return acc;
    }, {})
);

    const [expenses, setExpenses] = useState([]);
    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Income");
    const [editingId, setEditingId] = useState(null);

const [monthlyBudget, setMonthlyBudget]=useState(5000);
const remainingBudget =monthlyBudget - analysis.total_expense;
const budgetPercentage=monthlyBudget >0 ? (analysis.total_expense / monthlyBudget)*100: 0;
let budgetMessage ="";
if (budgetPercentage >=100){
    budgetMessage="🚨 Budget exceeded!";
}else if (budgetPercentage >=80){
    budgetMessage="⚠️ You are close to your bugdget limit.";
}else{
    budgetMessage="✅ You are within your budget.";
}

    const getCurrentUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch (error) {
            return {};
        }
    };

    const handleExportExcel = async () => {
        try{
            const response = await fetch("http://127.0.0.1:5000/api/export");
            if (!response.ok){
                throw new Error("Failed to export transactions");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "transactions.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            alert("Could not export transactions to Excel");
        }
    };

    const updateSummary = (transactions) => {
        const incomeTotal = transactions
            .filter((item) => item.type?.toLowerCase() === "income")
            .reduce((sum, item) => sum + Number(item.amount), 0);

        const expenseTotal = transactions
            .filter((item) => item.type?.toLowerCase() === "expense")
            .reduce((sum, item) => sum + Number(item.amount), 0);

        setIncome(incomeTotal);
        setExpense(expenseTotal);
        setBalance(incomeTotal - expenseTotal);
    };

    const loadTransactions = async () => {
        const user = getCurrentUser();
        if (!user?.email) {
            setExpenses([]);
            setTransaction([]);
            updateSummary([]);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/expenses?email=${encodeURIComponent(user.email)}`);
            if (!response.ok) {
                throw new Error("Failed to load transactions");
            }
            const data = await response.json();
            const raw = data.transactions || [];

            // Normalize backend field names to frontend-friendly keys
            const mapped = raw.map((r) => ({
                id: r.id ?? r.ID ?? r.Id ?? r["Id"] ?? null,
                amount: r.amount ?? r.Amount ?? r["Amount"] ?? 0,
                description: r.description ?? r.Description ?? r["Description"] ?? "",
                type: r.type ?? r.Type ?? r["Type"] ?? "",
                email: r.email ?? r["User Email"] ?? r.user_email ?? r["user_email"] ?? "",
                date: r.date ?? r.Date ?? r["Date"] ?? "",
            }));

            setExpenses(mapped);
            setTransaction(mapped);
            updateSummary(mapped);
        } catch (error) {
            console.error("Error:", error);
            alert("Could not load transactions");
        }
    };

    useEffect(() => {
        loadTransactions();
        loadAnalysis();
    }, []);


    async function handleTransaction() {
        if (amount === "" || description === "") {
            alert("please fill all fields");
            return;
        }

        const user = getCurrentUser();
        if (!user?.email) {
            alert("User not found. Please log in again.");
            return;
        }

        const newTransaction = {
            email: user.email,
            amount: Number(amount),
            description: description.trim(),
            type: type,
        };

        try {
            const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
            const method = editingId ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(newTransaction),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to save transaction");
            }

            await loadTransactions();
            await loadAnalysis();
            setAmount("");
            setDescription("");
            setType("Income");
            setEditingId(null);
        } catch (error) {
            console.error("Error", error);
            alert(error.message || "could not add transaction");
        }
    }

    async function deleteTransaction(id) {
        if(!window.confirm("Are you sure you want to delete this Transaction?")){
            return;
        }
        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete transaction");
            }

            await loadTransactions();
            await loadAnalysis();
        } catch (error) {
            console.error("delete error:", error);
            alert("Could not delete transaction");
        }
    }

    function editTransaction(index) {
        const selectedTransaction = transaction[index];
        if (!selectedTransaction) return;
        setAmount(selectedTransaction.amount);
        setDescription(selectedTransaction.description);
        setType(selectedTransaction.type);
        setEditingId(selectedTransaction.id);
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Expense Tracker Dashboard</h1>
            </div>

            <div className="summary-container">
                <div className="summary-card balance-card">
                    <h3>Total Balance</h3>
                    <p>₹{analysis.balance}</p>
                </div>

                <div className="summary-card income-card">
                    <h3>Total Income</h3>
                    <p>₹{analysis.total_income}</p>
                </div>

                <div className="summary-card expense-card">
                    <h3>Total Expense</h3>
                    <p>₹{analysis.total_expense}</p>
                </div>
            </div>
            <AIBudgetPlanner 
            budget = {monthlyBudget}
            spent = {analysis.total_expense}
            remaining = {remainingBudget}/>

        <div className="budget-section">
            <div className="budget-header">
                <h2>Monthly Budget</h2>
                <div className="budget-input">
                    <label>Set Budget:</label>
                    <input type="number" value={monthlyBudget}
                    onChange={(e)=>
                        setMonthlyBudget(Number(e.target.value))
                    }  />
                </div>
            </div>
            <div className="budget-card">
                <h3>Monthly Budget</h3>
                <p>Budget:₹{monthlyBudget}</p>
                <p>Spent:₹{analysis.total_expense}</p>
                <p>Remaining:₹{remainingBudget}</p>
                <div className="progress-container">
                    <div className="progress-bar" style={{width:`${Math.min(budgetPercentage,100)}%`}}></div>
                </div>
                <p>{budgetPercentage.toFixed(1)}% used</p>
                <p>{budgetMessage}</p>
            </div>
        </div>
 <div className="charts-row">
<div className="chart-container">
    <h2>Income vs Expense</h2>
    <PieChart width={400} height={300}>
        <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
        >
           {chartData.map((entry, index)=>(
            <Cell
               key={`cell-${index}`}
               fill={entry.name === "Income"?"#69ca6c":"#f05757"}
               />
           ))}

        </Pie>
        <Tooltip />
        <Legend />
    </PieChart>
</div>
<div className="chart-container">
    <h2>Monthly Income and Expense Bar Chart</h2>
    <ResponsiveContainer width="100%" height={300}>
    <BarChart width={500} height={300} data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="income" fill="#69ca6c"/>
        <Bar dataKey="expenses" fill="#f05757"/>
    </BarChart>
    </ResponsiveContainer>
</div>
</div>

            <div className="dashboard-body">
                <form
                    className="transaction-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleTransaction();
                    }}
                >
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />

                    <select value={type} onChange={(event) => setType(event.target.value)}>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                    </select>
                    <button type="submit">{editingId ? "Update Transaction" : "Add Transaction"}</button>
                    <button type="button" onClick={handleExportExcel}>Export transaction to  Excel</button>
                </form>

                <div className="transaction-table-container">
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transaction.length > 0 ? (
                                transaction.map((item, index) => (
                                    <tr key={item.id ?? index}>
                                        <td>{item.description}</td>
                                        <td>
                                            <span
                                                className={
                                                    item.type?.toLowerCase() === "income"
                                                        ? "income-badge"
                                                        : "expense-badge"
                                                }
                                            >
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>₹{item.amount}</td>
                                        <td>
                                            <button className="edit-btn" onClick={() => editTransaction(index)}>
                                                Edit
                                            </button>
                                            <button
                                                className="delete-button"
                                                onClick={() => deleteTransaction(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No transactions available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
