// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Signup form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = '';

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageEl.textContent = 'Invalid email format.';
        messageEl.className = 'error';
        return;
    }

    if (password.length < 8) {
        messageEl.textContent = 'Password must be at least 8 characters.';
        messageEl.className = 'error';
        return;
    }

    if (password !== confirmPassword) {
        messageEl.textContent = 'Passwords do not match.';
        messageEl.className = 'error';
        return;
    }

    // Check existing users
    const users = JSON.parse(localStorage.getItem('finance_users')) || [];
    const existingUser = users.find(u => u.email === email || (username && u.username === username));
    if (existingUser) {
        messageEl.textContent = 'Email or username already exists.';
        messageEl.className = 'error';
        return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = {
        id: Date.now(),
        name: fullName,
        email: email,
        username: username || '',
        passwordHash: passwordHash
    };

    users.push(newUser);
    localStorage.setItem('finance_users', JSON.stringify(users));

    messageEl.textContent = 'Signup successful — please log in.';
    messageEl.className = 'success';

    // Redirect to login after 2.5 seconds
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2500);
});
