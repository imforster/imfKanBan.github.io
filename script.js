// Board Manager Class - Handles multiple boards
class BoardManager {
    constructor() {
        this.boards = this.loadBoards();
        this.currentBoardId = this.getCurrentBoardId();
        this.trelloBoard = null;
        
        this.initializeBoardManager();
    }

    // Load all boards from localStorage
    loadBoards() {
        const savedBoards = localStorage.getItem('trelloBoards');
        const defaultBoards = {
            'default': {
                id: 'default',
                title: 'Default Board',
                createdAt: new Date().toISOString(),
                cards: {
                    todo: [],
                    doing: [],
                    done: []
                }
            }
        };
        
        if (savedBoards) {
            const boards = JSON.parse(savedBoards);
            // Ensure default board exists
            if (!boards.default) {
                boards.default = defaultBoards.default;
            }
            return boards;
        }
        
        return defaultBoards;
    }

    // Save all boards to localStorage
    saveBoards() {
        localStorage.setItem('trelloBoards', JSON.stringify(this.boards));
    }

    // Get current board ID from localStorage
    getCurrentBoardId() {
        return localStorage.getItem('currentBoardId') || 'default';
    }

    // Set current board ID in localStorage
    setCurrentBoardId(boardId) {
        this.currentBoardId = boardId;
        localStorage.setItem('currentBoardId', boardId);
    }

    // Get current board data
    getCurrentBoard() {
        return this.boards[this.currentBoardId] || this.boards.default;
    }

    // Create new board
    createBoard(title) {
        const boardId = this.generateBoardId();
        const newBoard = {
            id: boardId,
            title: title,
            createdAt: new Date().toISOString(),
            cards: {
                todo: [],
                doing: [],
                done: []
            }
        };
        
        this.boards[boardId] = newBoard;
        this.saveBoards();
        return boardId;
    }

    // Delete board
    deleteBoard(boardId) {
        if (boardId === 'default') {
            alert('Cannot delete the default board');
            return false;
        }
        
        if (Object.keys(this.boards).length <= 1) {
            alert('Cannot delete the last board');
            return false;
        }
        
        delete this.boards[boardId];
        
        // If deleting current board, switch to default
        if (this.currentBoardId === boardId) {
            this.switchToBoard('default');
        }
        
        this.saveBoards();
        return true;
    }

    // Switch to different board
    switchToBoard(boardId) {
        if (!this.boards[boardId]) {
            console.error('Board not found:', boardId);
            return;
        }
        
        this.setCurrentBoardId(boardId);
        this.updateBoardSelector();
        this.updateBoardTitle();
        
        // Reinitialize TrelloBoard with new board data
        if (this.trelloBoard) {
            const currentBoard = this.getCurrentBoard();
            this.trelloBoard.switchBoard(currentBoard.cards);
        }
        
        // Update global reference for backward compatibility
        if (typeof window !== 'undefined') {
            window.trelloBoard = this.trelloBoard;
        }
    }

    // Update board title
    updateBoardTitle(newTitle = null) {
        const currentBoard = this.getCurrentBoard();
        if (newTitle) {
            currentBoard.title = newTitle;
            this.saveBoards();
        }
        
        document.getElementById('current-board-title').textContent = currentBoard.title;
        
        // Update selector option
        const selector = document.getElementById('board-select');
        const option = selector.querySelector(`option[value="${this.currentBoardId}"]`);
        if (option) {
            option.textContent = currentBoard.title;
        }
    }

