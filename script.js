// Authentication check
const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'index.html?message=Please login first.';
}

// Display user info
document.getElementById('user-name').textContent = currentUser.name;
document.getElementById('user-email').textContent = currentUser.email;
const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
document.getElementById('user-avatar').textContent = initials;

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Edit profile modal
const modal = document.getElementById('edit-profile-modal');
const editBtn = document.getElementById('edit-profile-btn');
const closeBtn = document.querySelector('.close');

editBtn.addEventListener('click', () => {
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-email').value = currentUser.email;
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('edit-name').value.trim();
    const newEmail = document.getElementById('edit-email').value.trim();

    if (!newName || !newEmail) {
        alert('Please fill all fields.');
        return;
    }

    // Update currentUser
    currentUser.name = newName;
    currentUser.email = newEmail;

    // Update in storage
    if (localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Update finance_users
    const users = JSON.parse(localStorage.getItem('finance_users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        localStorage.setItem('finance_users', JSON.stringify(users));
    }

    // Update UI
    document.getElementById('user-name').textContent = newName;
    document.getElementById('user-email').textContent = newEmail;
    const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('user-avatar').textContent = initials;

    modal.style.display = 'none';
});

// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions_' + currentUser.id)) || [];
let chart = null;

// DOM elements
const transactionForm = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const remainingBalanceEl = document.getElementById('remaining-balance');
const startDateEl = document.getElementById('start-date');
const endDateEl = document.getElementById('end-date');
const categoryEl = document.getElementById('category');
const recipientEl = document.getElementById('recipient');

// Initialize app
function init() {
    updateUI();
    renderChart();
    categoryEl.addEventListener('change', toggleRecipientField);
}

// Load data and update UI
function updateUI() {
    renderTransactions();
    updateTotals();
    renderChart();
}

// Toggle recipient field
function toggleRecipientField() {
    if (categoryEl.value === 'Gave to Same One') {
        recipientEl.style.display = 'block';
        recipientEl.required = true;
    } else {
        recipientEl.style.display = 'none';
        recipientEl.required = false;
        recipientEl.value = '';
    }
}

// Render transactions
function renderTransactions() {
    transactionsList.innerHTML = '';
    const filteredTransactions = getFilteredTransactions();

    filteredTransactions.forEach((transaction, index) => {
        const li = document.createElement('li');
        const fullDate = new Date(transaction.date).toLocaleDateString();
        let categoryText = transaction.category;
        if (transaction.recipient) {
            categoryText += ` - To: ${transaction.recipient}`;
        }
        li.innerHTML = `
            <div>
                <span class="transaction-${transaction.type}">${fullDate} - ${transaction.amount.toFixed(2)}</span>
                <small>${categoryText}</small>
            </div>
            <div class="transaction-buttons">
                <button class="edit-btn" onclick="editTransaction(${transaction.id})">Edit</button>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </div>
        `;
        transactionsList.appendChild(li);
    });
}

// Get filtered transactions
function getFilteredTransactions() {
    const startDate = startDateEl.value;
    const endDate = endDateEl.value;
    if (!startDate || !endDate) {
        return transactions;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // end of day
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= start && transactionDate <= end;
    });
}

// Update totals
function updateTotals() {
    const filteredTransactions = getFilteredTransactions();
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const remainingBalance = totalIncome - totalExpenses;

    totalIncomeEl.textContent = `${totalIncome.toFixed(2)}`;
    totalExpensesEl.textContent = `${totalExpenses.toFixed(2)}`;
    remainingBalanceEl.textContent = `${remainingBalance.toFixed(2)}`;
}

// Add transaction
function addTransaction(type, date, amount, category, recipient = '') {
    const selectedDate = new Date(date);
    const transaction = {
        id: Date.now(),
        type,
        month: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`,
        amount: parseFloat(amount),
        category,
        recipient: recipient || '',
        date: selectedDate.toISOString()
    };
    transactions.push(transaction);
    saveTransactions();
    updateUI();
    renderChart();
}

// Edit transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        document.getElementById('type').value = transaction.type;
        document.getElementById('date').value = transaction.date.split('T')[0];
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('recipient').value = transaction.recipient || '';
        toggleRecipientField(); // Update field visibility
        deleteTransaction(id); // Remove old one, will be added via form
    }
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
    renderChart();
}

// Save to localStorage
function saveTransactions() {
    localStorage.setItem('transactions_' + currentUser.id, JSON.stringify(transactions));
}



// Render pie chart
function renderChart() {
    const ctx = document.getElementById('spending-chart').getContext('2d');
    const expenseData = getFilteredTransactions().filter(t => t.type === 'expense');
    const categories = {};
    expenseData.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    const noMessage = document.getElementById('no-chart-message');
    const canvas = document.getElementById('spending-chart');

    if (data.length === 0) {
        noMessage.style.display = 'block';
        canvas.style.display = 'none';
        if (chart) {
            chart.destroy();
            chart = null;
        }
    } else {
        noMessage.style.display = 'none';
        canvas.style.display = 'block';
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${context.parsed.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Event listeners
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const recipient = document.getElementById('recipient').value;

    addTransaction(type, date, amount, category, recipient);
    transactionForm.reset();
    toggleRecipientField(); // Reset field visibility
});

startDateEl.addEventListener('change', updateUI);
endDateEl.addEventListener('change', updateUI);

// Initialize
init();
