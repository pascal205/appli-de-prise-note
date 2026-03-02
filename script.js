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
        
        // Bouton de confirmation de suppression
        this.confirmDeleteBtn.addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
                this.deleteModal.hide();
            }
        });
        
        // Fermeture des modals
        document.getElementById('noteModal').addEventListener('hidden.bs.modal', () => this.resetForm());
    }

    initModals() {
        // Initialisation du sélecteur de couleurs
        this.initColorPicker();
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
                        <button class="note-action-btn view" title="Voir" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="note-action-btn edit" title="Modifier" data-action="edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn delete" title="Supprimer" data-action="delete">
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

            if (!note) return; // Sécurité

            // Clic sur la carte pour voir la note
            card.addEventListener('click', (e) => {
                // Ne pas déclencher si on clique sur un bouton
                if (!e.target.closest('.note-action-btn')) {
                    this.viewNote(note);
                }
            });

            // Gestionnaire d'événements pour les boutons
            const viewBtn = card.querySelector('[data-action="view"]');
            const editBtn = card.querySelector('[data-action="edit"]');
            const deleteBtn = card.querySelector('[data-action="delete"]');

            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.viewNote(note);
                });
            }

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.openEditModal(note);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.openDeleteModal(note.id, note.title);
                });
            }
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
        const form = document.getElementById('noteForm');
        if (form) {
            form.reset();
        }
        if (this.noteColor) {
            this.noteColor.value = 'bg-white';
        }
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
        // Supprimer les anciennes notifications
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(n => n.remove());

        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
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
    // Lancer l'application
    window.app = new NotesApp();
});