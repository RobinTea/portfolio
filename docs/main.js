let tabCounter = 1;
let activeTab = 1;
let tabs = {
    1: {
        title: "Menu", 
        currentPage: "menu"
    }
};
let tvActive = false;
let keysPressed = {};
let keyIndicatorTimeout;
let lastActionKeys = {}; // Track last action to prevent rapid repeated execution
const actionCooldown = 100; // Milliseconds between actions
let selectedMenuIndex = 0; // For menu navigation
let isInMenu = true; // Track if we're in a menu

// Template cache for better performance
const templateCache = {};

// Menu items mapping
const menuItems = ['whoami', 'why-you', 'why-me', 'files', 'contact'];

// Download functionality - Global functions
function downloadFile(filePath, fileName) {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Optional: Show download feedback
    showDownloadFeedback(fileName);
}

function showDownloadFeedback(fileName) {
    // Create and show a temporary success message
    const feedback = document.createElement('div');
    feedback.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000;
            color: white;
            padding: 1rem 1.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            border: 2px solid #fff;
        ">
            ✓ Downloading: ${fileName}
        </div>
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// Add download feedback styles to head if not already present
function addDownloadStyles() {
    if (!document.querySelector('#download-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'download-feedback-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Template loading function with caching and error handling
async function loadTemplate(pageName, variables = {}) {
    try {
        // Check cache first
        if (!templateCache[pageName]) {
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${pageName}.html: ${response.status}`);
            }
            templateCache[pageName] = await response.text();
        }
        
        let template = templateCache[pageName];
        
        // Replace template variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            template = template.replace(regex, variables[key]);
        });
        
        return template;
    } catch (error) {
        console.error('Error loading template:', error);
        return `<div class="error-message">Failed to load ${pageName}</div>`;
    }
}

// Page content templates using external files
const pageContent = {
    menu: async (tabId) => await loadTemplate('menu', { tabId }),
    whoami: async (tabId) => await loadTemplate('whoami', { tabId }),
    "why-you": async (tabId) => await loadTemplate('why-you', { tabId }),
    "why-me": async (tabId) => await loadTemplate('why-me', { tabId }),
    files: async (tabId) => await loadTemplate('files', { tabId }),
    contact: async (tabId) => await loadTemplate('contact', { tabId })
};

// Keyboard shortcuts with improved rapid action support
document.addEventListener('keydown', function(e) {
    // Don't trigger shortcuts if help modal is open
    if (document.getElementById('help-modal').classList.contains('active')) {
        if (e.key === 'h') {
            toggleHelp();
        }
        return;
    }
    
    // Handle launch screen
    if (document.getElementById('browser-container').classList.contains('browser-closed')) {
        if (e.key.toLowerCase() === ' ') {
            e.preventDefault();
            launchBrowser();
        }
        return;
    }

    const key = e.key.toLowerCase();
    const now = Date.now();
    
    // Set key as pressed
    keysPressed[key] = true;

    // Show key indicator
    showKeyIndicator();

    // Handle shortcuts with cooldown to allow rapid actions
    if (key === 'f') {
        const actionKey = 'f';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            openNewTab();
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'd') {
        const actionKey = 'd';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            closeTab(activeTab);
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 's') {
        const actionKey = 's';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            switchToNextTab();
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'a') {
        const actionKey = 'a';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            switchToPreviousTab();
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'x') {
        const actionKey = 'x';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            if (tabs[activeTab] && tabs[activeTab].currentPage !== 'menu') {
                navigateToPage(activeTab, 'menu');
            }
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'g') {
        const actionKey = 'g';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            toggleTV();
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'h') {
        const actionKey = 'h';
        if (!lastActionKeys[actionKey] || (now - lastActionKeys[actionKey]) > actionCooldown) {
            e.preventDefault();
            toggleHelp();
            lastActionKeys[actionKey] = now;
        }
    } else if (key === 'y' || key === ' ') {
        e.preventDefault();
        if (isInMenu) {
            // Confirm selection in menu
            const selectedItem = menuItems[selectedMenuIndex];
            navigateToPage(activeTab, selectedItem);
        }
    } else if (key === 'c' && isInMenu) {
        e.preventDefault();
        navigateMenu(-1);
    } else if (key === 'v' && isInMenu) {
        e.preventDefault();
        navigateMenu(1);
    }
});

document.addEventListener('keyup', function(e) {
    const key = e.key.toLowerCase();
    delete keysPressed[key];
    
    // Hide key indicator if no keys are pressed
    if (Object.keys(keysPressed).length === 0) {
        hideKeyIndicator();
    } else {
        showKeyIndicator(); // Update indicator
    }
});

function navigateMenu(direction) {
    const menuElements = document.querySelectorAll('.menu-item');
    if (menuElements.length === 0) return;

    // Remove current selection
    menuElements[selectedMenuIndex].classList.remove('selected');
    
    // Update selection
    selectedMenuIndex += direction;
    if (selectedMenuIndex < 0) selectedMenuIndex = menuElements.length - 1;
    if (selectedMenuIndex >= menuElements.length) selectedMenuIndex = 0;
    
    // Add new selection
    menuElements[selectedMenuIndex].classList.add('selected');
}

function switchToNextTab() {
    const tabIds = Object.keys(tabs).map(id => parseInt(id)).sort((a, b) => a - b);
    const currentIndex = tabIds.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    switchToTab(tabIds[nextIndex]);
}

function switchToPreviousTab() {
    const tabIds = Object.keys(tabs).map(id => parseInt(id)).sort((a, b) => a - b);
    const currentIndex = tabIds.indexOf(activeTab);
    const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
    switchToTab(tabIds[prevIndex]);
}

function switchToTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to target tab
    const targetTab = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
        activeTab = tabId;
        isInMenu = (tabs[activeTab].currentPage === 'menu');
        updateContent();
    }
}

function showKeyIndicator() {
    const indicator = document.getElementById('key-indicator');
    const pressedKeys = Object.keys(keysPressed).map(k => k.toUpperCase()).join(' + ');
    indicator.textContent = pressedKeys;
    indicator.classList.add('active');
    
    clearTimeout(keyIndicatorTimeout);
    keyIndicatorTimeout = setTimeout(hideKeyIndicator, 1500);
}

function hideKeyIndicator() {
    document.getElementById('key-indicator').classList.remove('active');
}

function clearKeys() {
    keysPressed = {};
    hideKeyIndicator();
}

function toggleHelp() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.toggle('active');
}

function toggleTV() {
    tvActive = !tvActive;
    const body = document.body;
    const indicator = document.getElementById('tv-indicator');
    
    if (tvActive) {
        body.classList.add('tv-effect');
        indicator.classList.add('active');
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 2000); // Show indicator for 2 seconds
    } else {
        body.classList.remove('tv-effect');
        indicator.classList.add('active');
        indicator.textContent = 'OLD TV MODE OFF';
        setTimeout(() => {
            indicator.classList.remove('active');
            indicator.textContent = 'OLD TV MODE';
        }, 2000);
    }
}

function launchBrowser() {
    // Hide launch screen and show browser
    document.getElementById('launch-screen').classList.add('hidden');
    document.getElementById('browser-container').classList.remove('browser-closed');
    // Load initial content
    updateContent();
}

async function navigateToPage(tabId, page) {
    if (!tabs[tabId]) return;
    
    tabs[tabId].currentPage = page;
    isInMenu = (page === 'menu');
    
    // Reset menu selection when entering menu
    if (isInMenu) {
        selectedMenuIndex = 0;
    }
    
    // Update tab title based on page
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    const tabTitle = tabElement.querySelector('.tab-title');
    
    if (page === 'menu') {
        tabTitle.textContent = 'Menu';
        tabs[tabId].title = 'Menu';
    } else {
        tabTitle.textContent = page;
        tabs[tabId].title = page;
    }
    
    // Update content if this is the active tab
    if (tabId == activeTab) {
        await updateContent();
    }
}

async function openNewTab() {
    // Calculate max tabs based on browser width
    const browserWidth = window.innerWidth;
    const tabMinWidth = 150;
    const controlsWidth = 100;
    const maxTabs = Math.floor((browserWidth - controlsWidth) / tabMinWidth);
    
    if (Object.keys(tabs).length >= maxTabs) {
        return;
    }
    
    tabCounter++;
    const tabId = tabCounter;
    
    // Create new tab with menu as default page
    tabs[tabId] = {
        title: "Menu", 
        currentPage: "menu"
    };
    
    // Create new tab element
    const tabBar = document.querySelector('.tab-bar');
    const newTabBtn = document.querySelector('.new-tab-btn');
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.setAttribute('data-tab-id', tabId);
    tabElement.innerHTML = `
        <span class="tab-title">Menu</span>
        <span class="tab-close" onclick="closeTab(${tabId})">×</span>
    `;
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to new tab
    tabElement.classList.add('active');
    
    tabBar.insertBefore(tabElement, newTabBtn);
    
    // Switch to new tab
    activeTab = tabId;
    isInMenu = true;
    selectedMenuIndex = 0;
    await updateContent();
    
    checkTabLimit();
}

function checkTabLimit() {
    const browserWidth = window.innerWidth;
    const tabMinWidth = 150;
    const controlsWidth = 100;
    const maxTabs = Math.floor((browserWidth - controlsWidth) / tabMinWidth);
    const newTabBtn = document.querySelector('.new-tab-btn');
    
    if (Object.keys(tabs).length >= maxTabs) {
        newTabBtn.style.display = 'none';
    } else {
        newTabBtn.style.display = 'block';
    }
}

function closeTab(tabId) {
    // If it's the last tab, close the browser entirely
    if (Object.keys(tabs).length === 1) {
        closeBrowser();
        return;
    }
    
    // Remove tab from data
    delete tabs[tabId];
    
    // Remove tab element
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    const wasActive = tabElement.classList.contains('active');
    tabElement.remove();
    
    // If closed tab was active, activate another tab
    if (wasActive) {
        const remainingTabs = Object.keys(tabs);
        activeTab = parseInt(remainingTabs[0]);
        document.querySelector(`[data-tab-id="${activeTab}"]`).classList.add('active');
        isInMenu = (tabs[activeTab].currentPage === 'menu');
        updateContent();
    }
    
    checkTabLimit();
}

function closeBrowser() {
    document.getElementById('browser-container').classList.add('browser-closed');
    document.getElementById('launch-screen').classList.remove('hidden');
}

async function updateContent() {
    const contentArea = document.querySelector('.content-area');
    const tabData = tabs[activeTab];
    
    // Show loading state
    contentArea.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        if (tabData && pageContent[tabData.currentPage]) {
            const html = await pageContent[tabData.currentPage](activeTab);
            contentArea.innerHTML = html;
            
            // Reset menu selection if we're in menu
            if (tabData.currentPage === 'menu') {
                selectedMenuIndex = 0;
                const menuElements = document.querySelectorAll('.menu-item');
                menuElements.forEach((el, index) => {
                    el.classList.remove('selected');
                    if (index === 0) el.classList.add('selected');
                });
            }
        } else {
            const menuHtml = await pageContent.menu(activeTab);
            contentArea.innerHTML = menuHtml;
        }
    } catch (error) {
        console.error('Error updating content:', error);
        contentArea.innerHTML = '<div class="error-message">Error loading content</div>';
    }
}

// Add click handlers to tabs
document.addEventListener('click', function(e) {
    if (e.target.closest('.tab') && !e.target.classList.contains('tab-close')) {
        const tabElement = e.target.closest('.tab');
        const tabId = parseInt(tabElement.getAttribute('data-tab-id'));
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        tabElement.classList.add('active');
        activeTab = tabId;
        isInMenu = (tabs[activeTab].currentPage === 'menu');
        updateContent();
    }
});

// Close help modal when clicking outside or pressing Escape
document.addEventListener('click', function(e) {
    const helpModal = document.getElementById('help-modal');
    if (e.target === helpModal) {
        helpModal.classList.remove('active');
    }
});

// Check tab limit on window resize
window.addEventListener('resize', checkTabLimit);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkTabLimit();
    addDownloadStyles(); // Add download feedback styles
});