# Trello-Like Board Application with Multiple Board Support

A comprehensive, fully functional Trello-like board application built with vanilla HTML, CSS, and JavaScript. Features multiple board management, local storage persistence, and advanced card management capabilities.

## 🚀 New Features - Multiple Board Support

### Board Management
- **Create Multiple Boards**: Organize different projects with separate boards
- **Board Switching**: Seamlessly switch between boards with dropdown selector
- **Editable Board Titles**: Click to edit board names with inline editing
- **Board Deletion**: Remove boards with confirmation (protects default board)
- **Import/Export**: Backup and share boards via JSON files

### Enhanced User Interface
- **Professional Board Header**: Clean management interface with board controls
- **Responsive Design**: Optimized for desktop and mobile devices
- **Visual Feedback**: Smooth transitions and hover effects
- **Modal Dialogs**: Consistent design for board and card operations

## 📋 Core Features

### Card Management
- **Add/Edit/Delete Cards**: Full CRUD operations for cards
- **Drag & Drop**: Move cards between columns visually
- **Card Priorities**: High, Medium, Low priority levels with color coding
- **Due Dates**: Set due dates with visual indicators (overdue, due today, due soon)
- **Rich Descriptions**: Add detailed descriptions to cards

### Search & Filter
- **Real-time Search**: Find cards by title or description
- **Priority Filtering**: Filter by priority levels
- **Due Date Filtering**: Filter by due date status
- **Combined Filters**: Use multiple filters simultaneously

### Data Persistence
- **Local Storage**: Automatic saving of all data
- **Data Migration**: Seamlessly upgrades from single-board to multi-board format
- **Import/Export**: JSON-based data backup and sharing
- **Cross-Session Persistence**: Remembers current board selection

## 🛠️ Technical Architecture

### Class Structure

#### BoardManager Class
Handles multiple board operations:
- Board creation, deletion, and switching
- Data persistence and migration
- Import/export functionality
- Board title management
- UI coordination

#### TrelloBoard Class
Manages card operations within board context:
- Card CRUD operations
- Drag and drop functionality
- Search and filtering
- Modal management
- Rendering and UI updates

### Data Structure
```javascript
// Multi-board format
{
  'board_id': {
    id: 'board_id',
    title: 'Board Title',
    createdAt: '2025-07-10T04:00:00.000Z',
    cards: {
      todo: [
        {
          id: 'card_id',
          title: 'Card Title',
          description: 'Optional description',
          priority: 'high|medium|low|none',
          dueDate: '2025-07-15',
          createdAt: '2025-07-10T04:00:00.000Z',
          updatedAt: '2025-07-10T04:00:00.000Z'
        }
      ],
      doing: [...],
      done: [...]
    }
  }
}
```

## 🚀 Getting Started

### Installation
1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. Start creating boards and managing cards!

### Browser Requirements
- Modern browser with ES6+ support
- Local storage support
- HTML5 Drag and Drop API support
- Tested on: Chrome, Firefox, Safari, Edge

## 📖 Usage Guide

### Board Management

#### Creating Boards
1. Click the "+ New Board" button in the header
2. Enter a board title
3. Click "Create Board" or press Enter
4. The new board becomes active automatically

#### Switching Boards
1. Use the dropdown selector in the header
2. Select any board to switch to it
3. Your selection is remembered across sessions

#### Editing Board Titles
1. Click the pencil icon (✏️) next to the board title
2. Edit the title in the modal dialog
3. Save changes or press Enter

#### Deleting Boards
1. Click the trash icon (🗑️) in the header
2. Confirm deletion in the dialog
3. Note: Default board and last remaining board cannot be deleted

### Card Management

#### Adding Cards
1. Click "+ Add Card" in any column
2. Enter title (required) and optional description
3. Set priority and due date if desired
4. Save the card

#### Editing Cards
1. Click on any existing card
2. Modify title, description, priority, or due date
3. Save changes

#### Moving Cards
1. Drag any card to a different column
2. Drop it in the target column
3. Changes save automatically

#### Deleting Cards
1. Hover over a card to reveal action buttons
2. Click the trash icon (🗑️)
3. Confirm deletion

### Search and Filtering

#### Search
1. Type in the search box at the top
2. Results update in real-time
3. Searches both titles and descriptions

