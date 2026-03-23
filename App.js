// ============================================
// LIVROS DE RESPOSTAS - APP CONTROLLER
// Material 3 Expressive
// ============================================

class LivrosApp {
    constructor() {
        this.pdfs = this.loadFromStorage();
        this.currentDeleteId = null;
        this.currentFilter = 'all';
        this.searchQuery = '';

        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.initDragDrop();
        this.render();
    }

    // ---- ELEMENTS ----
    initElements() {
        this.fileInput = document.getElementById('fileInput');
        this.importBtn = document.getElementById('importBtn');
        this.emptyImportBtn = document.getElementById('emptyImportBtn');
        this.pdfGrid = document.getElementById('pdfGrid');
        this.emptyState = document.getElementById('emptyState');
        this.pdfCount = document.getElementById('pdfCount');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearch = document.getElementById('clearSearch');
        this.filterChips = document.getElementById('filterChips');
        this.themeToggle = document.getElementById('themeToggle');

        // Modal
        this.viewerModal = document.getElementById('viewerModal');
        this.viewerTitle = document.getElementById('viewerTitle');
        this.viewerDownload = document.getElementById('viewerDownload');
        this.viewerClose = document.getElementById('viewerClose');
        this.pdfFrame = document.getElementById('pdfFrame');

        // Delete dialog
        this.deleteDialog = document.getElementById('deleteDialog');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');

        // Snackbar
        this.snackbar = document.getElementById('snackbar');
        this.snackbarText = document.getElementById('snackbarText');
        this.snackbarAction = document.getElementById('snackbarAction');
    }

