// VibeBench Dashboard Script

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnOpenTriggerModal = document.getElementById('btn-open-trigger-modal');
    const btnCloseTriggerModal = document.getElementById('btn-close-trigger-modal');
    const btnCancelTrigger = document.getElementById('btn-cancel-trigger');
    const triggerModal = document.getElementById('trigger-modal');
    
    const btnCloseDetailsModal = document.getElementById('btn-close-details-modal');
    const detailsModal = document.getElementById('details-modal');
    
    const formTriggerBenchmark = document.getElementById('form-trigger-benchmark');
    
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const runsContainer = document.getElementById('runs-container');
    
    // Stats elements
    const statTotalRuns = document.getElementById('stat-total-runs');
    const statTopModel = document.getElementById('stat-top-model');
    const statAvgLatency = document.getElementById('stat-avg-latency');
    const statTotalCost = document.getElementById('stat-total-cost');

    // Details Modal elements
    const detailsTitle = document.getElementById('details-title');
    const detailOverallScore = document.getElementById('detail-overall-score');
    const barAccuracy = document.getElementById('bar-accuracy');
    const barQuality = document.getElementById('bar-quality');
    const barRealism = document.getElementById('bar-realism');
    const barSecurity = document.getElementById('bar-security');
    const barCostLatency = document.getElementById('bar-cost-latency');
    const valAccuracy = document.getElementById('val-accuracy');
    const valQuality = document.getElementById('val-quality');
    const valRealism = document.getElementById('val-realism');
    const valSecurity = document.getElementById('val-security');
    const valCostLatency = document.getElementById('val-cost-latency');
    const detailLatency = document.getElementById('detail-latency');
    const detailCost = document.getElementById('detail-cost');
    const detailStatus = document.getElementById('detail-status');
    const detailLogs = document.getElementById('detail-logs');

    let activeJobId = null;

    // Modal Control
    btnOpenTriggerModal.addEventListener('click', () => {
        triggerModal.classList.add('active');
    });
    
    const closeTriggerModal = () => {
        triggerModal.classList.remove('active');
        formTriggerBenchmark.reset();
    };
    
    btnCloseTriggerModal.addEventListener('click', closeTriggerModal);
    btnCancelTrigger.addEventListener('click', closeTriggerModal);
    
    btnCloseDetailsModal.addEventListener('click', () => {
        detailsModal.classList.remove('active');
        activeJobId = null;
    });

    // Submit Benchmark Request
    formTriggerBenchmark.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            model_name: document.getElementById('input-model-name').value,
            apikey: document.getElementById('input-apikey').value || null,
            reference_repo: document.getElementById('input-ref-repo').value || null,
            "prompt/plan.md": document.getElementById('input-prompt').value
        };

        try {
            const response = await fetch('/api/v1/model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 202) {
                const data = await response.json();
                console.log('Job accepted:', data.job_id);
                closeTriggerModal();
                fetchData();
            } else {
                const errData = await response.json();
                alert('Error: ' + (errData.error || 'Failed to trigger benchmark'));
            }
        } catch (error) {
            console.error('Network error when triggering benchmark:', error);
            alert('Failed to connect to the server.');
        }
    });

    // Fetch and Load Data
    const fetchData = async () => {
        try {
            // Fetch Leaderboard
            const leaderboardRes = await fetch('/api/v1/leaderboard');
            const leaderboard = await leaderboardRes.json();
            renderLeaderboard(leaderboard);

            // Fetch Run History / Queue
            const runsRes = await fetch('/api/v1/model');
            const runs = await runsRes.json();
            renderRuns(runs);
            calculateStats(runs, leaderboard);

            // Refresh details if modal is open
            if (activeJobId) {
                await refreshRunDetails(activeJobId);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const renderLeaderboard = (list) => {
        if (!list || list.length === 0) {
            leaderboardContainer.innerHTML = '<div class="loading-state">No models evaluated yet. Run a benchmark!</div>';
            return;
        }

        leaderboardContainer.innerHTML = list.map((entry, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-meta">
                        <div class="leaderboard-model">${entry.modelName}</div>
                        <div class="leaderboard-details">
                            <span>Runs: <strong>${entry.runCount}</strong></span>
                            <span>Avg Latency: <strong>${(entry.avgLatencyMs / 1000).toFixed(1)}s</strong></span>
                            <span>Avg Cost: <strong>$${entry.avgCostUsd.toFixed(4)}</strong></span>
                        </div>
                    </div>
                    <div class="leaderboard-score">
                        <div class="score-badge">${entry.score.toFixed(1)}</div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderRuns = (list) => {
        if (!list || list.length === 0) {
            runsContainer.innerHTML = '<div class="loading-state">No active or historic runs.</div>';
            return;
        }

        // Sort runs by created date descending
        const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        runsContainer.innerHTML = sorted.map((run) => {
            const time = new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let scoreText = 'N/A';
            if (run.score !== null && run.score !== undefined) {
                scoreText = run.score.toFixed(1);
            }

            let statusClass = 'status-queued';
            if (run.status === 'RUNNING') statusClass = 'status-running';
            else if (run.status === 'COMPLETED') statusClass = 'status-completed';
            else if (run.status === 'FAILED') statusClass = 'status-failed';

            return `
                <div class="run-item" onclick="openRunDetails('${run.jobId}')">
                    <div class="run-info">
                        <h4>${run.modelName}</h4>
                        <p>Triggered at ${time} | Score: <strong>${scoreText}</strong></p>
                    </div>
                    <div class="run-status-section">
                        <span class="status-badge ${statusClass}">${run.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    const calculateStats = (runs, leaderboard) => {
        statTotalRuns.textContent = runs.length;
        
        if (leaderboard && leaderboard.length > 0) {
            statTopModel.textContent = leaderboard[0].modelName;
        } else {
            statTopModel.textContent = 'N/A';
        }

        // Calculate average latency and cost
        const completedRuns = runs.filter(r => r.status === 'COMPLETED' && r.metrics);
        if (completedRuns.length > 0) {
            const sumLatency = completedRuns.reduce((sum, r) => sum + (r.metrics.latencyMs || 0), 0);
            statAvgLatency.textContent = ((sumLatency / completedRuns.length) / 1000).toFixed(1) + 's';

            const sumCost = completedRuns.reduce((sum, r) => sum + (r.metrics.costUsd || 0), 0);
            statTotalCost.textContent = '$' + sumCost.toFixed(3);
        } else {
            statAvgLatency.textContent = '0.0s';
            statTotalCost.textContent = '$0.00';
        }
    };

    const refreshRunDetails = async (jobId) => {
        try {
            const response = await fetch(`/api/v1/job/${jobId}`);
            const run = await response.json();
            
            if (activeJobId !== jobId) return;

            detailsTitle.innerHTML = `${run.modelName} <span class="status-badge status-${run.status.toLowerCase()}">${run.status}</span>`;
            detailStatus.textContent = run.status;
            
            if (run.status === 'COMPLETED') {
                detailOverallScore.textContent = run.score !== null ? run.score.toFixed(1) : '0.0';
                
                const accuracy = run.metrics.functionalAccuracy * 100;
                const quality = run.metrics.codeQuality * 100;
                const realism = run.metrics.productionRealism * 100;
                const security = run.metrics.security * 100;
                const costLatency = run.metrics.costLatency * 100;

                // Update meters
                barAccuracy.style.width = accuracy + '%';
                valAccuracy.textContent = accuracy.toFixed(0) + '%';

                barQuality.style.width = quality + '%';
                valQuality.textContent = quality.toFixed(0) + '%';

                barRealism.style.width = realism + '%';
                valRealism.textContent = realism.toFixed(0) + '%';

                barSecurity.style.width = security + '%';
                valSecurity.textContent = security.toFixed(0) + '%';

                barCostLatency.style.width = costLatency + '%';
                valCostLatency.textContent = costLatency.toFixed(0) + '%';

                detailLatency.textContent = ((run.metrics.latencyMs || 0) / 1000).toFixed(1) + 's';
                detailCost.textContent = '$' + (run.metrics.costUsd || 0).toFixed(4);
            } else {
                detailOverallScore.textContent = 'N/A';
                barAccuracy.style.width = '0%';
                valAccuracy.textContent = 'N/A';
                barQuality.style.width = '0%';
                valQuality.textContent = 'N/A';
                barRealism.style.width = '0%';
                valRealism.textContent = 'N/A';
                barSecurity.style.width = '0%';
                valSecurity.textContent = 'N/A';
                barCostLatency.style.width = '0%';
                valCostLatency.textContent = 'N/A';
                detailLatency.textContent = 'N/A';
                detailCost.textContent = 'N/A';
            }

            if (run.logs) {
                detailLogs.textContent = run.logs;
                // Auto-scroll to the bottom of the terminal logs
                detailLogs.scrollTop = detailLogs.scrollHeight;
            } else if (run.errorDetails) {
                detailLogs.textContent = 'ERROR ENCOUNTERED:\n' + run.errorDetails;
            } else {
                detailLogs.textContent = 'No logs available yet (job may be queued or running).';
            }

        } catch (error) {
            console.error('Error refreshing job details:', error);
        }
    };

    window.openRunDetails = async (jobId) => {
        activeJobId = jobId;
        detailsModal.classList.add('active');
        detailLogs.textContent = 'Loading logs...';
        await refreshRunDetails(jobId);
    };

    // Initial Fetch & Start Polling
    fetchData();
    setInterval(fetchData, 4000); // Poll dashboard data every 4 seconds
});
