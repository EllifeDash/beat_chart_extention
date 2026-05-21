class BeatChartApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.editingIndex = -1;

        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.applyTheme();
        await this.loadData();
    }

    cacheElements() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.emptyState = document.getElementById('emptyState');
        this.resultCount = document.getElementById('resultCount');
        this.themeToggle = document.getElementById('themeToggle');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.retryBtn = document.getElementById('retryBtn');
        this.addBeatBtn = document.getElementById('addBeatBtn');
        this.tabBtns = document.querySelectorAll('.tab-btn');

        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalClose = document.getElementById('modalClose');
        this.cancelModalBtn = document.getElementById('cancelModalBtn');
        this.saveModalBtn = document.getElementById('saveModalBtn');
        this.beatForm = document.getElementById('beatForm');
        this.editIndexInput = document.getElementById('editIndex');
        this.beatNameInput = document.getElementById('beatName');
        this.officersContainer = document.getElementById('officersContainer');
        this.villagesContainer = document.getElementById('villagesContainer');
        this.addOfficerBtn = document.getElementById('addOfficerBtn');
        this.addVillageBtn = document.getElementById('addVillageBtn');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.importBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.handleImport(e));
        this.retryBtn.addEventListener('click', () => this.loadData());
        this.addBeatBtn.addEventListener('click', () => this.openCreateModal());

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                this.currentFilter = btn.dataset.filter;
                this.performSearch();
            });
        });

        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelModalBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
        this.saveModalBtn.addEventListener('click', () => this.saveForm());

        this.addOfficerBtn.addEventListener('click', () => this.addOfficerRow());
        this.addVillageBtn.addEventListener('click', () => this.addVillageRow());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.modalOverlay.classList.contains('hidden')) {
                    this.closeModal();
                } else {
                    this.clearSearch();
                }
            }
        });
    }

    async loadData() {
        this.showState('loading');

        try {
            const result = await chrome.storage.local.get('beatChartData');
            if (result.beatChartData && result.beatChartData.length > 0) {
                this.data = result.beatChartData;
            } else {
                const response = await fetch('beat_chart.json');
                if (!response.ok) throw new Error('Network response was not ok');
                const raw = await response.json();
                this.data = raw.map(item => ({
                    beat: item.beat || '',
                    officers: Array.isArray(item.officers) ? item.officers.map(o =>
                        typeof o === 'string' ? this.parseOfficerString(o) : o
                    ) : [],
                    village: Array.isArray(item.village) ? item.village : []
                }));
                await this.saveData();
            }
            this.filteredData = [...this.data];
            this.renderResults();
            this.updateResultCount();
            this.showState('results');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showState('error');
        }
    }

    async saveData() {
        await chrome.storage.local.set({ beatChartData: this.data });
    }

    handleSearch(e) {
        const query = e.target.value.trim();

        if (query.length > 0) {
            this.clearSearchBtn.classList.remove('hidden');
            this.performSearch(query);
        } else {
            this.clearSearchBtn.classList.add('hidden');
            this.filteredData = [...this.data];
            this.renderResults();
            this.updateResultCount();
            this.showState('results');
        }
    }

    performSearch(query = this.searchInput.value.trim()) {
        if (!query) {
            this.filteredData = [...this.data];
        } else {
            const searchQuery = query.toLowerCase();

            this.filteredData = this.data.filter(beat => {
                switch (this.currentFilter) {
                    case 'beat':
                        return beat.beat.toLowerCase().includes(searchQuery);
                    case 'officer':
                        return beat.officers.some(officer => officer.name.toLowerCase().includes(searchQuery) ||
                            (officer.contact && officer.contact.toLowerCase().includes(searchQuery)) ||
                            (officer.cnic && officer.cnic.toLowerCase().includes(searchQuery)));
                    case 'village':
                        return beat.village.some(village => village.toLowerCase().includes(searchQuery));
                    default:
                        return beat.beat.toLowerCase().includes(searchQuery) ||
                            beat.officers.some(officer => officer.name.toLowerCase().includes(searchQuery) ||
                                (officer.contact && officer.contact.toLowerCase().includes(searchQuery)) ||
                                (officer.cnic && officer.cnic.toLowerCase().includes(searchQuery))) ||
                            beat.village.some(village => village.toLowerCase().includes(searchQuery));
                }
            });
        }

        this.renderResults(query);
        this.updateResultCount();

        if (this.filteredData.length === 0) {
            this.showState('empty');
        } else {
            this.showState('results');
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchBtn.classList.add('hidden');
        this.filteredData = [...this.data];
        this.renderResults();
        this.updateResultCount();
        this.showState('results');
        this.searchInput.focus();
    }

    renderResults(searchQuery = '') {
        this.resultsContainer.innerHTML = '';

        switch (this.currentFilter) {
            case 'beat':
                this.renderBeatList(searchQuery);
                break;
            case 'officer':
                this.renderOfficerList(searchQuery);
                break;
            case 'village':
                this.renderVillageList(searchQuery);
                break;
            default:
                this.renderFullCards(searchQuery);
                break;
        }
    }

    renderFullCards(searchQuery) {
        this.filteredData.forEach((beat) => {
            const realIndex = this.data.indexOf(beat);
            const card = this.createBeatCard(beat, searchQuery, realIndex);
            this.resultsContainer.appendChild(card);
        });
    }

    renderBeatList(searchQuery) {
        this.filteredData.forEach((beat) => {
            const realIndex = this.data.indexOf(beat);
            const item = document.createElement('div');
            item.className = 'simple-list-item';
            item.innerHTML = `
                <div class="simple-item-content">
                    <span class="simple-item-title">${this.escapeHtml(beat.beat)}</span>
                    <span class="simple-item-meta">${beat.village.length} گاؤں · ${beat.officers.length} افسر</span>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn edit-btn" data-index="${realIndex}" title="ترمیم">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="card-action-btn delete-btn" data-index="${realIndex}" title="حذف">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;
            item.querySelector('.edit-btn').addEventListener('click', () => this.openEditModal(parseInt(item.querySelector('.edit-btn').dataset.index)));
            item.querySelector('.delete-btn').addEventListener('click', () => this.deleteBeat(parseInt(item.querySelector('.delete-btn').dataset.index)));
            this.resultsContainer.appendChild(item);
        });
    }

    renderOfficerList(searchQuery) {
        const officerMap = [];
        this.filteredData.forEach((beat) => {
            const realIndex = this.data.indexOf(beat);
            beat.officers.forEach((officer) => {
                officerMap.push({ ...officer, beatName: beat.beat, beatIndex: realIndex });
            });
        });

        officerMap.forEach((officer) => {
            const item = document.createElement('div');
            item.className = 'simple-list-item';
            const copyTarget = officer.cnic || officer.contact || officer.name;
            const copyLabel = officer.cnic ? 'CNIC' : (officer.contact ? 'فون' : 'کاپی');

            item.innerHTML = `
                <div class="simple-item-content">
                    <span class="simple-item-title">${this.escapeHtml(officer.name)}</span>
                    <span class="simple-item-meta">${this.escapeHtml(officer.beatName)}</span>
                    ${officer.contact ? `<span class="simple-item-detail">${this.escapeHtml(officer.contact)}</span>` : ''}
                    ${officer.cnic ? `<span class="simple-item-detail cnic">${this.escapeHtml(officer.cnic)}</span>` : ''}
                </div>
                <div class="simple-item-actions">
                    <button class="copy-cnic-btn" data-copy="${this.escapeHtml(copyTarget)}" title="${copyLabel} کاپی کریں">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                    <button class="card-action-btn edit-btn" data-index="${officer.beatIndex}" title="ترمیم">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                </div>
            `;
            item.querySelector('.copy-cnic-btn').addEventListener('click', (e) => this.copyText(e.currentTarget.dataset.copy, e.currentTarget));
            item.querySelector('.edit-btn').addEventListener('click', () => this.openEditModal(parseInt(item.querySelector('.edit-btn').dataset.index)));
            this.resultsContainer.appendChild(item);
        });
    }

    renderVillageList(searchQuery) {
        const villageMap = [];
        this.filteredData.forEach((beat) => {
            const realIndex = this.data.indexOf(beat);
            beat.village.forEach((village) => {
                villageMap.push({ name: village, beatName: beat.beat, beatIndex: realIndex });
            });
        });

        villageMap.forEach((village) => {
            const item = document.createElement('div');
            item.className = 'simple-list-item';
            item.innerHTML = `
                <div class="simple-item-content">
                    <span class="simple-item-title">${this.escapeHtml(village.name)}</span>
                    <span class="simple-item-meta">${this.escapeHtml(village.beatName)}</span>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn edit-btn" data-index="${village.beatIndex}" title="ترمیم">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                </div>
            `;
            item.querySelector('.edit-btn').addEventListener('click', () => this.openEditModal(parseInt(item.querySelector('.edit-btn').dataset.index)));
            this.resultsContainer.appendChild(item);
        });
    }

    createBeatCard(beat, searchQuery = '', realIndex) {
        const card = document.createElement('div');
        card.className = 'beat-card';

        const officersHtml = beat.officers.map(officer => {
            const copyTarget = officer.cnic || officer.contact || officer.name;
            const copyLabel = officer.cnic ? 'CNIC' : (officer.contact ? 'فون' : 'کاپی');

            return `
                <div class="officer-card">
                    <div class="officer-info">
                        <span class="officer-name">${this.escapeHtml(officer.name)}</span>
                        ${officer.contact ? `<span class="officer-contact">${this.escapeHtml(officer.contact)}</span>` : ''}
                        ${officer.cnic ? `<span class="officer-cnic">${this.escapeHtml(officer.cnic)}</span>` : ''}
                    </div>
                    <button class="copy-cnic-btn" data-copy="${this.escapeHtml(copyTarget)}" title="${copyLabel} کاپی کریں">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        const matchingVillages = searchQuery
            ? beat.village.filter(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
            : [];

        const allVillagesHtml = beat.village.map(village => {
            const isMatch = matchingVillages.some(m => m.trim() === village.trim());
            return `<span class="village-tag ${isMatch ? 'highlight' : ''}">${this.escapeHtml(village)}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="beat-header">
                <h2 class="beat-title">${this.escapeHtml(beat.beat)}</h2>
                <div class="card-actions">
                    <button class="card-action-btn edit-btn" data-index="${realIndex}" title="ترمیم">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="card-action-btn delete-btn" data-index="${realIndex}" title="حذف">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="officers-section">
                <div class="section-label">افسران:</div>
                <div class="officers-list">${officersHtml}</div>
            </div>
            <div class="villages-section">
                <div class="section-label">گاؤں:</div>
                <div class="village-grid">${allVillagesHtml}</div>
            </div>
        `;

        card.querySelectorAll('.copy-cnic-btn').forEach(btn => {
            btn.addEventListener('click', () => this.copyText(btn.dataset.copy, btn));
        });

        card.querySelector('.edit-btn').addEventListener('click', () => {
            this.openEditModal(parseInt(card.querySelector('.edit-btn').dataset.index));
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteBeat(parseInt(card.querySelector('.delete-btn').dataset.index));
        });

        return card;
    }

    async copyText(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            button.classList.add('copied');
            setTimeout(() => button.classList.remove('copied'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    async deleteBeat(index) {
        if (confirm('کیا آپ واقعی اس بیٹ کو حذف کرنا چاہتے ہیں؟')) {
            this.data.splice(index, 1);
            await this.saveData();
            this.filteredData = [...this.data];
            this.renderResults();
            this.updateResultCount();
            if (this.filteredData.length === 0) {
                this.showState('empty');
            }
        }
    }

    openCreateModal() {
        this.editingIndex = -1;
        this.editIndexInput.value = '-1';
        this.modalTitle.textContent = 'نیا بیٹ شامل کریں';
        this.beatNameInput.value = '';
        this.officersContainer.innerHTML = '';
        this.villagesContainer.innerHTML = '';
        this.addOfficerRow();
        this.addVillageRow();
        this.modalOverlay.classList.remove('hidden');
        this.beatNameInput.focus();
    }

    openEditModal(index) {
        const beat = this.data[index];
        if (!beat) return;

        this.editingIndex = index;
        this.editIndexInput.value = index.toString();
        this.modalTitle.textContent = 'بیٹ میں ترمیم';
        this.beatNameInput.value = beat.beat;
        this.officersContainer.innerHTML = '';
        this.villagesContainer.innerHTML = '';

        if (beat.officers.length === 0) {
            this.addOfficerRow();
        } else {
            beat.officers.forEach(o => this.addOfficerRow(o.name, o.contact, o.cnic));
        }

        if (beat.village.length === 0) {
            this.addVillageRow();
        } else {
            beat.village.forEach(v => this.addVillageRow(v));
        }

        this.modalOverlay.classList.remove('hidden');
        this.beatNameInput.focus();
    }

    closeModal() {
        this.modalOverlay.classList.add('hidden');
        this.beatForm.reset();
    }

    addOfficerRow(name = '', contact = '', cnic = '') {
        const row = document.createElement('div');
        row.className = 'officer-row';
        row.innerHTML = `
            <input type="text" placeholder="نام" value="${this.escapeHtml(name)}" class="officer-name-input">
            <input type="text" placeholder="فون" value="${this.escapeHtml(contact)}" class="officer-contact-input" dir="ltr">
            <input type="text" placeholder="CNIC" value="${this.escapeHtml(cnic)}" class="officer-cnic-input" dir="ltr">
            <button type="button" class="remove-row-btn" title="ہٹائیں">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        row.querySelector('.remove-row-btn').addEventListener('click', () => {
            if (this.officersContainer.children.length > 1) {
                row.remove();
            }
        });
        this.officersContainer.appendChild(row);
    }

    addVillageRow(value = '') {
        const row = document.createElement('div');
        row.className = 'village-row';
        row.innerHTML = `
            <input type="text" placeholder="گاؤں کا نام" value="${this.escapeHtml(value)}" class="village-input">
            <button type="button" class="remove-row-btn" title="ہٹائیں">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        row.querySelector('.remove-row-btn').addEventListener('click', () => {
            if (this.villagesContainer.children.length > 1) {
                row.remove();
            }
        });
        this.villagesContainer.appendChild(row);
    }

    async saveForm() {
        const beatName = this.beatNameInput.value.trim();
        if (!beatName) {
            this.beatNameInput.focus();
            this.beatNameInput.style.borderColor = 'var(--danger)';
            setTimeout(() => this.beatNameInput.style.borderColor = '', 2000);
            return;
        }

        const officers = [];
        this.officersContainer.querySelectorAll('.officer-row').forEach(row => {
            const name = row.querySelector('.officer-name-input').value.trim();
            const contact = row.querySelector('.officer-contact-input').value.trim();
            const cnic = row.querySelector('.officer-cnic-input').value.trim();
            if (name) {
                officers.push({ name, contact: contact || null, cnic: cnic || null });
            }
        });

        const villages = [];
        this.villagesContainer.querySelectorAll('.village-row').forEach(row => {
            const val = row.querySelector('.village-input').value.trim();
            if (val) villages.push(val);
        });

        const beatEntry = { beat: beatName, officers, village: villages };

        if (this.editingIndex >= 0) {
            this.data[this.editingIndex] = beatEntry;
        } else {
            this.data.push(beatEntry);
        }

        await this.saveData();
        this.closeModal();
        this.filteredData = [...this.data];
        this.renderResults();
        this.updateResultCount();
        this.showState('results');
    }

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const imported = JSON.parse(text);

            if (!Array.isArray(imported) || imported.length === 0) {
                alert('غلط فائل فارمیٹ');
                return;
            }

            const normalized = imported.map(item => ({
                beat: item.beat || '',
                officers: Array.isArray(item.officers) ? item.officers.map(o =>
                    typeof o === 'string' ? this.parseOfficerString(o) : o
                ) : [],
                village: Array.isArray(item.village) ? item.village : []
            }));

            if (this.data.length === 0) {
                this.data = normalized;
                await this.saveData();
            } else {
                const choice = confirm('امپورٹ شدہ ڈیٹا شامل کرنا ہے؟\n\nOK = شامل کریں (Merge)\nCancel = پرانا ڈیٹا ہٹا کر نیا ڈالیں (Overwrite)');
                if (choice) {
                    this.data = [...this.data, ...normalized];
                } else {
                    this.data = normalized;
                }
                await this.saveData();
            }

            this.filteredData = [...this.data];
            this.renderResults();
            this.updateResultCount();
            this.showState('results');
        } catch (err) {
            console.error('Import error:', err);
            alert('فائل پڑھنے میں خرابی');
        }

        this.importFileInput.value = '';
    }

    parseOfficerString(raw) {
        const trimmed = raw.trim();
        const parts = trimmed.split(/\s*[-–—]\s*/);

        const result = { name: trimmed, contact: null, cnic: null };

        if (parts.length >= 3) {
            result.name = parts[0].trim();
            result.contact = parts[1].trim();
            result.cnic = parts[2].trim();
        } else if (parts.length === 2) {
            const maybeCnic = parts[1].trim();
            if (maybeCnic.match(/^\d{5}[-–]\d{7}[-–]\d{1}$/)) {
                result.name = parts[0].trim();
                result.cnic = maybeCnic;
            } else if (maybeCnic.match(/^\d{11,}$/)) {
                result.name = parts[0].trim();
                result.contact = maybeCnic;
            }
        }

        return result;
    }

    exportData() {
        const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.data;
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `beat_chart_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ beatChartTheme: newTheme });
    }

    applyTheme() {
        chrome.storage.local.get('beatChartTheme', (result) => {
            if (result.beatChartTheme) {
                document.documentElement.setAttribute('data-theme', result.beatChartTheme);
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        });
    }

    updateResultCount() {
        const total = this.data.length;

        switch (this.currentFilter) {
            case 'officer': {
                const count = this.filteredData.reduce((sum, b) => sum + b.officers.length, 0);
                const totalOfficers = this.data.reduce((sum, b) => sum + b.officers.length, 0);
                this.resultCount.textContent = `${count} / ${totalOfficers} افسر`;
                break;
            }
            case 'village': {
                const count = this.filteredData.reduce((sum, b) => sum + b.village.length, 0);
                const totalVillages = this.data.reduce((sum, b) => sum + b.village.length, 0);
                this.resultCount.textContent = `${count} / ${totalVillages} گاؤں`;
                break;
            }
            default: {
                const count = this.filteredData.length;
                this.resultCount.textContent = `${count} / ${total} بیٹ`;
                break;
            }
        }
    }

    showState(state) {
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.emptyState.classList.add('hidden');
        this.resultsContainer.classList.add('hidden');

        switch (state) {
            case 'loading':
                this.loadingState.classList.remove('hidden');
                break;
            case 'error':
                this.errorState.classList.remove('hidden');
                break;
            case 'empty':
                this.emptyState.classList.remove('hidden');
                break;
            case 'results':
                this.resultsContainer.classList.remove('hidden');
                break;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BeatChartApp();
});
