const VFS = {
    data: {
        '/': { type: 'directory', name: '/', path: '/', children: {} }
    },

    // Helper function to navigate to a path and get the parent and target name
    _resolvePath: function(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.data['/']; // Start at the root
        let parent = null;
        let targetName = '';

        if (path === '/') {
            return { parent: null, current: this.data['/'], targetName: '/' };
    }

    // targetName is the last part of the path.
    targetName = parts[parts.length - 1];

    // Traverse to the directory *containing* the target.
    // 'current' will end up being this parent directory.
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current.children || !current.children[part] || current.children[part].type !== 'directory') {
            return { parent: null, current: null, targetName: null, error: `Path not found or not a directory at: ${part}` };
        }
        // parent here is for the iteration, to correctly set the final parent of the target.
        parent = current;
        current = current.children[part];
    }

    // After the loop, 'current' is the direct parent directory of the target.
    // Determine the correct 'parent' for the return value.
    if (parts.length === 1) { // Target is a direct child of root
        parent = this.data['/']; // The parent is root itself
    } else {
        // For paths like /foo/bar.txt, after loop: current is /foo. parent for /foo is root.
        // For resolvePath, the 'parent' of bar.txt is /foo.
        // The 'current' in the loop becomes the 'parent' of the actual target node.
        parent = current;
    }

    // Now, 'current' (the target node itself) should be resolved from its parent.
    current = parent.children ? parent.children[targetName] : undefined;

    if (parts.length === 0) { // Should ideally be caught by path === '/' earlier
        return { parent: null, current: null, targetName: null, error: "Invalid path" };
    }

    return { parent, current, targetName };
}


createFile: function(path, content = '') {
    if (path === '/') return false; // Cannot create a file at root

    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return false;

    let currentDirNode = this.data['/'];
    let constructedPath = '';

    // Create parent directories if they don't exist
    for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        constructedPath = constructedPath === '' ? '/' + dirName : constructedPath + '/' + dirName;
        if (!currentDirNode.children[dirName]) {
            currentDirNode.children[dirName] = {
                type: 'directory',
                name: dirName,
                path: constructedPath,
                children: {}
            };
        } else if (currentDirNode.children[dirName].type !== 'directory') {
            console.error(`Error: ${constructedPath} is a file, cannot create directory inside it.`);
            return false; // Part of the path is a file
        }
        currentDirNode = currentDirNode.children[dirName];
    }

    const fileName = parts[parts.length - 1];
    constructedPath = constructedPath === '' ? '/' + fileName : constructedPath + '/' + fileName;

    if (currentDirNode.children[fileName]) {
        console.error(`Error: ${constructedPath} already exists.`);
        return false; // File/directory already exists
    }

    currentDirNode.children[fileName] = {
        type: 'file',
        name: fileName,
        path: constructedPath, // Corrected from fullPath
        content: content
    };

    return true;
}
    return true;
},

readFile: function(path) {
    const { current, error } = this._resolvePath(path);

    if (error) {
        console.error(error);
        return null;
    }

    if (!current) {
        console.error(`Error: Path not found: ${path}`);
        return null;
    }

    if (current.type !== 'file') {
        console.error(`Error: Not a file: ${path}`);
        return null;
    }

    return current.content;
}
    return current.content;
},

updateFile: function(path, newContent) {
    const { current, error } = this._resolvePath(path);

    if (error) {
        console.error(error);
        return false;
    }

    if (!current) {
        console.error(`Error: Path not found: ${path}`);
        return false;
    }

    if (current.type !== 'file') {
        console.error(`Error: Not a file: ${path}`);
        return false;
    }

    current.content = newContent;
    return true;
}
    current.content = newContent;
    return true;
},

