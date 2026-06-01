// ==================== SOCKET.IO CONNECTION ====================

const socket = io();

let performanceChart = null;
let winLossChart = null;
let currentPage = 1;
let totalTrades = 0;

// Connect to WebSocket
socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
    addLog('Connected to bot server', 'success');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
    addLog('Disconnected from bot server', 'error');
});

socket.on('status_update', (data) => {
    updateDashboard(data);
});

socket.on('new_signal', (data) => {
    addSignalToTable(data);
});

socket.on('new_trade', (data) => {
    addLog(`New trade: ${data.pair} - ${data.signal}`, 'success');
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadInitialData();
    setInterval(loadInitialData, 10000); // Refresh every 10 seconds
});

function initCharts() {
    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'P&L Progression',
                data: [0, 120, 250, 400],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { prefix: '$' }
                }
            }
        }
    });

    // Win/Loss Chart
    const winLossCtx = document.getElementById('winLossChart').getContext('2d');
    winLossChart = new Chart(winLossCtx, {
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [65, 35],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: ['#059669', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// ==================== API CALLS ====================

async function loadInitialData() {
    try {
        // Load status
        const statusResponse = await fetch('/api/bot/status');
        const status = await statusResponse.json();
        updateDashboard(status);

        // Load signals
        const signalsResponse = await fetch('/api/signals/recent');
        const signalsData = await signalsResponse.json();
        displaySignals(signalsData.signals);

        // Load performance stats
        const statsResponse = await fetch('/api/performance/statistics');
        const stats = await statsResponse.json();
        updateStats(stats);

        // Load trades
        loadTrades(1);
    } catch (error) {
        console.error('Error loading data:', error);
        addLog(`Error loading data: ${error.message}`, 'error');
    }
}

async function startBot() {
    try {
        addLog('Starting bot...', 'info');
        const response = await fetch('/api/bot/start', { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            addLog('Bot started successfully', 'success');
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
        } else {
            addLog(`Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error starting bot:', error);
        addLog(`Error starting bot: ${error.message}`, 'error');
    }
}

async function stopBot() {
    try {
        addLog('Stopping bot...', 'warning');
        const response = await fetch('/api/bot/stop', { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            addLog('Bot stopped successfully', 'success');
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
        } else {
            addLog(`Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error stopping bot:', error);
        addLog(`Error stopping bot: ${error.message}`, 'error');
    }
}

async function loadTrades(page) {
    try {
        const response = await fetch(`/api/trades/history?page=${page}&limit=10`);
        const data = await response.json();
        
        displayTrades(data.trades);
        
        totalTrades = data.total;
        document.getElementById('pageInfo').textContent = `Page ${page} of ${Math.ceil(totalTrades / 10)}`;
        
        document.getElementById('prevBtn').disabled = page === 1;
        document.getElementById('nextBtn').disabled = page >= Math.ceil(totalTrades / 10);
        
        currentPage = page;
    } catch (error) {
        console.error('Error loading trades:', error);
    }
}

// ==================== UPDATE FUNCTIONS ====================

function updateDashboard(status) {
    if (status.balance !== undefined) {
        document.getElementById('balance').textContent = `$${status.balance.toFixed(2)}`;
    }
    
    if (status.statistics) {
        const stats = status.statistics;
        document.getElementById('totalTrades').textContent = stats.total_trades || 0;
        document.getElementById('winRate').textContent = `${((stats.win_rate || 0) * 100).toFixed(1)}%`;
        document.getElementById('totalPnL').textContent = `$${(stats.total_pnl || 0).toFixed(2)}`;
        document.getElementById('activeSignals').textContent = stats.total_signals || 0;
        
        const uptime = Math.floor(stats.uptime_hours || 0);
        document.getElementById('uptime').textContent = `${uptime}h`;
    }
}

function updateConnectionStatus(connected) {
    const dot = document.getElementById('connectionStatus');
    const text = document.getElementById('statusText');
    
    if (connected) {
        dot.classList.add('connected');
        dot.classList.remove('disconnected');
        text.textContent = 'Connected';
    } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
        text.textContent = 'Disconnected';
    }
}

function updateStats(stats) {
    if (stats.win_rate !== undefined) {
        document.getElementById('winRate').textContent = `${(stats.win_rate * 100).toFixed(1)}%`;
    }
}

// ==================== DISPLAY FUNCTIONS ====================

function displaySignals(signals) {
    const tbody = document.getElementById('signalsBody');
    
    if (signals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No signals yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = signals.map(signal => `
        <tr>
            <td><strong>${signal.pair}</strong></td>
            <td><span class="signal-${signal.signal.toLowerCase()}">${signal.signal}</span></td>
            <td><span class="confidence-${getConfidenceLevel(signal.confidence)}">
                ${(signal.confidence * 100).toFixed(1)}%
            </span></td>
            <td>${formatTime(signal.timestamp)}</td>
            <td><span class="status-pending">Pending</span></td>
        </tr>
    `).join('');
}

function addSignalToTable(signal) {
    const tbody = document.getElementById('signalsBody');
    
    // Remove "no signals" row if exists
    if (tbody.children.length === 1 && tbody.children[0].cells[0].colSpan === 5) {
        tbody.innerHTML = '';
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><strong>${signal.pair}</strong></td>
        <td><span class="signal-${signal.signal.toLowerCase()}">${signal.signal}</span></td>
        <td><span class="confidence-${getConfidenceLevel(signal.confidence)}">
            ${(signal.confidence * 100).toFixed(1)}%
        </span></td>
        <td>${formatTime(new Date().toISOString())}</td>
        <td><span class="status-pending">Pending</span></td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
    
    // Keep only last 10 signals
    while (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

function displayTrades(trades) {
    const tbody = document.getElementById('tradesBody');
    
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No trades yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = trades.map(trade => `
        <tr>
            <td><strong>${trade.pair}</strong></td>
            <td><span class="signal-${trade.signal.toLowerCase()}">${trade.signal}</span></td>
            <td><span class="confidence-${getConfidenceLevel(trade.confidence)}">
                ${(trade.confidence * 100).toFixed(1)}%
            </span></td>
            <td>${formatTime(trade.timestamp)}</td>
            <td><span class="status-${trade.status}">${trade.status}</span></td>
        </tr>
    `).join('');
}

function getConfidenceLevel(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ==================== PAGINATION ====================

function nextPage() {
    loadTrades(currentPage + 1);
}

function previousPage() {
    if (currentPage > 1) {
        loadTrades(currentPage - 1);
    }
}

// ==================== LOGGING ====================

function addLog(message, type = 'info') {
    const logsArea = document.getElementById('logsArea');
    const logEntry = document.createElement('p');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logsArea.appendChild(logEntry);
    logsArea.scrollTop = logsArea.scrollHeight;
    
    // Keep only last 50 logs
    while (logsArea.children.length > 50) {
        logsArea.removeChild(logsArea.firstChild);
    }
}

// ==================== FILTERS ====================

document.getElementById('signalFilter').addEventListener('input', (e) => {
    const filter = e.target.value.toUpperCase();
    const rows = document.querySelectorAll('#signalsBody tr');
    
    rows.forEach(row => {
        const pair = row.cells[0].textContent;
        row.style.display = pair.includes(filter) ? '' : 'none';
    });
});

document.getElementById('signalTypeFilter').addEventListener('change', (e) => {
    const type = e.target.value;
    const rows = document.querySelectorAll('#signalsBody tr');
    
    rows.forEach(row => {
        const signal = row.cells[1].textContent.trim();
        row.style.display = !type || signal === type ? '' : 'none';
    });
});
