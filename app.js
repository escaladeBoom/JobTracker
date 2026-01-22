// Job Tracker App
class JobTracker {
    constructor() {
        this.jobs = this.loadJobs();
        this.currentWeek = this.getCurrentWeekNumber();
        this.currentYear = new Date().getFullYear();
        this.editingJobId = null;

        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.modal = document.getElementById('jobModal');
        this.jobForm = document.getElementById('jobForm');
        this.jobsList = document.getElementById('jobsList');
        this.emptyState = document.getElementById('emptyState');
        this.currentWeekEl = document.getElementById('currentWeek');
        this.dateRangeEl = document.getElementById('dateRange');
    }

    attachEventListeners() {
        // Modal controls
        document.getElementById('addJobBtn').addEventListener('click', () => this.openModal());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());

        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.changeWeek(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToCurrentWeek());

        // Form submission
        this.jobForm.addEventListener('submit', (e) => this.handleSubmit(e));

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    getCurrentWeekNumber(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    getWeekDateRange(week, year) {
        const jan4 = new Date(year, 0, 4);
        const weekStart = new Date(jan4);
        weekStart.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const options = { day: '2-digit', month: '2-digit' };
        return `${weekStart.toLocaleDateString('de-DE', options)} - ${weekEnd.toLocaleDateString('de-DE', options)}`;
    }

    changeWeek(delta) {
        this.currentWeek += delta;

        // Handle year transitions
        if (this.currentWeek < 1) {
            this.currentYear--;
            this.currentWeek = 52;
        } else if (this.currentWeek > 52) {
            this.currentYear++;
            this.currentWeek = 1;
        }

        this.render();
    }

    goToCurrentWeek() {
        this.currentWeek = this.getCurrentWeekNumber();
        this.currentYear = new Date().getFullYear();
        this.render();
    }

    openModal(job = null) {
        this.editingJobId = job ? job.id : null;

        if (job) {
            document.getElementById('modalTitle').textContent = 'Bewerbung bearbeiten';
            document.getElementById('companyName').value = job.companyName;
            document.getElementById('position').value = job.position;
            document.getElementById('applicationDate').value = job.applicationDate;
            document.getElementById('status').value = job.status;
            document.getElementById('salary').value = job.salary || '';
            document.getElementById('notes').value = job.notes || '';
            document.getElementById('contactPerson').value = job.contactPerson || '';
            document.getElementById('url').value = job.url || '';
        } else {
            document.getElementById('modalTitle').textContent = 'Neue Bewerbung';
            this.jobForm.reset();
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('applicationDate').value = today;
        }

        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.jobForm.reset();
        this.editingJobId = null;
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = {
            companyName: document.getElementById('companyName').value,
            position: document.getElementById('position').value,
            applicationDate: document.getElementById('applicationDate').value,
            status: document.getElementById('status').value,
            salary: document.getElementById('salary').value,
            notes: document.getElementById('notes').value,
            contactPerson: document.getElementById('contactPerson').value,
            url: document.getElementById('url').value
        };

        if (this.editingJobId) {
            this.updateJob(this.editingJobId, formData);
        } else {
            this.addJob(formData);
        }

        this.closeModal();
    }

    addJob(jobData) {
        const job = {
            id: Date.now().toString(),
            ...jobData,
            createdAt: new Date().toISOString()
        };

        this.jobs.push(job);
        this.saveJobs();
        this.render();
    }

    updateJob(id, jobData) {
        const index = this.jobs.findIndex(j => j.id === id);
        if (index !== -1) {
            this.jobs[index] = {
                ...this.jobs[index],
                ...jobData,
                updatedAt: new Date().toISOString()
            };
            this.saveJobs();
            this.render();
        }
    }

    deleteJob(id) {
        if (confirm('Möchtest du diese Bewerbung wirklich löschen?')) {
            this.jobs = this.jobs.filter(j => j.id !== id);
            this.saveJobs();
            this.render();
        }
    }

    getJobsForCurrentWeek() {
        return this.jobs.filter(job => {
            const jobDate = new Date(job.applicationDate);
            const jobWeek = this.getCurrentWeekNumber(jobDate);
            const jobYear = jobDate.getFullYear();
            return jobWeek === this.currentWeek && jobYear === this.currentYear;
        });
    }

    getStatusLabel(status) {
        const labels = {
            applied: 'Beworben',
            screening: 'Screening',
            interview: 'Interview',
            offer: 'Angebot',
            rejected: 'Absage',
            accepted: 'Angenommen'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    renderStats(weekJobs) {
        const interviewCount = weekJobs.filter(j => j.status === 'interview').length;
        const offerCount = weekJobs.filter(j => j.status === 'offer' || j.status === 'accepted').length;

        document.getElementById('totalJobs').textContent = weekJobs.length;
        document.getElementById('interviewCount').textContent = interviewCount;
        document.getElementById('offerCount').textContent = offerCount;
    }

    renderJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';

        const notesHTML = job.notes ? `
            <div class="job-notes">
                <strong>Notizen:</strong> ${this.escapeHtml(job.notes)}
            </div>
        ` : '';

        const salaryHTML = job.salary ? `
            <div class="detail-item">
                <span class="detail-label">Gehalt:</span>
                <span class="detail-value">${this.escapeHtml(job.salary)}</span>
            </div>
        ` : '';

        const contactHTML = job.contactPerson ? `
            <div class="detail-item">
                <span class="detail-label">Kontakt:</span>
                <span class="detail-value">${this.escapeHtml(job.contactPerson)}</span>
            </div>
        ` : '';

        const urlHTML = job.url ? `
            <div class="detail-item">
                <span class="detail-label">Link:</span>
                <a href="${this.escapeHtml(job.url)}" target="_blank" style="color: var(--primary-color)">Zur Stelle →</a>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="job-header">
                <div class="job-title">
                    <h3>${this.escapeHtml(job.position)}</h3>
                    <div class="company">${this.escapeHtml(job.companyName)}</div>
                </div>
                <div class="job-actions">
                    <button class="btn-icon" onclick="app.openModal(${this.escapeHtml(JSON.stringify(job))})" title="Bearbeiten">✏️</button>
                    <button class="btn-icon" onclick="app.deleteJob('${job.id}')" title="Löschen">🗑️</button>
                </div>
            </div>
            <div class="job-details">
                <div class="detail-item">
                    <span class="detail-label">Datum:</span>
                    <span class="detail-value">${this.formatDate(job.applicationDate)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge status-${job.status}">${this.getStatusLabel(job.status)}</span>
                </div>
                ${salaryHTML}
                ${contactHTML}
                ${urlHTML}
            </div>
            ${notesHTML}
        `;

        return card;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        // Update week display
        this.currentWeekEl.textContent = `KW ${this.currentWeek}, ${this.currentYear}`;
        this.dateRangeEl.textContent = this.getWeekDateRange(this.currentWeek, this.currentYear);

        // Get jobs for current week
        const weekJobs = this.getJobsForCurrentWeek();

        // Update stats
        this.renderStats(weekJobs);

        // Render jobs
        this.jobsList.innerHTML = '';

        if (weekJobs.length === 0) {
            this.emptyState.classList.add('show');
            this.jobsList.style.display = 'none';
        } else {
            this.emptyState.classList.remove('show');
            this.jobsList.style.display = 'grid';

            // Sort by date (newest first)
            weekJobs.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

            weekJobs.forEach(job => {
                this.jobsList.appendChild(this.renderJobCard(job));
            });
        }
    }

    loadJobs() {
        const stored = localStorage.getItem('jobTrackerJobs');
        return stored ? JSON.parse(stored) : [];
    }

    saveJobs() {
        localStorage.setItem('jobTrackerJobs', JSON.stringify(this.jobs));
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new JobTracker();
});
