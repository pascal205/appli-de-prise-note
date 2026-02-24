class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentEditId = null;
        this.currentViewId = null;
        this.deleteCallback = null;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initModals();
        this.displayNotes();
        this.updateStats();
        this.checkEmptyState();
    }

    cacheDOM() {
        // Éléments principaux
        this.notesGrid = document.getElementById('notesGrid');
        this.emptyState = document.getElementById('emptyState');
        this.totalNotesEl = document.getElementById('totalNotes');
        this.lastNoteEl = document.getElementById('lastNote');
        
        // Modals
        this.noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
        this.viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
        
        // Formulaires et inputs
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.noteColor = document.getElementById('noteColor');
        this.modalTitle = document.getElementById('modalTitle');
        
        // Boutons
        this.addNoteBtn = document.getElementById('addNoteBtn');
        this.emptyStateBtn = document.getElementById('emptyStateBtn');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.deleteAllBtn = document.getElementById('deleteAllBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        this.editFromViewBtn = document.getElementById('editFromViewBtn');
        this.deleteFromViewBtn = document.getElementById('deleteFromViewBtn');
        
        // Recherche
        this.globalSearch = document.getElementById('globalSearch');
        this.clearGlobalSearch = document.getElementById('clearGlobalSearch');
        
        // Éléments du modal de visualisation
        this.viewModalTitle = document.getElementById('viewModalTitle');
        this.viewModalHeader = document.getElementById('viewModalHeader');
        this.viewModalDate = document.getElementById('viewModalDate');
        this.viewModalCategory = document.getElementById('viewModalCategory');
        this.viewModalContent = document.getElementById('viewModalContent');
    }

    bindEvents() {
        // Boutons principaux
        this.addNoteBtn.addEventListener('click', () => this.openAddModal());
        this.emptyStateBtn.addEventListener('click', () => this.openAddModal());
        this.saveNoteBtn.addEventListener('click', () => this.handleSaveNote());
        this.deleteAllBtn.addEventListener('click', () => this.openDeleteAllModal());
        this.helpBtn.addEventListener('click', () => this.helpModal.show());
        
        // Recherche
        this.globalSearch.addEventListener('input', () => this.handleSearch());
        this.clearGlobalSearch.addEventListener('click', () => this.clearSearch());
        
        // Boutons du modal de visualisation
        this.editFromViewBtn.addEventListener('click', () => this.editFromView());
        this.deleteFromViewBtn.addEventListener('click', () => this.deleteFromView());
        
        // Fermeture des modals
        document.getElementById('noteModal').addEventListener('hidden.bs.modal', () => this.resetForm());
    }

    initModals() {
        // Initialisation du sélecteur de couleurs
        this.initColorPicker();
        
        // Centrage automatique des modals (déjà géré par Bootstrap)
        // Mais on s'assure que tous les modals ont la classe modal-dialog-centered
    }

    initColorPicker() {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.noteColor.value = option.dataset.color;
            });
        });
    }

    openAddModal() {
        this.resetForm();
        this.modalTitle.innerHTML = '<i class="fas fa-pen-fancy me-2"></i>Nouvelle note';
        this.currentEditId = null;
        this.noteModal.show();
    }

    openEditModal(note) {
        this.modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Modifier la note';
        this.noteTitle.value = note.title;
        this.noteContent.value = note.content;
        this.noteColor.value = note.color;
        
        // Activer la couleur correspondante dans le picker
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === note.color);
        });
        
        this.currentEditId = note.id;
        this.noteModal.show();
    }

    handleSaveNote() {
        const title = this.noteTitle.value.trim();
        const content = this.noteContent.value.trim();
        const color = this.noteColor.value;

        if (!title || !content) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (this.currentEditId) {
            this.updateNote(this.currentEditId, title, content, color);
        } else {
            this.addNote(title, content, color);
        }

        this.noteModal.hide();
    }

    addNote(title, content, color) {
        const newNote = {
            id: Date.now().toString(),
            title,
            content,
            color,
            createdAt: new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

                this.notes.unshift(newNote);
        this.saveNotes();
        this.displayNotes();
        this.updateStats();
        this.showNotification('Note ajoutée avec succès !', 'success');
    }

    updateNote(id, title, content, color) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = {
                ...this.notes[noteIndex],
                title,
                content,
                color
            };
            this.saveNotes();
            this.displayNotes();
            this.updateStats();
            this.showNotification('Note modifiée avec succès !', 'success');
        }
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.displayNotes();
        this.updateStats();
        this.checkEmptyState();
        
        // Fermer le modal de visualisation si ouvert
        if (this.viewModal._isShown) {
            this.viewModal.hide();
        }
        
        this.showNotification('Note supprimée', 'warning');
    }

    deleteAllNotes() {
        this.notes = [];
        this.saveNotes();
        this.displayNotes();
        this.updateStats();
        this.checkEmptyState();
        this.deleteModal.hide();
        this.showNotification('Toutes les notes ont été supprimées', 'warning');
    }

    openDeleteModal(noteId, noteTitle) {
        document.getElementById('deleteMessage').textContent = 
            `Supprimer la note "${noteTitle}" ?`;
        document.getElementById('deleteSubMessage').textContent = 
            'Cette action est irréversible.';
        this.deleteCallback = () => this.deleteNote(noteId);
        this.deleteModal.show();
    }

    openDeleteAllModal() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à supprimer', 'info');
            return;
        }
        
        document.getElementById('deleteMessage').textContent = 
            'Supprimer toutes les notes ?';
        document.getElementById('deleteSubMessage').textContent = 
            `${this.notes.length} note(s) seront définitivement supprimées.`;
        this.deleteCallback = () => this.deleteAllNotes();
        this.deleteModal.show();
    }

    viewNote(note) {
        this.currentViewId = note.id;
        this.viewModalTitle.textContent = note.title;
        this.viewModalDate.textContent = note.createdAt;
        this.viewModalContent.textContent = note.content;
        
        // Appliquer la couleur de fond au header
        this.viewModalHeader.className = 'modal-header';
        if (note.color.includes('soft')) {
            this.viewModalHeader.classList.add(note.color);
        } else {
            this.viewModalHeader.classList.add('bg-primary', 'text-white');
        }
        
        this.viewModal.show();
    }

    editFromView() {
        this.viewModal.hide();
        const note = this.notes.find(n => n.id === this.currentViewId);
        if (note) {
            this.openEditModal(note);
        }
    }

    deleteFromView() {
        this.viewModal.hide();
        const note = this.notes.find(n => n.id === this.currentViewId);
        if (note) {
            this.openDeleteModal(note.id, note.title);
        }
    }

    displayNotes() {
        const searchTerm = this.globalSearch.value.toLowerCase().trim();
        let filteredNotes = this.notes;

        if (searchTerm) {
            filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredNotes.length === 0) {
            this.notesGrid.innerHTML = '';
            this.emptyState.style.display = 'block';
            
            if (searchTerm) {
                // Afficher un message personnalisé pour la recherche
                this.emptyState.querySelector('h3').textContent = 'Aucun résultat';
                this.emptyState.querySelector('p').textContent = 
                    `Aucune note ne correspond à "${searchTerm}"`;
                this.emptyStateBtn.style.display = 'none';
            } else {
                this.emptyState.querySelector('h3').textContent = 'Aucune note pour le moment';
                this.emptyState.querySelector('p').textContent = 
                    'Commencez par créer votre première note !';
                this.emptyStateBtn.style.display = 'inline-block';
            }
        } else {
            this.emptyState.style.display = 'none';
            this.notesGrid.innerHTML = filteredNotes.map(note => this.createNoteCard(note)).join('');
            this.attachNoteEvents();
        }
    }

    createNoteCard(note) {
        // Limiter l'aperçu du contenu à 150 caractères
        const contentPreview = note.content.length > 150 
            ? note.content.substring(0, 150) + '...' 
            : note.content;

        return `
            <div class="note-card-modern ${note.color}" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-actions-modern">
                        <button class="note-action-btn view" title="Voir" onclick="event.stopPropagation()">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="note-action-btn edit" title="Modifier" onclick="event.stopPropagation()">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn delete" title="Supprimer" onclick="event.stopPropagation()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">
                    ${this.escapeHtml(contentPreview).replace(/\n/g, '<br>')}
                </div>
                <div class="note-footer">
                    <span class="note-date">
                        <i class="far fa-calendar-alt"></i>
                        ${note.createdAt}
                    </span>
                    <span class="note-category-badge">
                        <i class="far fa-sticky-note"></i>
                    </span>
                </div>
            </div>
        `;
    }

    attachNoteEvents() {
        document.querySelectorAll('.note-card-modern').forEach(card => {
            const noteId = card.dataset.noteId;
            const note = this.notes.find(n => n.id === noteId);

            // Clic sur la carte pour voir la note
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.note-action-btn')) {
                    this.viewNote(note);
                }
            });

            // Bouton voir
            card.querySelector('.view').addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewNote(note);
            });

            // Bouton modifier
            card.querySelector('.edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(note);
            });

            // Bouton supprimer
            card.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDeleteModal(note.id, note.title);
            });
        });
    }

    handleSearch() {
        const searchTerm = this.globalSearch.value.trim();
        this.clearGlobalSearch.style.display = searchTerm ? 'block' : 'none';
        this.displayNotes();
    }

    clearSearch() {
        this.globalSearch.value = '';
        this.clearGlobalSearch.style.display = 'none';
        this.displayNotes();
        this.showNotification('Recherche réinitialisée', 'info');
    }

    updateStats() {
        // Mettre à jour le total des notes
        this.totalNotesEl.textContent = this.notes.length;

        // Mettre à jour la dernière note
        if (this.notes.length > 0) {
            // Trier par date (la plus récente d'abord)
            const sortedNotes = [...this.notes].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            this.lastNoteEl.textContent = sortedNotes[0].title.length > 20 
                ? sortedNotes[0].title.substring(0, 20) + '...' 
                : sortedNotes[0].title;
        } else {
            this.lastNoteEl.textContent = '-';
        }
    }

    checkEmptyState() {
        if (this.notes.length === 0) {
            this.emptyState.style.display = 'block';
            this.notesGrid.innerHTML = '';
        }
    }

    resetForm() {
        this.noteForm = document.getElementById('noteForm');
        if (this.noteForm) {
            this.noteForm.reset();
        }
        this.noteColor.value = 'bg-white';
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === 'bg-white');
        });
        this.currentEditId = null;
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        return savedNotes ? JSON.parse(savedNotes) : [];
    }

    showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                ${message}
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Ajouter au DOM
        document.body.appendChild(notification);

        // Supprimer automatiquement après 3 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que tous les modals sont bien centrés
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('show.bs.modal', function () {
            document.body.style.paddingRight = '0px';
        });
    });

    // Lancer l'application
    window.app = new NotesApp();
});

