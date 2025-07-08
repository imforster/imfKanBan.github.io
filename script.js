class TrelloBoard {
    constructor() {
        this.cards = this.loadCards();
        this.currentEditingCard = null;
        this.draggedCard = null;
        
        this.initializeEventListeners();
        this.renderAllCards();
    }

    // Load cards from localStorage
    loadCards() {
        const savedCards = localStorage.getItem('trelloCards');
        return savedCards ? JSON.parse(savedCards) : {
            todo: [],
            doing: [],
            done: []
        };
    }

    // Save cards to localStorage
    saveCards() {
        localStorage.setItem('trelloCards', JSON.stringify(this.cards));
    }

    // Generate unique ID for cards
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Add card buttons
        document.querySelectorAll('.add-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.dataset.column;
                this.openModal(column);
            });
        });

        // Modal event listeners
        const modal = document.getElementById('card-modal');
        const closeBtn = document.querySelector('.close');
        const saveBtn = document.getElementById('save-card');
        const cancelBtn = document.getElementById('cancel-card');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        saveBtn.addEventListener('click', () => this.saveCard());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Enter key to save card
        document.getElementById('card-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveCard();
            }
        });
    }

    // Open modal for adding/editing cards
    openModal(column, card = null) {
        const modal = document.getElementById('card-modal');
        const modalTitle = document.getElementById('modal-title');
        const cardTitle = document.getElementById('card-title');
        const cardDescription = document.getElementById('card-description');

        if (card) {
            // Editing existing card
            modalTitle.textContent = 'Edit Card';
            cardTitle.value = card.title;
            cardDescription.value = card.description || '';
            this.currentEditingCard = { ...card, column };
        } else {
            // Adding new card
            modalTitle.textContent = 'Add New Card';
            cardTitle.value = '';
            cardDescription.value = '';
            this.currentEditingCard = { column };
        }

        modal.style.display = 'block';
        cardTitle.focus();
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('card-modal');
        modal.style.display = 'none';
        this.currentEditingCard = null;
    }

    // Save card (add new or update existing)
    saveCard() {
        const title = document.getElementById('card-title').value.trim();
        const description = document.getElementById('card-description').value.trim();

        if (!title) {
            alert('Please enter a card title');
            return;
        }

        const { column, id } = this.currentEditingCard;

        if (id) {
            // Update existing card
            const cardIndex = this.cards[column].findIndex(card => card.id === id);
            if (cardIndex !== -1) {
                this.cards[column][cardIndex] = {
                    ...this.cards[column][cardIndex],
                    title,
                    description,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Add new card
            const newCard = {
                id: this.generateId(),
                title,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cards[column].push(newCard);
        }

        this.saveCards();
        this.renderCards(column);
        this.closeModal();
    }

    // Delete card
    deleteCard(column, cardId) {
        if (confirm('Are you sure you want to delete this card?')) {
            this.cards[column] = this.cards[column].filter(card => card.id !== cardId);
            this.saveCards();
            this.renderCards(column);
        }
    }

    // Move card between columns
    moveCard(cardId, fromColumn, toColumn) {
        const cardIndex = this.cards[fromColumn].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            const card = this.cards[fromColumn].splice(cardIndex, 1)[0];
            card.updatedAt = new Date().toISOString();
            this.cards[toColumn].push(card);
            this.saveCards();
            this.renderCards(fromColumn);
            this.renderCards(toColumn);
        }
    }

    // Create card HTML element
    createCardElement(card, column) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.draggable = true;
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.column = column;

        cardDiv.innerHTML = `
            <div class="card-actions">
                <button class="card-action-btn edit-btn" title="Edit">✏️</button>
                <button class="card-action-btn delete-btn" title="Delete">🗑️</button>
            </div>
            <div class="card-title">${this.escapeHtml(card.title)}</div>
            ${card.description ? `<div class="card-description">${this.escapeHtml(card.description)}</div>` : ''}
        `;

        // Add event listeners
        cardDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('card-action-btn')) {
                this.openModal(column, card);
            }
        });

        cardDiv.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openModal(column, card);
        });

        cardDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(column, card.id);
        });

        // Drag and drop event listeners
        cardDiv.addEventListener('dragstart', (e) => {
            this.draggedCard = { id: card.id, column };
            cardDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        cardDiv.addEventListener('dragend', () => {
            cardDiv.classList.remove('dragging');
            this.draggedCard = null;
        });

        return cardDiv;
    }

    // Render cards for a specific column
    renderCards(column) {
        const container = document.getElementById(`${column}-cards`);
        container.innerHTML = '';

        this.cards[column].forEach(card => {
            const cardElement = this.createCardElement(card, column);
            container.appendChild(cardElement);
        });

        // Add drag and drop listeners to the container
        this.addDragDropListeners(container, column);
    }

    // Render all cards
    renderAllCards() {
        ['todo', 'doing', 'done'].forEach(column => {
            this.renderCards(column);
        });
    }

    // Add drag and drop listeners to column containers
    addDragDropListeners(container, column) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            container.parentElement.classList.add('drag-over');
        });

        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.parentElement.classList.remove('drag-over');
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.parentElement.classList.remove('drag-over');
            
            if (this.draggedCard && this.draggedCard.column !== column) {
                this.moveCard(this.draggedCard.id, this.draggedCard.column, column);
            }
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear all data (for testing purposes)
    clearAllData() {
        if (confirm('Are you sure you want to clear all cards? This cannot be undone.')) {
            localStorage.removeItem('trelloCards');
            this.cards = { todo: [], doing: [], done: [] };
            this.renderAllCards();
        }
    }

    // Export data as JSON
    exportData() {
        const dataStr = JSON.stringify(this.cards, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trello-board-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import data from JSON
    importData(jsonData) {
        try {
            const importedCards = JSON.parse(jsonData);
            if (importedCards.todo && importedCards.doing && importedCards.done) {
                this.cards = importedCards;
                this.saveCards();
                this.renderAllCards();
                alert('Data imported successfully!');
            } else {
                alert('Invalid data format');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    }
}

// Initialize the Trello board when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.trelloBoard = new TrelloBoard();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('card-modal');
            if (modal.style.display === 'block') {
                window.trelloBoard.closeModal();
            }
        }
    });
    
    console.log('Trello Board initialized!');
    console.log('Available methods:');
    console.log('- trelloBoard.clearAllData() - Clear all cards');
    console.log('- trelloBoard.exportData() - Export data as JSON');
    console.log('- trelloBoard.importData(jsonString) - Import data from JSON');
});