deleteFile: function(path) {
    if (path === '/') return false; // Cannot delete root

    const { parent, current, targetName, error } = this._resolvePath(path);

    if (error) {
        console.error(error);
        return false;
    }

    if (!current) {
        console.error(`Error: File not found: ${path}`);
        return false;
    }

    if (current.type !== 'file') {
        console.error(`Error: Not a file: ${path}`);
        return false;
    }

    if (!parent || !parent.children || !parent.children[targetName]) {
         // This case should ideally be caught by _resolvePath returning current as null
        console.error(`Error: Could not find parent or file in parent's children: ${path}`);
        return false;
    }

    delete parent.children[targetName];
    return true;
}
    delete parent.children[targetName];
    return true;
},

deleteDirectory: function(path) {
    if (path === '/') return false; // Cannot delete root

    const { parent, current, targetName, error } = this._resolvePath(path);

    if (error) {
        console.error(error);
        return false;
    }

    if (!current) {
        console.error(`Error: Directory not found: ${path}`);
        return false;
    }

    if (current.type !== 'directory') {
        console.error(`Error: Not a directory: ${path}`);
        return false;
    }

    if (Object.keys(current.children).length > 0) {
        console.error(`Error: Directory not empty: ${path}`);
        return false;
    }

    if (!parent || !parent.children || !parent.children[targetName]) {
        // This case should ideally be caught by _resolvePath returning current as null
        console.error(`Error: Could not find parent or directory in parent's children: ${path}`);
        return false;
    }

    delete parent.children[targetName];
    return true;
}
    delete parent.children[targetName];
    return true;
},

listDirectoryContents: function(path) {
    const { current, error } = this._resolvePath(path);

    if (error) {
        console.error(error);
        return null;
    }

    if (!current) {
        console.error(`Error: Directory not found: ${path}`);
        return null;
    }

    if (current.type !== 'directory') {
        console.error(`Error: Not a directory: ${path}`);
        return null;
    }

    return Object.keys(current.children);
}
    return Object.keys(current.children);
},

createDirectory: function(path) {
    if (path === '/') return false; // Root directory already exists

    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return false;

    let currentDirNode = this.data['/']; // Corrected: currentDir to currentDirNode
    let constructedPath = ''; // Corrected: fullPath to constructedPath

    // Create parent directories if they don't exist
    for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        constructedPath = (constructedPath === '') ? '/' + dirName : constructedPath + '/' + dirName;
        if (!currentDirNode.children[dirName]) {
            currentDirNode.children[dirName] = {
                type: 'directory',
                name: dirName,
                path: constructedPath,
                children: {}
            };
        } else if (currentDirNode.children[dirName].type !== 'directory') { // Corrected: currentDirNode
            console.error(`Error: ${constructedPath} is a file, cannot create directory inside it.`);
            return false; // Part of the path is a file
        }
        currentDirNode = currentDirNode.children[dirName]; // Corrected: currentDirNode
    }

    const newDirName = parts[parts.length - 1];
    constructedPath = (constructedPath === '') ? '/' + newDirName : constructedPath + '/' + newDirName;

    if (currentDirNode.children[newDirName]) {
        console.error(`Error: ${constructedPath} already exists.`);
        return false; // File/directory already exists
    }

    currentDirNode.children[newDirName] = {
        type: 'directory',
        name: newDirName,
        path: constructedPath,
        children: {}
    };

    return true;
}
}; // End of VFS object

// UI Rendering Functions
const fileExplorerDiv = document.getElementById('file-explorer');
const currentPathDiv = document.getElementById('current-path');
let currentExplorerPath = '/'; // Track current path in file explorer
const editorContainer = document.getElementById('editor-container');
const editingFilePathSpan = document.getElementById('editing-file-path');
const fileEditorTextarea = document.getElementById('file-editor-textarea');
const saveFileButton = document.getElementById('save-file-button');
const saveStatusP = document.getElementById('save-status');

// Chat UI Elements
const chatMessagesContainer = document.getElementById('chat-messages-container');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat-button');
const mentionDropdown = document.getElementById('mention-dropdown');

let currentlyEditingPath = null;
let activeMentionQuery = null; // Stores the query part after '@'