    // ---- EVENT LISTENERS ----
    initEventListeners() {
        // Import
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.emptyImportBtn?.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.clearSearch.hidden = !this.searchQuery;
            this.render();
        });
        this.clearSearch.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.clearSearch.hidden = true;
            this.render();
        });

        // Filter chips
        this.filterChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip-filter');
            if (!chip) return;
            this.filterChips.querySelectorAll('.chip-filter').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            this.currentFilter = chip.dataset.filter;
            this.render();
        });

        // Modal
        this.viewerClose.addEventListener('click', () => this.closeViewer());
        this.viewerModal.addEventListener('click', (e) => {
            if (e.target === this.viewerModal) this.closeViewer();
        });

        // Delete dialog
        this.cancelDelete.addEventListener('click', () => this.closeDeleteDialog());
        this.confirmDelete.addEventListener('click', () => this.executeDelete());
        this.deleteDialog.addEventListener('click', (e) => {
            if (e.target === this.deleteDialog) this.closeDeleteDialog();
        });

        // Snackbar
        this.snackbarAction.addEventListener('click', () => this.hideSnackbar());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeViewer();
                this.closeDeleteDialog();
            }
        });

        // Theme
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // ---- THEME ----
    initTheme() {
        const saved = localStorage.getItem('livros-theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateThemeIcon(saved);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('livros-theme', next);
        this.updateThemeIcon(next);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('.material-symbols-rounded');
        icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
    }

    // ---- DRAG & DROP ----
    initDragDrop() {
        // Create drag overlay
        const overlay = document.createElement('div');
        overlay.className = 'drag-overlay';
        overlay.innerHTML = `
            <div class="drag-overlay-content">
                <span class="material-symbols-rounded">upload_file</span>
                <h3>Solte seus PDFs aqui</h3>
            </div>
        `;
        document.body.appendChild(overlay);
        this.dragOverlay = overlay;

        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            this.dragOverlay.classList.add('active');
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                this.dragOverlay.classList.remove('active');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.dragOverlay.classList.remove('active');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length) this.handleFiles(files);
        });
    }

    // ---- FILE HANDLING ----
    handleFiles(files) {
        const fileArray = Array.from(files);
        let imported = 0;

        fileArray.forEach(file => {
            if (file.type !== 'application/pdf') return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const pdfData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name.replace('.pdf', ''),
                    size: this.formatSize(file.size),
                    date: new Date().toLocaleDateString('pt-BR'),
                    dateRaw: Date.now(),
                    data: e.target.result,
                    favorite: false
                };

                this.pdfs.push(pdfData);
                imported++;

                if (imported === fileArray.length) {
                    this.saveToStorage();
                    this.render();
                    this.showSnackbar(
                        imported === 1
                            ? `"${pdfData.name}" importado com sucesso!`
                            : `${imported} PDFs importados com sucesso!`
                    );
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        this.fileInput.value = '';
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // ---- STORAGE ----
    saveToStorage() {
        try {
            localStorage.setItem('livros-pdfs', JSON.stringify(this.pdfs));
        } catch (e) {
            // Storage full — try to notify
            if (e.name === 'QuotaExceededError') {
                this.showSnackbar('Armazenamento cheio! Remova alguns PDFs.');
            }
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('livros-pdfs');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // ---- FILTERING ----
    getFilteredPDFs() {
        let list = [...this.pdfs];

        // Search
        if (this.searchQuery) {
            list = list.filter(p => p.name.toLowerCase().includes(this.searchQuery));
        }

        // Filter
        switch (this.currentFilter) {
            case 'recent':
                list.sort((a, b) => b.dateRaw - a.dateRaw);
                list = list.slice(0, 5);
                break;
            case 'favorites':
                list = list.filter(p => p.favorite);
                break;
        }

        return list;
    }

    // ---- RENDER ----
    render() {
        const filtered = this.getFilteredPDFs();
        this.pdfCount.textContent = this.pdfs.length;

        // Clear grid (keep empty state reference)
        this.pdfGrid.innerHTML = '';

        if (this.pdfs.length === 0) {
            this.pdfGrid.innerHTML = `
                <div class="empty-state" id="emptyState">
                    <div class="empty-illustration">
                        <span class="material-symbols-rounded">auto_stories</span>
                    </div>
                    <h3>Nenhum livro ainda</h3>
                    <p>Importe seus PDFs para começar a organizar sua biblioteca de respostas.</p>
                    <button class="btn-tonal" id="emptyImportBtn">
                        <span class="material-symbols-rounded">upload_file</span>
                        Importar primeiro PDF
                    </button>
                </div>
            `;
            document.getElementById('emptyImportBtn')?.addEventListener('click', () => this.fileInput.click());
            return;
        }

        if (filtered.length === 0) {
            this.pdfGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-illustration">
                        <span class="material-symbols-rounded">search_off</span>
                    </div>
                    <h3>Nenhum resultado</h3>
                    <p>Tente buscar com outros termos ou mude o filtro.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((pdf, index) => {
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="card-thumbnail" data-action="view" data-id="${pdf.id}">
                    <span class="material-symbols-rounded">picture_as_pdf</span>
                    <div class="card-badge">
                        <span class="material-symbols-rounded">straighten</span>
                        ${pdf.size}
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-title" title="${pdf.name}">${pdf.name}</div>
                    <div class="card-subtitle">Importado em ${pdf.date}</div>
                    <div class="card-actions">
                        <button class="action-pill view" data-action="view" data-id="${pdf.id}">
                            <span class="material-symbols-rounded">visibility</span>
                            Ver
                        </button>
                        <button class="action-pill download" data-action="download" data-id="${pdf.id}">
                            <span class="material-symbols-rounded">download</span>
                            Baixar
                        </button>
                        <button class="action-pill favorite ${pdf.favorite ? 'active' : ''}" data-action="favorite" data-id="${pdf.id}">
                            <span class="material-symbols-rounded">${pdf.favorite ? 'favorite' : 'favorite_border'}</span>
                        </button>
                        <button class="action-pill delete" data-action="delete" data-id="${pdf.id}">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;

            // Event delegation on card
            card.addEventListener('click', (e) => {
                const actionEl = e.target.closest('[data-action]');
                if (!actionEl) return;

                const action = actionEl.dataset.action;
                const id = actionEl.dataset.id;

                switch (action) {
                    case 'view': this.openViewer(id); break;
                    case 'download': this.downloadPDF(id); break;
                    case 'favorite': this.toggleFavorite(id); break;
                    case 'delete': this.openDeleteDialog(id); break;
                }
            });

            this.pdfGrid.appendChild(card);
        });
    }

    // ---- VIEWER ----
    openViewer(id) {
        const pdf = this.pdfs.find(p => p.id === id);
        if (!pdf) return;

        this.viewerTitle.textContent = pdf.name;
        this.pdfFrame.src = pdf.data;
        this.viewerModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.viewerDownload.onclick = () => this.downloadPDF(id);
    }

    closeViewer() {
        this.viewerModal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            this.pdfFrame.src = '';
        }, 300);
    }

    // ---- DOWNLOAD ----
    downloadPDF(id) {
        const pdf = this.pdfs.find(p => p.id === id);
        if (!pdf) return;

        const link = document.createElement('a');
        link.href = pdf.data;
        link.download = pdf.name + '.pdf';
        link.click();

        this.showSnackbar(`"${pdf.name}" baixado!`);
    }

    // ---- FAVORITE ----
    toggleFavorite(id) {
        const pdf = this.pdfs.find(p => p.id === id);
        if (!pdf) return;

        pdf.favorite = !pdf.favorite;
        this.saveToStorage();
        this.render();

        this.showSnackbar(
            pdf.favorite
                ? `"${pdf.name}" adicionado aos favoritos`
                : `"${pdf.name}" removido dos favoritos`
        );
    }

    // ---- DELETE ----
    openDeleteDialog(id) {
        this.currentDeleteId = id;
        this.deleteDialog.classList.add('active');
    }

    closeDeleteDialog() {
        this.deleteDialog.classList.remove('active');
        this.currentDeleteId = null;
    }

    executeDelete() {
        if (!this.currentDeleteId) return;

        const pdf = this.pdfs.find(p => p.id === this.currentDeleteId);
        const name = pdf?.name || 'PDF';

        this.pdfs = this.pdfs.filter(p => p.id !== this.currentDeleteId);
        this.saveToStorage();
        this.closeDeleteDialog();
        this.render();

        this.showSnackbar(`"${name}" removido da biblioteca`);
    }

    // ---- SNACKBAR ----
    showSnackbar(text) {
        this.snackbarText.textContent = text;
        this.snackbar.classList.add('show');

        clearTimeout(this._snackTimer);
        this._snackTimer = setTimeout(() => this.hideSnackbar(), 4000);
    }

    hideSnackbar() {
        this.snackbar.classList.remove('show');
        clearTimeout(this._snackTimer);
    }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LivrosApp();
});
