// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if coming from signup
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('from') === 'signup') {
    document.getElementById('message').textContent = 'Welcome back — please login to continue.';
    document.getElementById('message').className = 'success';
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = '';

    const usernameEmail = document.getElementById('username-email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!usernameEmail || !password) {
        messageEl.textContent = 'Please fill all fields.';
        messageEl.className = 'error';
        return;
    }

    // Get users
    const users = JSON.parse(localStorage.getItem('finance_users')) || [];
    const user = users.find(u => u.username === usernameEmail || u.email === usernameEmail);

    if (!user) {
        messageEl.textContent = 'User not found. Please signup first.';
        messageEl.className = 'error';
        return;
    }

    // Hash input password
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.passwordHash) {
        messageEl.textContent = 'Invalid password.';
        messageEl.className = 'error';
        return;
    }

    // Login success
    const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username
    };

    if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    window.location.href = 'dashboard.html';
});