// Placeholder for displaying messages
function displayMessage(message, sender) {
    // Sanitize message to prevent HTML injection if not already handled
    // For now, assuming messages are plain text or trusted.
    console.log(`[${sender}]: ${message}`);
    if (chatMessagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.classList.add(sender === 'User' ? 'user-message' : 'bot-message');
        messageDiv.textContent = message;
        chatMessagesContainer.appendChild(messageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
    }
}

function tool_list_files(path = null) {
    const targetPath = path === null ? currentExplorerPath : path;
    const items = VFS.listDirectoryContents(targetPath);
    if (items) {
        if (items.length === 0) {
            return `Directory \`${targetPath}\` is empty.`;
        }
        // We can enhance this by getting type (file/dir) from VFS._resolvePath for each item
        const itemList = items.map(item => {
            const itemFullPath = targetPath === '/' ? `/${item}` : `${targetPath}/${item}`;
            const { current: itemNode } = VFS._resolvePath(itemFullPath);
            if (itemNode) {
                return `- ${item} (${itemNode.type})`;
            }
            return `- ${item} (unknown type)`;
        }).join('\n');
        return `Contents of \`${targetPath}\`:\n${itemList}`;
    } else {
        return `Error: Could not list contents of \`${targetPath}\`. It might not exist or is not a directory.`;
    }
}

function tool_delete_file(path) {
    const success = VFS.deleteFile(path);
    if (success) {
        if (path === currentlyEditingPath) {
            currentlyEditingPath = null;
            editingFilePathSpan.textContent = 'None';
            fileEditorTextarea.value = '';
            editorContainer.style.display = 'none';
            saveStatusP.textContent = `File ${path} was deleted.`;
        }
        renderFileExplorer(getParentPath(path));
        return `File \`${path}\` deleted successfully.`;
    } else {
        return `Error: Could not delete file \`${path}\`. It might not exist or is not a file.`;
    }
}

function tool_delete_folder(path) {
    const success = VFS.deleteDirectory(path);
    if (success) {
        if (getParentPath(currentlyEditingPath) === path || currentlyEditingPath === path ) { // if current file was in deleted folder
            currentlyEditingPath = null;
            editingFilePathSpan.textContent = 'None';
            fileEditorTextarea.value = '';
            editorContainer.style.display = 'none';
            saveStatusP.textContent = `The folder containing the open file ${currentlyEditingPath} was deleted.`;
        }
        renderFileExplorer(getParentPath(path));
        return `Directory \`${path}\` deleted successfully.`;
    } else {
        return `Error: Could not delete directory \`${path}\`. It might not exist, not be a directory, or is not empty.`;
    }
}

function tool_write_file(path, content) {
    const success = VFS.updateFile(path, content);
    if (success) {
        if (path === currentlyEditingPath) {
            fileEditorTextarea.value = content; // Refresh editor
        }
        // No need to refresh file explorer for content update unless modification times were displayed
        return `File \`${path}\` updated successfully.`;
    } else {
        return `Error: Could not update file \`${path}\`. It might not exist or is not a file.`;
    }
}

function tool_read_file(path) {
    const content = VFS.readFile(path);
    if (content !== null) {
        return `Content of \`${path}\`:\n\`\`\`\n${content}\n\`\`\``;
    } else {
        return `Error: Could not read file \`${path}\`. It might not exist or is not a file.`;
    }
}

if (sendChatButton && chatInput) {
    sendChatButton.addEventListener('click', () => {
        const messageText = chatInput.value.trim();
        if (messageText) {
            displayMessage(messageText, 'User');
            chatInput.value = '';
            processUserCommand(messageText); // Process the command
        }
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Send on Enter, allow Shift+Enter for newline in textarea if it were one
            event.preventDefault(); // Prevent default newline in input/form submission
            sendChatButton.click();
        }
    });
}

