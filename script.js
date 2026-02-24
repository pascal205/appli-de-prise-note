// Classe pour gérer les notes
class Note {
    constructor(title, content, color) {
        this.id = Date.now().toString();
        this.title = title;
        this.content = content;
        this.color = color;
        this.createdAt = new Date().toLocaleDateString('fr-FR');
    }
}

// Gestionnaire de l'application
class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentEditId = null;
        this.init();
    }
    
    // Initialisation de l'application
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.displayNotes();
        this.setupModal();
    }
    
    // Mise en cache des éléments DOM
    cacheDOM() {
        this.noteForm = document.getElementById('noteForm');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.noteColor = document.getElementById('noteColor');
        this.notesContainer = document.getElementById('notesContainer');
        this.noNotesMessage = document.getElementById('noNotesMessage');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchBar = document.getElementById('searchBar');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearch = document.getElementById('clearSearch');
        this.deleteAllBtn = document.getElementById('deleteAllBtn');
    }
    
    // Configuration des événements
    bindEvents() {
        this.noteForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.searchBtn.addEventListener('click', () => this.toggleSearch());
        this.searchInput.addEventListener('input', () => this.filterNotes());
        this.clearSearch.addEventListener('click', () => this.clearSearch());
        this.deleteAllBtn.addEventListener('click', () => this.deleteAllNotes());
    }
    
    // Gestion de la soumission du formulaire
    handleFormSubmit(e) {
        e.preventDefault();
        
        const title = this.noteTitle.value.trim();
        const content = this.noteContent.value.trim();
        const color = this.noteColor.value;
        
        if (!title || !content) {
            this.showNotification('Veuillez remplir tous les champs', 'danger');
            return;
        }
        
        if (this.currentEditId) {
            this.updateNote(this.currentEditId, title, content, color);
        } else {
            this.addNote(title, content, color);
        }
        
        this.resetForm();
    }
    
    // Ajout d'une note
    addNote(title, content, color) {
        const newNote = new Note(title, content, color);
        this.notes.push(newNote);
        this.saveNotes();
        this.displayNotes();
        this.showNotification('Note ajoutée avec succès !', 'success');
    }
    
    // Mise à jour d'une note
    updateNote(id, title, content, color) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            this.notes[noteIndex] = { ...this.notes[noteIndex], title, content, color };
            this.saveNotes();
            this.displayNotes();
            this.currentEditId = null;
            this.showNotification('Note modifiée avec succès !', 'success');
        }
    }
    
    // Suppression d'une note
    deleteNote(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveNotes();
            this.displayNotes();
            this.showNotification('Note supprimée', 'warning');
        }
    }
    
    // Suppression de toutes les notes
    deleteAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('Aucune note à supprimer', 'info');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer TOUTES les notes ?')) {
            this.notes = [];
            this.saveNotes();
            this.displayNotes();
            this.showNotification('Toutes les notes ont été supprimées', 'warning');
        }
    }
    
    // Édition d'une note
    editNote(id) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            this.noteTitle.value = note.title;
            this.noteContent.value = note.content;
            this.noteColor.value = note.color;
            this.currentEditId = note.id;
            
            // Changer le texte du bouton
            const submitBtn = this.noteForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Modifier la note';
            
            // Scroll vers le formulaire
            document.querySelector('.card-header.bg-primary').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Affichage des notes
    displayNotes(filteredNotes = null) {
        const notesToShow = filteredNotes || this.notes;
        
        if (notesToShow.length === 0) {
            this.noNotesMessage.style.display = 'block';
            this.notesContainer.innerHTML = '';
        } else {
            this.noNotesMessage.style.display = 'none';
            this.notesContainer.innerHTML = notesToShow.map(note => this.createNoteHTML(note)).join('');
            this.attachNoteEvents();
        }
    }
    
    // Création du HTML pour une note
    createNoteHTML(note) {
        return `
            <div class="col-md-6 mb-3" data-note-id="${note.id}">
                <div class="card note-card shadow-sm ${note.color} h-100">
                    <div class="card-body position-relative">
                        <div class="note-actions btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-note" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-note" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <h5 class="card-title mb-3">${this.escapeHtml(note.title)}</h5>
                        
                        <div class="note-content-preview mb-3">
                            <p class="card-text">${this.escapeHtml(note.content)}</p>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <small class="text-muted">
                                <i class="far fa-calendar-alt me-1"></i>
                                ${note.createdAt}
                            </small>
                            <span class="note-category">
                                <i class="far fa-sticky-note me-1"></i>
                                Note
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Attachement des événements aux notes
    attachNoteEvents() {
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteCard = e.target.closest('[data-note-id]');
                if (noteCard) {
                    this.deleteNote(noteCard.dataset.noteId);
                }
            });
        });
        
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteCard = e.target.closest('[data-note-id]');
                if (noteCard) {
                    this.editNote(noteCard.dataset.noteId);
                }
            });
        });
        
        // Ajout de l'événement pour ouvrir la note en grand
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    this.toggleNoteFullscreen(card);
                }
            });
        });
    }
    
    // Basculer en mode plein écran pour une note
    toggleNoteFullscreen(card) {
        card.classList.toggle('editing');
        this.createOverlay(card);
    }
    
    // Création de l'overlay pour le mode plein écran
    createOverlay(card) {
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.classList.toggle('active');
        
        if (overlay.classList.contains('active')) {
            overlay.addEventListener('click', () => {
                card.classList.remove('editing');
                overlay.classList.remove('active');
            }, { once: true });
        }
    }
    
    // Filtrage des notes
    filterNotes() {
        const searchTerm = this.searchInput.value.toLowerCase();
        if (searchTerm === '') {
            this.displayNotes();
            return;
        }
        
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        );
        
        this.displayNotes(filteredNotes);
    }
    
    // Basculer l'affichage de la barre de recherche
    toggleSearch() {
        this.searchBar.style.display = this.searchBar.style.display === 'none' ? 'block' : 'none';
        if (this.searchBar.style.display === 'block') {
            this.searchInput.focus();
        }
    }
    
    // Effacer la recherche
    clearSearch() {
        this.searchInput.value = '';
        this.filterNotes();
        this.searchBar.style.display = 'none';
    }
    
    // Réinitialisation du formulaire
    resetForm() {
        this.noteForm.reset();
        this.currentEditId = null;
        const submitBtn = this.noteForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Enregistrer la note';
    }
    
    // Sauvegarde des notes dans localStorage
    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
    
    // Chargement des notes depuis localStorage
    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        return savedNotes ? JSON.parse(savedNotes) : [];
    }
    
    // Affichage d'une notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Configuration du modal Bootstrap
    setupModal() {
        // Création du modal pour les instructions
        const modalHTML = `
            <div class="modal fade" id="instructionsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-info-circle me-2"></i>
                                Instructions
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Bienvenue dans votre application de notes !</strong></p>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-plus-circle text-success me-2"></i> Ajoutez des notes avec le formulaire</li>
                                <li><i class="fas fa-edit text-primary me-2"></i> Modifiez vos notes existantes</li>
                                <li><i class="fas fa-trash text-danger me-2"></i> Supprimez les notes dont vous n'avez plus besoin</li>
                                <li><i class="fas fa-search text-info me-2"></i> Recherchez facilement vos notes</li>
                                <li><i class="fas fa-palette text-warning me-2"></i> Personnalisez la couleur de vos notes</li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Compris !</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Afficher le modal au premier lancement
        if (this.notes.length === 0) {
            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById('instructionsModal'));
                modal.show();
            }, 500);
        }
    }
    
    // Échappement des caractères HTML pour éviter les injections XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});