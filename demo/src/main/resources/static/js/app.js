const API_URL = 'http://localhost:8080';
let stompClient = null;
let currentUserId = null;
let currentReceiverId = null;
let currentUsername = null;

// Initialize
window.onload = function() {
    currentUserId = localStorage.getItem('userId');
    currentUsername = localStorage.getItem('username');

    if (!currentUserId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('currentUser').innerText = currentUsername;
    loadUsers();
    connectWebSocket();
};

// Load all users
async function loadUsers() {
    try {
        console.log('🔄 Loading users...');

        const response = await fetch(`${API_URL}/users`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const users = await response.json();

        console.log('✅ Users loaded:', users);

        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        if (users.length === 0) {
            userList.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">No users found. Register another user!</div>';
            return;
        }

        users.forEach(user => {
            if (user.id != currentUserId) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';

                // 🔥 FIX: Proper event binding
                userDiv.addEventListener('click', function() {
                    selectUser(user.id, user.username, userDiv);
                });

                userDiv.innerHTML = `
                    <strong>${user.username}</strong>
                    <span class="status ${user.status === 'ONLINE' ? 'online' : ''}">
                        ${user.status === 'ONLINE' ? '● Online' : '○ Offline'}
                    </span>
                `;

                userList.appendChild(userDiv);
            }
        });

        console.log('✅ User list rendered');

    } catch (error) {
        console.error('❌ Error loading users:', error);
        const userList = document.getElementById('userList');
        userList.innerHTML = `
            <div style="padding:20px; text-align:center; color:red;">
                ❌ Error loading users<br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Select user to chat
function selectUser(userId, username, element) {
    console.log('👤 Selected user:', username, 'ID:', userId);

    currentReceiverId = userId;
    document.getElementById('chatWith').innerText = `Chat with ${username}`;

    // Highlight selected user
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });

    if (element) {
        element.classList.add('active');
    }

    // Load chat history
    loadChatHistory();
}

// Load chat history (VBS style)
async function loadChatHistory() {
    if (!currentReceiverId) return;

    try {
        console.log('📜 Loading chat history...');

        const response = await fetch(`${API_URL}/messages/${currentUserId}/${currentReceiverId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();

        console.log('✅ Messages loaded:', messages.length);

        const messageArea = document.getElementById('messageArea');
        messageArea.innerHTML = '';

        if (messages.length === 0) {
            messageArea.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">No messages yet. Start the conversation! 💬</div>';
        }

        messages.forEach(msg => {
            displayMessage(msg);
        });

        // Scroll to bottom
        messageArea.scrollTop = messageArea.scrollHeight;
    } catch (error) {
        console.error('❌ Error loading history:', error);
    }
}

// Connect to WebSocket
function connectWebSocket() {
    console.log('🔌 Connecting to WebSocket...');

    const socket = new SockJS(`${API_URL}/chat`);
    stompClient = Stomp.over(socket);

    // Disable debug logging (optional)
    stompClient.debug = null;

    stompClient.connect({}, function(frame) {
        console.log('✅ WebSocket Connected:', frame);

        // Subscribe to receive messages
        stompClient.subscribe('/topic/messages', function(message) {
            const msg = JSON.parse(message.body);

            console.log('📨 Received message:', msg);

            // Only show if relevant to current chat
            if ((msg.senderId == currentUserId && msg.receiverId == currentReceiverId) ||
                (msg.senderId == currentReceiverId && msg.receiverId == currentUserId)) {
                displayMessage(msg);
            }
        });
    }, function(error) {
        console.error('❌ WebSocket connection error:', error);
    });
}

// Send message (Real-time via Socket)
function sendMessage() {
    const content = document.getElementById('messageText').value.trim();

    if (!content) {
        alert('⚠️ Please type a message');
        return;
    }

    if (!currentReceiverId) {
        alert('⚠️ Please select a user first');
        return;
    }

    if (!stompClient || !stompClient.connected) {
        alert('⚠️ Connection lost. Please refresh the page.');
        return;
    }

    const message = {
        senderId: parseInt(currentUserId),
        receiverId: parseInt(currentReceiverId),
        content: content,
        status: 'SENT'
    };

    console.log('📤 Sending message:', message);

    // Send via WebSocket
    stompClient.send("/app/send", {}, JSON.stringify(message));

    // Clear input
    document.getElementById('messageText').value = '';
}

// Display message in UI
function displayMessage(msg) {
    const messageArea = document.getElementById('messageArea');

    // Remove "no messages" text if present
    if (messageArea.querySelector('div[style*="No messages"]')) {
        messageArea.innerHTML = '';
    }

    const messageDiv = document.createElement('div');

    const isSent = msg.senderId == currentUserId;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

    const time = msg.time ? new Date(msg.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }) : 'now';

    messageDiv.innerHTML = `
        <div class="message-content">
            ${msg.content}
            <div class="message-time">${time}</div>
        </div>
    `;

    messageArea.appendChild(messageDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Logout
async function logout() {
    try {
        await fetch(`${API_URL}/logout/${currentUserId}`, { method: 'POST' });
        console.log('👋 Logged out');
    } catch (error) {
        console.error('Error during logout:', error);
    }

    localStorage.clear();
    window.location.href = 'index.html';
}