const HELP_MESSAGE = `Available AI Copilot commands:
- \`help\`: Shows this help message.
- \`create file <path> [content]\`: Creates a new file with optional content.
    Example: create file /my_file.txt Hello world
- \`write file <path> <content>\`: Writes (overwrites) content to a file.
    Example: write file /my_file.txt New content
- \`read file <path>\`: Displays the content of a file.
    Example: read file /my_file.txt
- \`delete file <path>\`: Deletes a file.
    Example: delete file /my_file.txt
- \`create folder <path>\` or \`mkdir <path>\`: Creates a new directory.
    Example: create folder /my_docs
- \`delete folder <path>\` or \`rmdir <path>\`: Deletes an empty directory.
    Example: delete folder /my_docs
- \`list files [path]\` or \`ls [path]\`: Lists files and directories. Path is optional, defaults to current explorer view.
    Example: ls /documents
    Example: ls`;

function processUserCommand(commandString) {
    const parts = commandString.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || []; // Split by space, respecting quotes
    if (parts.length === 0) {
        displayMessage("Please enter a command.", "Bot");
        return;
    }

    const command = parts[0].toLowerCase();
    let resultMessage = "";

    try {
        switch (command) {
            case 'help':
                resultMessage = HELP_MESSAGE;
                break;
            case 'ls':
            case 'list': // 'list files'
                if (parts.length > 1 && (parts[1].toLowerCase() === 'files' || parts[1].toLowerCase() === 'file')) { // common mistake to type "list file"
                    parts.splice(1,1); // remove "files" part, path is next
                }
                // Path is optional for ls/list files
                const listPath = parts[1] ? parts[1].replace(/"/g, '') : null; // Use null if no path, remove quotes
                resultMessage = tool_list_files(listPath);
                break;
            case 'mkdir':
            case 'create': // 'create folder'
                if (parts.length > 1 && parts[1].toLowerCase() === 'folder') {
                     if (parts.length > 2) {
                        const createFolderPath = parts[2].replace(/"/g, '');
                        resultMessage = tool_add_folder(createFolderPath);
                    } else {
                        resultMessage = "Missing path for create folder. Usage: create folder <path>";
                    }
                } else if (command === 'mkdir' && parts.length > 1) {
                    const createFolderPath = parts[1].replace(/"/g, '');
                    resultMessage = tool_add_folder(createFolderPath);
                }
                 else {
                    resultMessage = "Unknown command or missing argument. Usage: create folder <path> or mkdir <path>";
                }
                break;
            case 'rmdir':
            case 'delete': // 'delete folder'
                 if (parts.length > 1 && parts[1].toLowerCase() === 'folder') {
                    if (parts.length > 2) {
                        const deleteFolderPath = parts[2].replace(/"/g, '');
                        resultMessage = tool_delete_folder(deleteFolderPath);
                    } else {
                        resultMessage = "Missing path for delete folder. Usage: delete folder <path>";
                    }
                } else if (command === 'rmdir' && parts.length > 1) {
                    const deleteFolderPath = parts[1].replace(/"/g, '');
                    resultMessage = tool_delete_folder(deleteFolderPath);
                }
                 else {
                    // Distinguish 'delete file' from 'delete folder'
                    if (parts.length > 1 && parts[1].toLowerCase() === 'file') {
                        if (parts.length > 2) {
                            const deleteFilePath = parts[2].replace(/"/g, '');
                            resultMessage = tool_delete_file(deleteFilePath);
                        } else {
                            resultMessage = "Missing path for delete file. Usage: delete file <path>";
                        }
                    } else if (command === 'delete' && parts.length > 1 && parts[1].toLowerCase() !== 'folder') {
                         // if it's just 'delete <path>', assume it's a file for now.
                         // More robust would be to check if path is file or folder via VFS.
                        const deleteFilePath = parts[1].replace(/"/g, '');
                        resultMessage = tool_delete_file(deleteFilePath);
                    }
                    // If it was 'delete folder', it's already handled by the 'delete folder' case above.
                    // Otherwise, it's an unknown 'delete' command or rmdir was used for a file.
                    else if (command !== 'rmdir') { // rmdir has its own specific error if path is not a folder
                         resultMessage = "Unknown 'delete' command usage. Options: delete file <path>, delete folder <path>.";
                    } else {
                        // rmdir specific error is handled by tool_delete_folder if path is a file
                         const deletePath = parts[1].replace(/"/g, '');
                         resultMessage = tool_delete_folder(deletePath); // Let tool handle if it's a file
                    }
                }
                break;
            case 'create': // Already partly handled for 'create folder'
                if (parts.length > 1 && parts[1].toLowerCase() === 'file') {
                    if (parts.length > 2) {
                        const createFilePath = parts[2].replace(/"/g, '');
                        const content = parts.slice(3).join(" ").replace(/^"|"$/g, ''); // Content is everything after path, remove surrounding quotes if any
                        resultMessage = tool_add_file(createFilePath, content);
                    } else {
                        resultMessage = "Missing path for create file. Usage: create file <path> [content]";
                    }
                } else if (command === 'create' && parts.length > 1 && parts[1].toLowerCase() !== 'folder') {
                     resultMessage = "Unknown 'create' command. Did you mean 'create file <path>' or 'create folder <path>'?";
                }
                // 'create folder' is handled above
                break;
            case 'write': // 'write file <path> <content>'
                if (parts.length > 1 && parts[1].toLowerCase() === 'file') {
                    if (parts.length > 3) {
                        const writeFilePath = parts[2].replace(/"/g, '');
                        const content = parts.slice(3).join(" ").replace(/^"|"$/g, '');
                        resultMessage = tool_write_file(writeFilePath, content);
                    } else {
                        resultMessage = "Missing path or content for write file. Usage: write file <path> <content>";
                    }
                } else {
                    resultMessage = "Unknown 'write' command. Did you mean 'write file <path> <content>'?";
                }
                break;
            case 'read': // 'read file <path>'
                if (parts.length > 1 && parts[1].toLowerCase() === 'file') {
                    if (parts.length > 2) {
                        const readFilePath = parts[2].replace(/"/g, '');
                        resultMessage = tool_read_file(readFilePath);
                    } else {
                        resultMessage = "Missing path for read file. Usage: read file <path>";
                    }
                } else {
                    resultMessage = "Unknown 'read' command. Did you mean 'read file <path>'?";
                }
                break;
            default:
                // If command was 'create', 'delete' but not 'folder' or 'file', it might have been caught by more specific 'create' or 'delete' above.
                // This is a final fallback.
                if (command !== 'create' && command !== 'delete') {
                     resultMessage = "Unknown command. Type 'help' for a list of commands.";
                } else if (resultMessage === "") { // If resultMessage is empty, it means a multi-part command like 'create' or 'delete' didn't match a sub-type.
                    resultMessage = `Unknown command '${commandString}'. Type 'help' for options.`;
                }
                break;
        }
    } catch (e) {
        console.error("Error processing command:", e);
        resultMessage = "An unexpected error occurred while processing the command.";
    }

    displayMessage(resultMessage, "Bot");
}

function getAllFilePaths(currentVfsNode = VFS.data['/'], currentPath = '/') {
    let paths = [];
    for (const name in currentVfsNode.children) {
        const child = currentVfsNode.children[name];
        const childPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        if (child.type === 'file') {
            paths.push(childPath);
        } else if (child.type === 'directory') {
            paths = paths.concat(getAllFilePaths(child, childPath));
        }
    }
    return paths;
}

if (chatInput && mentionDropdown) {
    chatInput.addEventListener('input', (event) => {
        const value = chatInput.value;
        const cursorPos = chatInput.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const atMatch = textBeforeCursor.match(/@(\S*)$/);

        if (atMatch) {
            activeMentionQuery = atMatch[1].toLowerCase(); // Store the query (text after @)
            mentionDropdown.innerHTML = ''; // Clear previous suggestions

            let allFiles = getAllFilePaths();
            let suggestions = [];

            if (currentlyEditingPath && VFS.readFile(currentlyEditingPath) !== null) { // Check if it's a valid file
                suggestions.push(currentlyEditingPath);
                allFiles = allFiles.filter(p => p !== currentlyEditingPath); // Remove duplicate
            }

            const filteredFiles = allFiles.filter(filePath =>
                filePath.toLowerCase().includes(activeMentionQuery)
            );

            suggestions = suggestions.concat(filteredFiles);
            suggestions = [...new Set(suggestions)]; // Ensure uniqueness again after concat

            if (suggestions.length > 0) {
                suggestions.slice(0, 10).forEach(filePath => { // Limit to 10 suggestions
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'mention-item';
                    itemDiv.textContent = filePath; // Display full path
                    itemDiv.setAttribute('data-filepath', filePath);

                    itemDiv.addEventListener('click', () => {
                        const mentionStartPos = textBeforeCursor.lastIndexOf('@');
                        if (mentionStartPos !== -1) {
                            const textAfterCursor = value.substring(cursorPos);
                            const newText = textBeforeCursor.substring(0, mentionStartPos) + filePath + " " + textAfterCursor;
                            chatInput.value = newText;

                            // Set cursor position after the inserted path + space
                            const newCursorPos = mentionStartPos + filePath.length + 1;
                            chatInput.focus();
                            chatInput.setSelectionRange(newCursorPos, newCursorPos);
                        }
                        mentionDropdown.style.display = 'none';
                        activeMentionQuery = null;
                    });
                    mentionDropdown.appendChild(itemDiv);
                });
                mentionDropdown.style.display = 'block';
            } else {
                mentionDropdown.style.display = 'none';
                activeMentionQuery = null;
            }
        } else {
            mentionDropdown.style.display = 'none';
            activeMentionQuery = null;
        }
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            mentionDropdown.style.display = 'none';
            activeMentionQuery = null;
        }
    });

    chatInput.addEventListener('blur', () => {
        // Delay hiding to allow click on dropdown items
        setTimeout(() => {
            if (!mentionDropdown.matches(':hover')) { // Only hide if mouse isn't over dropdown
                mentionDropdown.style.display = 'none';
                activeMentionQuery = null;
            }
        }, 150);
    });

    // Hide dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!chatInput.contains(event.target) && !mentionDropdown.contains(event.target) && mentionDropdown.style.display === 'block') {
            mentionDropdown.style.display = 'none';
            activeMentionQuery = null;
        }
    });
}


function renderFileExplorer(targetPath = '/') {
    currentExplorerPath = targetPath; // Update current explorer path

    if (!fileExplorerDiv || !currentPathDiv) {
        console.error("Required UI elements not found in HTML.");
        return;
    }

    // Clear current view
    fileExplorerDiv.innerHTML = '';
    currentPathDiv.textContent = targetPath;

    // Add "Up" button for navigation, unless we are at root
    if (targetPath !== '/') {
        const upButton = document.createElement('div');
        upButton.className = 'explorer-item directory-item'; // Style like a directory
        upButton.textContent = '.. (Up)';
        upButton.onclick = () => {
            const parts = targetPath.split('/').filter(p => p);
            parts.pop(); // Remove current directory
            const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
            renderFileExplorer(parentPath);
        };
        fileExplorerDiv.appendChild(upButton);
    }

    const items = VFS.listDirectoryContents(targetPath); // USE VFS
    if (!items) {
        // Error already logged by VFS.listDirectoryContents
        return;
    }

    items.sort((a, b) => { // Sort: directories first, then alphabetically
        const aNode = VFS._resolvePath(targetPath === '/' ? `/${a}` : `${targetPath}/${a}`).current; // USE VFS
        const bNode = VFS._resolvePath(targetPath === '/' ? `/${b}` : `${targetPath}/${b}`).current; // USE VFS
        if (aNode && bNode) {
            if (aNode.type === 'directory' && bNode.type !== 'directory') return -1;
            if (aNode.type !== 'directory' && bNode.type === 'directory') return 1;
        }
        return a.localeCompare(b);
    });


    items.forEach(itemName => {
        const itemPath = targetPath === '/' ? `/${itemName}` : `${targetPath}/${itemName}`;
        const { current: itemNode } = VFS._resolvePath(itemPath); // USE VFS

        if (!itemNode) {
            console.error(`Could not resolve item: ${itemPath}`);
            return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'explorer-item';
        itemDiv.textContent = itemName;

        if (itemNode.type === 'directory') {
            itemDiv.classList.add('directory-item');
            itemDiv.onclick = () => renderFileExplorer(itemPath);
        } else if (itemNode.type === 'file') {
            itemDiv.classList.add('file-item');
            itemDiv.onclick = () => {
                currentlyEditingPath = itemPath;
                editingFilePathSpan.textContent = itemPath;
                const content = VFS.readFile(itemPath); // USE VFS
                fileEditorTextarea.value = content !== null ? content : '';
                editorContainer.style.display = 'block';
                saveStatusP.textContent = ''; // Clear previous status
            };
        }
        fileExplorerDiv.appendChild(itemDiv);
    });
}

if (saveFileButton) {
    saveFileButton.addEventListener('click', () => {
        if (currentlyEditingPath) {
            const newContent = fileEditorTextarea.value;
            if (VFS.updateFile(currentlyEditingPath, newContent)) { // USE VFS
                saveStatusP.textContent = `File "${currentlyEditingPath}" saved successfully!`;
                console.log(`File saved: ${currentlyEditingPath}`);
            } else {
                saveStatusP.textContent = `Error saving file "${currentlyEditingPath}".`;
                console.error(`Error saving file: ${currentlyEditingPath}`);
            }
        } else {
            saveStatusP.textContent = "No file is currently open for editing.";
            console.warn("Save button clicked but no file is open.");
        }
    });
}


// Initial render
document.addEventListener('DOMContentLoaded', () => {
    if (!fileExplorerDiv || !currentPathDiv || !editorContainer || !editingFilePathSpan || !fileEditorTextarea || !saveFileButton || !saveStatusP || !chatMessagesContainer || !chatInput || !sendChatButton ) {
        console.error("One or more UI elements are missing from the DOM. Core functionality might be affected.");
    }

    // Create some initial files/folders for testing
    VFS.createDirectory('/documents'); // USE VFS
    VFS.createFile('/documents/notes.txt', 'This is a note.'); // USE VFS
    VFS.createDirectory('/documents/work'); // USE VFS
    VFS.createFile('/documents/work/report.docx', 'Work report content.'); // USE VFS
    VFS.createFile('/readme.txt', 'Hello VFS!'); // USE VFS
    VFS.createDirectory('/empty_folder'); // USE VFS

    renderFileExplorer('/');
    displayMessage("Welcome to the AI Copilot! Type 'help' to see available commands.", "Bot"); // Welcome message
});

// AI Tool Functions (to be called by the AI model)

function getParentPath(filePath) {
    if (filePath === '/') return '/'; // Parent of root is root
    const parts = filePath.split('/').filter(p => p);
    if (parts.length <= 1) return '/'; // Parent of /file.txt is /
    parts.pop();
    return '/' + parts.join('/');
}

function tool_add_file(path, content = '') {
    const success = VFS.createFile(path, content);
    if (success) {
        renderFileExplorer(getParentPath(path));
        return `File \`${path}\` created successfully.`;
    } else {
        return `Error: Could not create file \`${path}\`. It might already exist or the path is invalid.`;
    }
}

function tool_add_folder(path) {
    const success = VFS.createDirectory(path);
    if (success) {
        renderFileExplorer(getParentPath(path));
        return `Directory \`${path}\` created successfully.`;
    } else {
        return `Error: Could not create directory \`${path}\`. It might already exist or the path is invalid.`;
    }
}
