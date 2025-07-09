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
        
        // Search and filter event listeners
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const filterToggle = document.getElementById('filter-toggle');
        const filterDropdown = document.getElementById('filter-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const clearFiltersBtn = document.getElementById('clear-filters');
        
        // Search functionality
        searchButton.addEventListener('click', () => {
            this.searchCards(searchInput.value.trim());
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchCards(searchInput.value.trim());
            }
        });
        
        // Filter dropdown toggle
        filterToggle.addEventListener('click', () => {
            filterDropdown.classList.toggle('show');
            this.populateLabelFilters();
        });
        
        // Close filter dropdown when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-container') && filterDropdown.classList.contains('show')) {
                filterDropdown.classList.remove('show');
            }
        });
        
        // Apply filters
        applyFiltersBtn.addEventListener('click', () => {
            this.applyFilters();
            filterDropdown.classList.remove('show');
        });
        
        // Clear filters
        clearFiltersBtn.addEventListener('click', () => {
            this.clearFilters();
            filterDropdown.classList.remove('show');
        });
    }
    
    // Search cards by title, description, or labels
    searchCards(query) {
        if (!query) {
            this.renderAllCards();
            return;
        }
        
        query = query.toLowerCase();
        
        // Clear existing highlights
        document.querySelectorAll('.card.highlight').forEach(card => {
            card.classList.remove('highlight');
        });
        
        // Remove any existing "no results" messages
        document.querySelectorAll('.no-results').forEach(msg => msg.remove());
        
        let foundResults = false;
        
        // Search in each column
        ['todo', 'doing', 'done'].forEach(column => {
            const container = document.getElementById(`${column}-cards`);
            let columnHasResults = false;
            
            // Show all cards first
            container.querySelectorAll('.card').forEach(cardElement => {
                cardElement.style.display = 'block';
                
                const cardId = cardElement.dataset.cardId;
                const card = this.cards[column].find(c => c.id === cardId);
                
                if (card) {
                    // Check if card matches search query
                    const titleMatch = card.title.toLowerCase().includes(query);
                    const descMatch = card.description && card.description.toLowerCase().includes(query);
                    const labelMatch = card.labels && card.labels.some(label => 
                        label.toLowerCase().includes(query)
                    );
                    
                    if (titleMatch || descMatch || labelMatch) {
                        cardElement.classList.add('highlight');
                        columnHasResults = true;
                        foundResults = true;
                    } else {
                        cardElement.style.display = 'none';
                    }
                }
            });
            
            // Show "no results" message if column has no matching cards
            if (!columnHasResults) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No matching cards';
                container.appendChild(noResults);
            }
        });
        
        if (!foundResults) {
            alert('No cards match your search query.');
        }
    }
    
    // Populate label filters based on existing labels
    populateLabelFilters() {
        const labelFiltersContainer = document.getElementById('label-filters');
        labelFiltersContainer.innerHTML = '';
        
        // Collect all unique labels
        const allLabels = new Set();
        
        ['todo', 'doing', 'done'].forEach(column => {
            this.cards[column].forEach(card => {
                if (card.labels && card.labels.length) {
                    card.labels.forEach(label => allLabels.add(label));
                }
            });
        });
        
        // If no labels exist, show a message
        if (allLabels.size === 0) {
            const noLabels = document.createElement('div');
            noLabels.textContent = 'No labels found';
            noLabels.style.fontStyle = 'italic';
            noLabels.style.color = '#666';
            labelFiltersContainer.appendChild(noLabels);
            return;
        }
        
        // Create checkbox for each label
        allLabels.forEach(label => {
            const labelContainer = document.createElement('label');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'filter-label';
            checkbox.value = label;
            
            labelContainer.appendChild(checkbox);
            labelContainer.appendChild(document.createTextNode(` ${label}`));
            
            labelFiltersContainer.appendChild(labelContainer);
        });
    }
    
    // Apply selected filters
    applyFilters() {
        // Get selected priorities
        const selectedPriorities = Array.from(
            document.querySelectorAll('.filter-priority:checked')
        ).map(checkbox => checkbox.value);
        
        // Get selected due date filters
        const selectedDueFilters = Array.from(
            document.querySelectorAll('.filter-due:checked')
        ).map(checkbox => checkbox.value);
        
        // Get selected labels
        const selectedLabels = Array.from(
            document.querySelectorAll('.filter-label:checked')
        ).map(checkbox => checkbox.value);
        
        // If no filters selected, show all cards
        if (selectedPriorities.length === 0 && 
            selectedDueFilters.length === 0 && 
            selectedLabels.length === 0) {
            this.renderAllCards();
            return;
        }
        
        // Remove any existing "no results" messages
        document.querySelectorAll('.no-results').forEach(msg => msg.remove());
        
        // Apply filters to each column
        ['todo', 'doing', 'done'].forEach(column => {
            const container = document.getElementById(`${column}-cards`);
            let columnHasResults = false;
            
            container.querySelectorAll('.card').forEach(cardElement => {
                const cardId = cardElement.dataset.cardId;
                const card = this.cards[column].find(c => c.id === cardId);
                
                if (card) {
                    // Check priority filter
                    const priorityMatch = selectedPriorities.length === 0 || 
                        selectedPriorities.includes(card.priority || 'none');
                    
                    // Check due date filter
                    let dueMatch = true;
                    if (selectedDueFilters.length > 0) {
                        if (!card.dueDate && !selectedDueFilters.includes('no-date')) {
                            dueMatch = false;
                        } else if (card.dueDate) {
                            const dueDateClass = this.getDueDateClass(card.dueDate, card.dueDateCompleted);
                            dueMatch = selectedDueFilters.includes(dueDateClass);
                        }
                    }
                    
                    // Check label filter
                    let labelMatch = true;
                    if (selectedLabels.length > 0) {
                        labelMatch = card.labels && selectedLabels.some(label => 
                            card.labels.includes(label)
                        );
                    }
                    
                    // Show or hide card based on filter matches
                    if (priorityMatch && dueMatch && labelMatch) {
                        cardElement.style.display = 'block';
                        columnHasResults = true;
                    } else {
                        cardElement.style.display = 'none';
                    }
                }
            });
            
            // Show "no results" message if column has no matching cards
            if (!columnHasResults) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No matching cards';
                container.appendChild(noResults);
            }
        });
    }
    
    // Clear all filters and search
    clearFilters() {
        // Uncheck all filter checkboxes
        document.querySelectorAll('.filter-priority, .filter-due, .filter-label').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear search input
        document.getElementById('search-input').value = '';
        
        // Show all cards
        this.renderAllCards();
    }

    // Open modal for adding/editing cards
    openModal(column, card = null) {
        const modal = document.getElementById('card-modal');
        const modalTitle = document.getElementById('modal-title');
        const cardTitle = document.getElementById('card-title');
        const cardDescription = document.getElementById('card-description');
        const cardDueDate = document.getElementById('card-due-date');
        const cardLabels = document.getElementById('card-labels');
        const priorityRadios = document.querySelectorAll('input[name="priority"]');

        if (card) {
            // Editing existing card
            modalTitle.textContent = 'Edit Card';
            cardTitle.value = card.title;
            cardDescription.value = card.description || '';
            cardDueDate.value = card.dueDate || '';
            cardLabels.value = card.labels ? card.labels.join(', ') : '';
            
            // Set priority radio button
            priorityRadios.forEach(radio => {
                radio.checked = (radio.value === (card.priority || 'none'));
            });
            
            this.currentEditingCard = { ...card, column };
        } else {
            // Adding new card
            modalTitle.textContent = 'Add New Card';
            cardTitle.value = '';
            cardDescription.value = '';
            cardDueDate.value = '';
            cardLabels.value = '';
            
            // Reset priority to 'none'
            priorityRadios.forEach(radio => {
                radio.checked = (radio.value === 'none');
            });
            
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
        const dueDate = document.getElementById('card-due-date').value;
        const labelsInput = document.getElementById('card-labels').value.trim();
        
        // Get selected priority
        const selectedPriority = document.querySelector('input[name="priority"]:checked').value;
        const priority = selectedPriority !== 'none' ? selectedPriority : null;
        
        // Process labels
        const labels = labelsInput ? 
            labelsInput.split(',').map(label => label.trim()).filter(label => label) : 
            [];

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
                    dueDate: dueDate || null,
                    dueDateCompleted: this.cards[column][cardIndex].dueDateCompleted || false,
                    priority,
                    labels,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Add new card
            const newCard = {
                id: this.generateId(),
                title,
                description,
                dueDate: dueDate || null,
                dueDateCompleted: false,
                priority,
                labels,
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

        // Create card content
        let cardContent = `
            <div class="card-actions">
                <button class="card-action-btn edit-btn" title="Edit">✏️</button>
                <button class="card-action-btn delete-btn" title="Delete">🗑️</button>
            </div>
            <div class="card-title">${this.escapeHtml(card.title)}</div>
        `;
        
        // Add description if exists
        if (card.description) {
            cardContent += `<div class="card-description">${this.escapeHtml(card.description)}</div>`;
        }
        
        // Add labels if exist
        if (card.labels && card.labels.length > 0) {
            cardContent += '<div class="card-labels">';
            card.labels.forEach(label => {
                cardContent += `<span class="card-label">${this.escapeHtml(label)}</span>`;
            });
            cardContent += '</div>';
        }

        // Add due date if exists
        if (card.dueDate) {
            const dueDateClass = this.getDueDateClass(card.dueDate, card.dueDateCompleted);
            const formattedDate = this.formatDueDate(card.dueDate);
            const checkboxHtml = `
                <div class="due-date-checkbox">
                    <input type="checkbox" id="due-${card.id}" 
                        ${card.dueDateCompleted ? 'checked' : ''}>
                    <label for="due-${card.id}">Complete</label>
                </div>
            `;
            
            cardContent += `
                <div class="card-due-date ${dueDateClass}">
                    <span class="due-date-icon">📅</span>
                    <span>Due ${formattedDate}</span>
                    ${checkboxHtml}
                </div>
            `;
        }
        
        // Add priority badge if exists
        if (card.priority) {
            cardContent += `<div class="card-priority ${card.priority}">${card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}</div>`;
        }

        cardDiv.innerHTML = cardContent;

        // Add event listeners
        cardDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('card-action-btn') && 
                !e.target.type === 'checkbox') {
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

        // Add due date checkbox event listener if due date exists
        if (card.dueDate) {
            const checkbox = cardDiv.querySelector(`#due-${card.id}`);
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleDueDateCompleted(column, card.id, e.target.checked);
            });
        }

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

    // Format due date for display
    formatDueDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if date is today, tomorrow, or yesterday
        if (date.toDateString() === today.toDateString()) {
            return 'today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'tomorrow';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'yesterday';
        } else {
            // Format as Month Day (e.g., Jul 15)
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    // Get due date class based on date and completion status
    getDueDateClass(dateString, completed) {
        if (completed) {
            return 'completed';
        }
        
        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        if (dueDate < today) {
            return 'overdue';
        } else if (dueDate <= threeDaysFromNow) {
            return 'due-soon';
        }
        
        return '';
    }

    // Toggle due date completed status
    toggleDueDateCompleted(column, cardId, completed) {
        const cardIndex = this.cards[column].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            this.cards[column][cardIndex].dueDateCompleted = completed;
            this.cards[column][cardIndex].updatedAt = new Date().toISOString();
            this.saveCards();
            this.renderCards(column);
        }
    }

    // Render cards for a specific column
    renderCards(column) {
        const container = document.getElementById(`${column}-cards`);
        container.innerHTML = '';

        // Remove any "no results" messages
        const noResults = container.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }

        this.cards[column].forEach(card => {
            const cardElement = this.createCardElement(card, column);
            container.appendChild(cardElement);
        });

        // Add drag and drop listeners to the container
        this.addDragDropListeners(container, column);
        
        // If column is empty, show a message
        if (this.cards[column].length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-results';
            emptyMessage.textContent = 'No cards in this column';
            container.appendChild(emptyMessage);
        }
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