    // Update board selector dropdown
    updateBoardSelector() {
        const selector = document.getElementById('board-select');
        selector.innerHTML = '';
        
        Object.values(this.boards).forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.title;
            if (board.id === this.currentBoardId) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    // Generate unique board ID
    generateBoardId() {
        return 'board_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export current board
    exportBoard() {
        const currentBoard = this.getCurrentBoard();
        const dataStr = JSON.stringify(currentBoard, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${currentBoard.title.replace(/[^a-z0-9]/gi, '_')}_board.json`;
        link.click();
    }

    // Import board
    importBoard(jsonData) {
        try {
            const boardData = JSON.parse(jsonData);
            
            // Validate board structure
            if (!boardData.title || !boardData.cards) {
                throw new Error('Invalid board format');
            }
            
            // Create new board with imported data
            const boardId = this.createBoard(boardData.title + ' (Imported)');
            this.boards[boardId].cards = boardData.cards;
            this.saveBoards();
            
            // Switch to imported board
            this.switchToBoard(boardId);
            
            alert('Board imported successfully!');
        } catch (error) {
            alert('Error importing board: ' + error.message);
        }
    }

    // Initialize board manager UI
    initializeBoardManager() {
        this.updateBoardSelector();
        this.updateBoardTitle();
        this.setupBoardEventListeners();
        
        // Initialize TrelloBoard with current board data
        this.trelloBoard = new TrelloBoard(this);
    }

    // Setup event listeners for board management
    setupBoardEventListeners() {
        // Board selector change
        document.getElementById('board-select').addEventListener('change', (e) => {
            this.switchToBoard(e.target.value);
        });

        // Edit board title
        document.getElementById('edit-board-title').addEventListener('click', () => {
            this.openBoardTitleModal();
        });

        // New board button
        document.getElementById('new-board-btn').addEventListener('click', () => {
            this.openNewBoardModal();
        });

        // Delete board button
        document.getElementById('delete-board-btn').addEventListener('click', () => {
            this.confirmDeleteBoard();
        });

        // Export board
        document.getElementById('export-board-btn').addEventListener('click', () => {
            this.exportBoard();
        });

        // Import board
        document.getElementById('import-board-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.importBoard(e.target.result);
                };
                reader.readAsText(file);
            }
        });

        // Board title modal events
        this.setupBoardTitleModal();
        this.setupNewBoardModal();
    }

    // Setup board title modal
    setupBoardTitleModal() {
        const modal = document.getElementById('board-title-modal');
        const closeBtn = document.getElementById('close-board-title-modal');
        const saveBtn = document.getElementById('save-board-title');
        const cancelBtn = document.getElementById('cancel-board-title');

        closeBtn.addEventListener('click', () => this.closeBoardTitleModal());
        cancelBtn.addEventListener('click', () => this.closeBoardTitleModal());
        saveBtn.addEventListener('click', () => this.saveBoardTitle());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeBoardTitleModal();
            }
        });

        // Handle Enter key
        document.getElementById('board-title-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveBoardTitle();
            }
        });
    }

    // Setup new board modal
    setupNewBoardModal() {
        const modal = document.getElementById('new-board-modal');
        const closeBtn = document.getElementById('close-new-board-modal');
        const createBtn = document.getElementById('create-board');
        const cancelBtn = document.getElementById('cancel-new-board');

        closeBtn.addEventListener('click', () => this.closeNewBoardModal());
        cancelBtn.addEventListener('click', () => this.closeNewBoardModal());
        createBtn.addEventListener('click', () => this.createNewBoard());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeNewBoardModal();
            }
        });

        // Handle Enter key
        document.getElementById('new-board-title-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createNewBoard();
            }
        });
    }

    // Open board title modal
    openBoardTitleModal() {
        const modal = document.getElementById('board-title-modal');
        const input = document.getElementById('board-title-input');
        
        input.value = this.getCurrentBoard().title;
        modal.style.display = 'block';
        input.focus();
        input.select();
    }

    // Close board title modal
    closeBoardTitleModal() {
        document.getElementById('board-title-modal').style.display = 'none';
    }

    // Save board title
    saveBoardTitle() {
        const input = document.getElementById('board-title-input');
        const newTitle = input.value.trim();
        
        if (newTitle) {
            this.updateBoardTitle(newTitle);
            this.closeBoardTitleModal();
        }
    }

    // Open new board modal
    openNewBoardModal() {
        const modal = document.getElementById('new-board-modal');
        const input = document.getElementById('new-board-title-input');
        
        input.value = '';
        modal.style.display = 'block';
        input.focus();
    }

    // Close new board modal
    closeNewBoardModal() {
        document.getElementById('new-board-modal').style.display = 'none';
    }

    // Create new board
    createNewBoard() {
        const input = document.getElementById('new-board-title-input');
        const title = input.value.trim();
        
        if (title) {
            const boardId = this.createBoard(title);
            this.switchToBoard(boardId);
            this.closeNewBoardModal();
        }
    }

    // Confirm delete board
    confirmDeleteBoard() {
        const currentBoard = this.getCurrentBoard();
        if (confirm(`Are you sure you want to delete "${currentBoard.title}"? This action cannot be undone.`)) {
            if (this.deleteBoard(this.currentBoardId)) {
                this.updateBoardSelector();
            }
        }
    }
}

// Enhanced TrelloBoard Class with multi-board support
class TrelloBoard {
    constructor(boardManager) {
        this.boardManager = boardManager;
        this.cards = this.boardManager.getCurrentBoard().cards;
        this.currentEditingCard = null;
        this.draggedCard = null;
        
        this.initializeEventListeners();
        this.renderAllCards();
        this.updateLabelFilters(); // Initialize label filters on startup
    }

    // Switch to different board data
    switchBoard(newCards) {
        this.cards = newCards;
        // Clear any existing search/filter state when switching boards
        this.currentSearchTerm = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Clear any active filters
        document.querySelectorAll('.filter-priority:checked, .filter-due:checked, .filter-label:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.renderAllCards();
        this.updateLabelFilters(); // Update label filters when switching boards
        // Reinitialize event listeners to ensure they work with the new board context
        this.initializeCardEventListeners();
    }

    // Save cards to current board
    saveCards() {
        this.boardManager.getCurrentBoard().cards = this.cards;
        this.boardManager.saveBoards();
    }

    // Generate unique ID for cards
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Initialize all event listeners
    initializeEventListeners() {
        this.initializeCardEventListeners();
        this.initializeGeneralEventListeners();
    }

    // Initialize card-specific event listeners (need to be reinitialized on board switch)
    initializeCardEventListeners() {
        // Use event delegation for add card buttons to avoid cloning issues
        // Remove existing delegated listener first
        if (this.addCardHandler) {
            document.removeEventListener('click', this.addCardHandler);
        }
        
        // Create bound handler for add card buttons
        this.addCardHandler = (e) => {
            if (e.target.matches('.add-card-btn')) {
                const column = e.target.dataset.column;
                this.openModal(column);
            }
        };
        
        // Add the delegated event listener for add card buttons
        document.addEventListener('click', this.addCardHandler);

        // Add event delegation for card action buttons (edit/delete)
        // Remove existing delegated listeners first
        if (this.cardActionHandler) {
            document.removeEventListener('click', this.cardActionHandler);
        }
        
        // Create bound handler to maintain 'this' context
        this.cardActionHandler = (e) => {
            if (e.target.matches('.edit-btn')) {
                const cardId = e.target.dataset.cardId;
                const column = e.target.dataset.column;
                const card = this.cards[column].find(c => c.id === cardId);
                if (card) {
                    this.openModal(column, card);
                }
            } else if (e.target.matches('.delete-btn')) {
                const cardId = e.target.dataset.cardId;
                const column = e.target.dataset.column;
                this.deleteCard(column, cardId);
            }
        };
        
        // Add the delegated event listener
        document.addEventListener('click', this.cardActionHandler);
    }

    // Initialize general event listeners (only need to be set up once)
    initializeGeneralEventListeners() {

        // Modal event listeners
        const modal = document.getElementById('card-modal');
        const closeBtn = document.querySelector('.close');
        const saveBtn = document.getElementById('save-card');
        const cancelBtn = document.getElementById('cancel-card');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        saveBtn.addEventListener('click', () => this.saveCard());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Handle Enter key in modal
        document.getElementById('card-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveCard();
            }
        });

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        
        if (searchInput && searchButton) {
            searchInput.addEventListener('input', () => this.handleSearch());
            searchButton.addEventListener('click', () => this.handleSearch());
        }

        // Filter functionality
        const filterToggle = document.getElementById('filter-toggle');
        const filterDropdown = document.getElementById('filter-dropdown');
        
        if (filterToggle && filterDropdown) {
            filterToggle.addEventListener('click', () => {
                filterDropdown.style.display = filterDropdown.style.display === 'block' ? 'none' : 'block';
            });

            // Filter checkboxes - only attach to existing ones initially
            document.querySelectorAll('.filter-priority, .filter-due').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.applyFilters());
            });
            
            // Label filter checkboxes will be handled in updateLabelFilters()

            // Close filter dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
                    filterDropdown.style.display = 'none';
                }
            });

            // Clear all filters button
            const clearFiltersBtn = document.getElementById('clear-filters');
            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', () => {
                    // Clear all filter checkboxes
                    document.querySelectorAll('.filter-priority:checked, .filter-due:checked, .filter-label:checked').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    // Apply filters (which will show all cards)
                    this.applyFilters();
                });
            }
        }
    }

    // Open modal for adding/editing cards
    openModal(column, card = null) {
        const modal = document.getElementById('card-modal');
        const titleInput = document.getElementById('card-title');
        const descInput = document.getElementById('card-description');
        const dueDateInput = document.getElementById('card-due-date');
        const labelsInput = document.getElementById('card-labels');
        const modalTitle = modal.querySelector('h3'); // Changed from h2 to h3

        if (card) {
            // Editing existing card
            modalTitle.textContent = 'Edit Card';
            titleInput.value = card.title;
            descInput.value = card.description || '';
            
            // Set priority radio button
            const priorityRadio = document.querySelector(`input[name="priority"][value="${card.priority || 'none'}"]`);
            if (priorityRadio) {
                priorityRadio.checked = true;
            }
            
            // Set labels
            if (labelsInput) {
                labelsInput.value = card.labels ? card.labels.join(', ') : '';
            }
            
            if (dueDateInput) dueDateInput.value = card.dueDate || '';
            this.currentEditingCard = { column, card };
        } else {
            // Adding new card
            modalTitle.textContent = 'Add New Card';
            titleInput.value = '';
            descInput.value = '';
            
            // Set default priority to 'none'
            const defaultPriorityRadio = document.querySelector(`input[name="priority"][value="none"]`);
            if (defaultPriorityRadio) {
                defaultPriorityRadio.checked = true;
            }
            
            // Clear labels
            if (labelsInput) {
                labelsInput.value = '';
            }
            
            if (dueDateInput) dueDateInput.value = '';
            this.currentEditingCard = { column, card: null };
        }

        modal.style.display = 'block';
        titleInput.focus();
    }

    // Close modal
    closeModal() {
        document.getElementById('card-modal').style.display = 'none';
        this.currentEditingCard = null;
    }

    // Save card (add new or update existing)
    saveCard() {
        const titleInput = document.getElementById('card-title');
        const descInput = document.getElementById('card-description');
        const dueDateInput = document.getElementById('card-due-date');
        const labelsInput = document.getElementById('card-labels');

        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const dueDate = dueDateInput ? dueDateInput.value : '';
        
        // Process labels - split by comma and clean up
        const labelsText = labelsInput ? labelsInput.value.trim() : '';
        const labels = labelsText ? labelsText.split(',').map(label => label.trim()).filter(label => label.length > 0) : [];
        
        // Get priority from radio buttons
        const priorityRadio = document.querySelector('input[name="priority"]:checked');
        const priority = priorityRadio ? priorityRadio.value : 'none';

        if (!title) {
            alert('Please enter a card title');
            return;
        }

        const { column, card } = this.currentEditingCard;

        if (card) {
            // Update existing card
            card.title = title;
            card.description = description;
            card.priority = priority;
            card.dueDate = dueDate;
            card.labels = labels;
            card.updatedAt = new Date().toISOString();
        } else {
            // Add new card
            const newCard = {
                id: this.generateId(),
                title: title,
                description: description,
                priority: priority,
                dueDate: dueDate,
                labels: labels,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cards[column].push(newCard);
        }

        this.saveCards();
        this.renderCards(column);
        this.updateLabelFilters(); // Only update when cards are actually saved
        this.closeModal();
    }

    // Toggle card completion status
    toggleCardCompletion(cardId, column, isCompleted) {
        const card = this.cards[column].find(c => c.id === cardId);
        if (card) {
            card.completed = isCompleted;
            card.completedDate = isCompleted ? new Date().toISOString() : null;
            card.updatedAt = new Date().toISOString();
            
            this.saveCards();
            this.renderCards(column);
        }
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
        }
    }

    // Create card element
    createCardElement(card, column) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.draggable = true;
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.column = column;

        // Priority class
        if (card.priority && card.priority !== 'none') {
            cardDiv.classList.add(`priority-${card.priority}`);
        }

        // Due date status and completion logic
        let dueDateClass = '';
        let dueDateText = '';
        let dueDateIcon = '&#128197;'; // 📅 calendar
        let isCompleted = card.completed || false;
        
        if (card.dueDate) {
            const dueDate = new Date(card.dueDate);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (isCompleted) {
                dueDateClass = 'completed';
                dueDateText = `Completed: ${card.completedDate ? new Date(card.completedDate).toLocaleDateString() : 'Done'}`;
                dueDateIcon = '&#9989;'; // ✅ check mark
            } else if (diffDays < 0) {
                dueDateClass = 'overdue';
                dueDateText = `Overdue by ${Math.abs(diffDays)} day(s)`;
                dueDateIcon = '&#9888;'; // ⚠️ warning
            } else if (diffDays === 0) {
                dueDateClass = 'due-today';
                dueDateText = 'Due today';
                dueDateIcon = '&#128293;'; // 🔥 fire
            } else if (diffDays <= 3) {
                dueDateClass = 'due-soon';
                dueDateText = `Due in ${diffDays} day(s)`;
                dueDateIcon = '&#9200;'; // ⏰ alarm clock
            } else {
                dueDateText = `Due ${dueDate.toLocaleDateString()}`;
                dueDateIcon = '&#128197;'; // 📅 calendar
            }
            cardDiv.classList.add(dueDateClass);
        }

        const priorityBadge = card.priority && card.priority !== 'none' 
            ? `<span class="priority-badge priority-${card.priority}">${card.priority.toUpperCase()}</span>` 
            : '';

        // Create labels display
        const labelsBadges = card.labels && card.labels.length > 0
            ? card.labels.map(label => `<span class="label-badge" data-label="${this.escapeHtml(label)}">${this.escapeHtml(label)}</span>`).join('')
            : '';

        const dueDateSection = card.dueDate 
            ? `<div class="card-due-date ${dueDateClass}">
                <span class="due-date-icon">${dueDateIcon}</span>
                <span class="due-date-text">${dueDateText}</span>
                <div class="due-date-checkbox">
                    <input type="checkbox" 
                           ${isCompleted ? 'checked' : ''} 
                           data-card-id="${card.id}" 
                           data-column="${column}"
                           class="completion-checkbox"
                           title="Mark as ${isCompleted ? 'incomplete' : 'complete'}">
                    <label>Done</label>
                </div>
            </div>` 
            : '';

        cardDiv.innerHTML = `
            <div class="card-header">
                <h3>${this.escapeHtml(card.title)}</h3>
                <div class="card-actions">
                    <button class="edit-btn" data-action="edit" data-card-id="${card.id}" data-column="${column}" title="Edit card">&#9998;</button>
                    <button class="delete-btn" data-action="delete" data-card-id="${card.id}" data-column="${column}" title="Delete card">&#128465;</button>
                </div>
            </div>
            ${card.description ? `<p class="card-description">${this.escapeHtml(card.description)}</p>` : ''}
            <div class="card-badges">
                ${priorityBadge}
                ${labelsBadges}
            </div>
            ${dueDateSection}
            <div class="card-meta">
                <small>Created: ${new Date(card.createdAt).toLocaleDateString()}</small>
            </div>
        `;

        // Add drag event listeners
        cardDiv.addEventListener('dragstart', (e) => {
            this.draggedCard = { id: card.id, column: column };
            cardDiv.classList.add('dragging');
        });

        cardDiv.addEventListener('dragend', () => {
            cardDiv.classList.remove('dragging');
            this.draggedCard = null;
        });

        // Add completion checkbox event listener
        const checkbox = cardDiv.querySelector('.completion-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent card click event
                this.toggleCardCompletion(card.id, column, e.target.checked);
            });
        }

        return cardDiv;
    }

    // Render cards in a specific column
    renderCards(column) {
        const container = document.querySelector(`[data-column="${column}"] .cards-container`);
        if (!container) {
            console.error(`Container not found for column: ${column}`);
            return;
        }

        container.innerHTML = '';

        // Apply current filters
        const filteredCards = this.getFilteredCards(this.cards[column] || []);

        filteredCards.forEach(card => {
            const cardElement = this.createCardElement(card, column);
            container.appendChild(cardElement);
        });

        // Add drag and drop listeners to container
        this.addDragDropListeners(container, column);
    }

    // Render all cards
    renderAllCards() {
        ['todo', 'doing', 'done'].forEach(column => {
            this.renderCards(column);
        });
        // Don't update label filters here - it resets checkbox states
        // this.updateLabelFilters(); 
    }

    // Add drag and drop listeners to container
    addDragDropListeners(container, column) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');

            if (this.draggedCard && this.draggedCard.column !== column) {
                this.moveCard(this.draggedCard.id, this.draggedCard.column, column);
                this.renderCards(this.draggedCard.column);
                this.renderCards(column);
            }
        });
    }

    // Handle search functionality
    handleSearch() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        this.currentSearchTerm = searchTerm;
        this.renderAllCards();
    }

    // Apply filters
    applyFilters() {
        this.renderAllCards();
    }

    // Get filtered cards based on search and filters
    getFilteredCards(cards) {
        if (!cards || !Array.isArray(cards)) {
            console.warn('getFilteredCards received invalid cards array:', cards);
            return [];
        }
        
        let filtered = [...cards];

        // Apply search filter
        if (this.currentSearchTerm) {
            filtered = filtered.filter(card => 
                card.title.toLowerCase().includes(this.currentSearchTerm) ||
                (card.description && card.description.toLowerCase().includes(this.currentSearchTerm))
            );
        }

        // Apply priority filters
        const priorityFilters = Array.from(document.querySelectorAll('.filter-priority:checked')).map(cb => cb.value);
        if (priorityFilters.length > 0) {
            filtered = filtered.filter(card => priorityFilters.includes(card.priority || 'none'));
        }

        // Apply due date filters
        const dueDateFilters = Array.from(document.querySelectorAll('.filter-due:checked')).map(cb => cb.value);
        if (dueDateFilters.length > 0) {
            filtered = filtered.filter(card => {
                if (!card.dueDate && dueDateFilters.includes('no-date')) return true;
                if (!card.dueDate) return false;

                // Check for completed status first
                if (dueDateFilters.includes('completed') && card.completed) return true;

                const dueDate = new Date(card.dueDate);
                const today = new Date();
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (dueDateFilters.includes('overdue') && diffDays < 0 && !card.completed) return true;
                if (dueDateFilters.includes('due-soon') && diffDays > 0 && diffDays <= 3 && !card.completed) return true;

                return false;
            });
        }

        // Apply label filters
        const labelFilters = Array.from(document.querySelectorAll('.filter-label:checked')).map(cb => cb.value);
        if (labelFilters.length > 0) {
            filtered = filtered.filter(card => {
                if (!card.labels || card.labels.length === 0) {
                    return labelFilters.includes('no-labels');
                }
                return card.labels.some(label => labelFilters.includes(label));
            });
        }

        return filtered;
    }

    // Update label filter dropdown with available labels
    updateLabelFilters() {
        const labelFiltersContainer = document.getElementById('label-filters');
        if (!labelFiltersContainer) return;

        // Collect all unique labels from all cards
        const allLabels = new Set();
        Object.values(this.cards).forEach(columnCards => {
            columnCards.forEach(card => {
                if (card.labels && Array.isArray(card.labels)) {
                    card.labels.forEach(label => allLabels.add(label));
                }
            });
        });

        // Clear existing label filters
        labelFiltersContainer.innerHTML = '';

        // Add predefined labels (feature, bug, documentation) first
        const predefinedLabels = ['feature', 'bug', 'documentation'];
        predefinedLabels.forEach(label => {
            allLabels.add(label);
        });

        // Sort labels alphabetically
        const sortedLabels = Array.from(allLabels).sort();

        // Create checkboxes for each label
        sortedLabels.forEach(label => {
            const labelElement = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'filter-label';
            checkbox.value = label; // Don't escape the value, just the display text
            
            // Add event listener immediately with debug
            checkbox.addEventListener('change', (e) => {
                this.applyFilters();
            });
            
            labelElement.appendChild(checkbox);
            labelElement.appendChild(document.createTextNode(' ' + this.escapeHtml(label)));
            labelFiltersContainer.appendChild(labelElement);
        });

        // Add "No Labels" option
        const noLabelsElement = document.createElement('label');
        const noLabelsCheckbox = document.createElement('input');
        noLabelsCheckbox.type = 'checkbox';
        noLabelsCheckbox.className = 'filter-label';
        noLabelsCheckbox.value = 'no-labels';
        
        // Add event listener immediately with debug
        noLabelsCheckbox.addEventListener('change', (e) => {
            console.log('No Labels filter changed:', 'checked:', e.target.checked);
            this.applyFilters();
        });
        
        noLabelsElement.appendChild(noLabelsCheckbox);
        noLabelsElement.appendChild(document.createTextNode(' No Labels'));
        labelFiltersContainer.appendChild(noLabelsElement);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear all data (for debugging)
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.cards = { todo: [], doing: [], done: [] };
            this.saveCards();
            this.renderAllCards();
        }
    }
}

// Initialize the application
let boardManager;
let trelloBoard;

document.addEventListener('DOMContentLoaded', () => {
    boardManager = new BoardManager();
    trelloBoard = boardManager.trelloBoard; // For backward compatibility with existing onclick handlers
    
    // Ensure global reference is available
    if (typeof window !== 'undefined') {
        window.trelloBoard = trelloBoard;
        window.boardManager = boardManager;
    }
});