#### Filtering
1. Click "Filters ▾" to open filter options
2. Select priority levels or due date ranges
3. Filters apply immediately
4. Use multiple filters together

### Data Management

#### Exporting Boards
1. Click the export button (📤) in the header
2. A JSON file downloads automatically
3. File name includes board title and timestamp

#### Importing Boards
1. Click the import button (📥) in the header
2. Select a JSON file from your computer
3. Board imports as "[Title] (Imported)"
4. Automatically switches to imported board

## ⌨️ Keyboard Shortcuts

- **Enter**: Save card or board title when editing
- **Escape**: Close any open modal dialog
- **Click outside modal**: Close modal dialog

## 🔧 Developer Features

### Console Commands
Access additional features via browser console:

```javascript
// Clear all data
boardManager.boards = { default: boardManager.boards.default };
boardManager.saveBoards();

// Export current board data
console.log(JSON.stringify(boardManager.getCurrentBoard(), null, 2));

// List all boards
console.log(Object.keys(boardManager.boards));

// Switch to specific board
boardManager.switchToBoard('board_id');
```

### Data Migration
The application automatically detects and migrates single-board data:
- Existing `trelloCards` data becomes the default board
- No data loss during migration
- Seamless upgrade experience

## 📁 File Structure

```
/Users/iforster/1. Projects/imfKanBan.github.io/
├── index.html          # Main HTML with board management UI
├── styles.css          # Complete styling including board header
├── script.js           # BoardManager + TrelloBoard classes
├── README.md           # This comprehensive documentation
└── CHAT_CONTEXT.md     # Development history and context
```

## 🎨 Styling Features

### Visual Design
- **Modern Gradient Background**: Professional appearance
- **Glass Morphism Effects**: Translucent elements with backdrop blur
- **Smooth Animations**: Transitions for all interactive elements
- **Color-Coded Priorities**: Visual priority indicators
- **Due Date Indicators**: Color-coded due date status

### Responsive Design
- **Mobile-First Approach**: Optimized for mobile devices
- **Flexible Layouts**: Adapts to different screen sizes
- **Touch-Friendly**: Large touch targets for mobile use
- **Readable Typography**: Optimized font sizes and spacing

## 🔒 Security Features

- **XSS Prevention**: HTML escaping for all user input
- **Input Validation**: Sanitization of form inputs
- **Safe Data Handling**: Proper JSON parsing with error handling
- **Local Storage Security**: Data stays on user's device

## 🚀 Performance Optimizations

- **Efficient DOM Updates**: Minimal re-rendering during operations
- **Event Delegation**: Optimized event handling
- **Lazy Rendering**: Cards rendered only when needed
- **Memory Management**: Proper cleanup of event listeners
- **Fast Board Switching**: No page reload required

## 🔮 Future Enhancement Roadmap

### Planned Features
- **Cloud Sync**: AWS integration for data persistence
- **Collaboration**: Real-time multi-user editing
- **Board Templates**: Pre-configured board layouts
- **Board Sharing**: Share boards via links
- **Workspace Management**: Organize boards into workspaces

### Advanced Features
- **Mobile App**: React Native or PWA version
- **Integration APIs**: GitHub, Jira, calendar sync
- **Analytics Dashboard**: Productivity metrics
- **Notification System**: Due date reminders
- **Advanced Permissions**: Access control for shared boards

## 🐛 Troubleshooting

### Common Issues

**Board not switching**: Refresh the page and try again
**Cards not saving**: Check if local storage is enabled
**Import failing**: Ensure JSON file has correct format
**Drag and drop not working**: Use a modern browser with HTML5 support

### Data Recovery
If data appears lost:
1. Check browser's local storage in developer tools
2. Look for `trelloBoards` key
3. Export data before making changes
4. Contact support with specific error messages

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:
1. Review the CHAT_CONTEXT.md file for development history
2. Follow existing code patterns and architecture
3. Test thoroughly before submitting changes
4. Update documentation for new features

## 📞 Support

For issues, feature requests, or questions:
1. Check the troubleshooting section
2. Review CHAT_CONTEXT.md for technical details
3. Create an issue with detailed information
4. Include browser version and error messages

---

**Built with ❤️ using vanilla HTML, CSS, and JavaScript**