// Ajout de styles supplémentaires pour les notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        background: white;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        transform: translateX(400px);
        animation: slideInNotification 0.3s ease forwards;
        border-left: 4px solid;
    }

    @keyframes slideInNotification {
        to {
            transform: translateX(0);
        }
    }

    .notification.success {
        border-left-color: #48bb78;
    }
    .notification.success .notification-icon {
        color: #48bb78;
    }

    .notification.error {
        border-left-color: #f56565;
    }
    .notification.error .notification-icon {
        color: #f56565;
    }

    .notification.warning {
        border-left-color: #ed8936;
    }
    .notification.warning .notification-icon {
        color: #ed8936;
    }

    .notification.info {
        border-left-color: #4299e1;
    }
    .notification.info .notification-icon {
        color: #4299e1;
    }

    .notification-icon {
        font-size: 1.5rem;
    }

    .notification-content {
        flex: 1;
        font-size: 0.95rem;
        color: #2d3748;
    }

    .notification-close {
        background: none;
        border: none;
        color: #a0aec0;
        cursor: pointer;
        padding: 0;
        font-size: 1rem;
        transition: color 0.3s ease;
    }

    .notification-close:hover {
        color: #4a5568;
    }

    /* Animation de fade out */
    .notification.fade-out {
        animation: fadeOutNotification 0.3s ease forwards;
    }

    @keyframes fadeOutNotification {
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }

    /* Amélioration du modal de visualisation */
    #viewModal .modal-content {
        border: none;
    }

    #viewModal .modal-header {
        padding: 1.5rem;
        border-bottom: none;
    }

    #viewModal .modal-header.bg-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }

    #viewModal .modal-body {
        padding: 2rem;
    }

    .note-content-view {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #2d3748;
        white-space: pre-wrap;
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 1rem;
    }

    .note-metadata {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    /* Animation pour les nouvelles notes */
    @keyframes highlightNew {
        0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
        }
        70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
        }
    }

    .note-card-modern.new {
        animation: highlightNew 1s ease;
    }

    /* Style pour le bouton de confirmation dans le modal de suppression */
    #confirmDeleteBtn {
        background: linear-gradient(135deg, #f43b47 0%, #453a94 100%);
        border: none;
        transition: all 0.3s ease;
    }

    #confirmDeleteBtn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(244, 59, 71, 0.3);
    }

    /* Responsive pour les notifications */
    @media (max-width: 640px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            width: auto;
        }
    }

    /* Amélioration du sélecteur de couleurs */
    .color-picker {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .color-option {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 12px;
        cursor: pointer;
        border: 3px solid transparent;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: relative;
    }

    .color-option:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .color-option.active {
        border-color: #667eea;
        transform: scale(1.05);
    }

    .color-option.active::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        font-size: 1.2rem;
        font-weight: bold;
    }

    /* Pour les couleurs sombres, l'icône doit être visible */
    .color-option[data-color*="dark"] .active::after,
    .color-option[data-color*="danger"] .active::after,
    .color-option[data-color*="success"] .active::after {
        color: white;
    }

    /* Animation de chargement */
    .loading {
        display: inline-block;
        width: 50px;
        height: 50px;
        border: 3px solid rgba(102, 126, 234, 0.3);
        border-radius: 50%;
        border-top-color: #667eea;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

document.head.appendChild(style);