class BeatChartApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.recentSearches = this.loadRecentSearches();
        this.searchDebounceTimer = null;
        
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.renderRecentSearches();
        await this.loadData();
        this.applyTheme();
    }

    cacheElements() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.emptyState = document.getElementById('emptyState');
        this.recentSearchesContainer = document.getElementById('recentSearches');
        this.recentTagsContainer = document.getElementById('recentTags');
        this.resultCount = document.getElementById('resultCount');
        this.themeToggle = document.getElementById('themeToggle');
        this.exportBtn = document.getElementById('exportBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.tabBtns = document.querySelectorAll('.tab-btn');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.retryBtn.addEventListener('click', () => this.loadData());

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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    async loadData() {
        this.showState('loading');
        
        try {
            const response = await fetch('beat_chart.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            this.data = await response.json();
            this.filteredData = [...this.data];
            this.renderResults();
            this.showState('results');
        } catch (error) {
            console.error('Error loading JSON data:', error);
            this.showState('error');
        }
    }

    handleSearch(e) {
        const query = e.target.value.trim();
        
        clearTimeout(this.searchDebounceTimer);
        
        if (query.length > 0) {
            this.clearSearchBtn.classList.remove('hidden');
            this.searchDebounceTimer = setTimeout(() => {
                this.performSearch(query);
            }, 200);
        } else {
            this.clearSearchBtn.classList.add('hidden');
            this.filteredData = [...this.data];
            this.renderResults();
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
                        return beat.officers.some(officer => officer.toLowerCase().includes(searchQuery));
                    case 'village':
                        return beat.village.some(village => village.toLowerCase().includes(searchQuery));
                    default:
                        return beat.beat.toLowerCase().includes(searchQuery) ||
                               beat.officers.some(officer => officer.toLowerCase().includes(searchQuery)) ||
                               beat.village.some(village => village.toLowerCase().includes(searchQuery));
                }
            });
        }

        this.renderResults(query);
        this.updateResultCount();
        
        if (query && this.recentSearches.length > 0) {
            this.recentSearches = this.recentSearches.filter(s => s !== query);
        }
        
        if (query) {
            this.recentSearches.unshift(query);
            this.recentSearches = this.recentSearches.slice(0, 8);
            this.saveRecentSearches();
            this.renderRecentSearches();
        }

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
        this.showState('results');
        this.searchInput.focus();
    }

    renderResults(searchQuery = '') {
        this.resultsContainer.innerHTML = '';

        this.filteredData.forEach(beat => {
            const card = this.createBeatCard(beat, searchQuery);
            this.resultsContainer.appendChild(card);
        });
    }

    createBeatCard(beat, searchQuery = '') {
        const card = document.createElement('div');
        card.className = 'beat-card';

        const officersHtml = beat.officers.map(officer => 
            `<span class="officer-tag">${this.escapeHtml(officer)}</span>`
        ).join('');

        const villagesHtml = beat.village.map(village => {
            const isMatch = searchQuery && village.toLowerCase().includes(searchQuery.toLowerCase());
            return `<span class="village-tag ${isMatch ? 'highlight' : ''}">${this.escapeHtml(village)}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="beat-card-header">
                <h2 class="beat-title">${this.escapeHtml(beat.beat)}</h2>
                <button class="copy-btn" data-beat="${this.escapeHtml(beat.beat)}">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    کاپی
                </button>
            </div>
            <div class="officers-section">
                <div class="section-label">افسران:</div>
                <div class="officer-list">${officersHtml}</div>
            </div>
            <div class="villages-section">
                <div class="section-label">گاؤں:</div>
                <div class="village-grid">${villagesHtml}</div>
            </div>
        `;

        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => this.copyBeatInfo(beat, copyBtn));

        return card;
    }

    async copyBeatInfo(beat, button) {
        const text = `بیٹ: ${beat.beat}\nافسران: ${beat.officers.join(', ')}\nگاؤں: ${beat.village.join(', ')}`;
        
        try {
            await navigator.clipboard.writeText(text);
            button.classList.add('copied');
            button.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                کاپی ہو گیا
            `;
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    کاپی
                `;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    renderRecentSearches() {
        this.recentTagsContainer.innerHTML = '';
        
        if (this.recentSearches.length === 0) {
            this.recentSearchesContainer.classList.add('hidden');
            return;
        }

        this.recentSearchesContainer.classList.remove('hidden');

        this.recentSearches.forEach(search => {
            const tag = document.createElement('button');
            tag.className = 'recent-tag';
            tag.textContent = search;
            tag.addEventListener('click', () => {
                this.searchInput.value = search;
                this.clearSearchBtn.classList.remove('hidden');
                this.performSearch(search);
            });
            this.recentTagsContainer.appendChild(tag);
        });
    }

    loadRecentSearches() {
        try {
            const stored = localStorage.getItem('beatChartRecentSearches');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveRecentSearches() {
        try {
            localStorage.setItem('beatChartRecentSearches', JSON.stringify(this.recentSearches));
        } catch (err) {
            console.error('Failed to save recent searches:', err);
        }
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
        localStorage.setItem('beatChartTheme', newTheme);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('beatChartTheme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    updateResultCount() {
        const count = this.filteredData.length;
        const total = this.data.length;
        this.resultCount.textContent = `${count} / ${total} بیٹ`;
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
