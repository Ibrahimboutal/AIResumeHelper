let isSelectionMode = false;
let hoveredElement: HTMLElement | null = null;
let overlayDiv: HTMLDivElement | null = null;

function detectJobPostingElements(): string {
  const selectors = [
    'article',
    '[class*="job-description"]',
    '[class*="job-details"]',
    '[id*="job-description"]',
    '[id*="job-details"]',
    '[class*="posting"]',
    'main',
    '[role="main"]'
  ];

  let bestContent = '';
  let maxLength = 0;

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      const text = element.textContent?.trim() || '';
      if (text.length > maxLength && text.length < 50000) {
        bestContent = text;
        maxLength = text.length;
      }
    });
  }

  if (!bestContent || bestContent.length < 100) {
    bestContent = document.body.innerText;
  }

  const maxLength10k = 10000;
  return bestContent.slice(0, maxLength10k);
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'smart-resume-overlay';
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    border: 3px solid #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
    transition: all 0.15s ease;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function createNotification(): HTMLDivElement {
  const notification = document.createElement('div');
  notification.id = 'smart-resume-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000000;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  notification.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
    </svg>
    <span>Hover over an element and click to select the job posting</span>
    <button id="cancel-selection" style="
      margin-left: 8px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    ">Cancel</button>
  `;
  document.body.appendChild(notification);

  const cancelButton = notification.querySelector('#cancel-selection');
  if (cancelButton) {
    cancelButton.addEventListener('click', (e) => {
      e.stopPropagation();
      exitSelectionMode();
      chrome.runtime.sendMessage({
        action: 'selectionCancelled'
      });
    });
  }

  return notification;
}

function updateOverlayPosition(element: HTMLElement) {
  if (!overlayDiv) return;

  const rect = element.getBoundingClientRect();
  overlayDiv.style.top = `${rect.top + window.scrollY}px`;
  overlayDiv.style.left = `${rect.left + window.scrollX}px`;
  overlayDiv.style.width = `${rect.width}px`;
  overlayDiv.style.height = `${rect.height}px`;
}

function handleMouseMove(e: MouseEvent) {
  if (!isSelectionMode) return;

  const target = e.target as HTMLElement;
  if (!target || target.id === 'smart-resume-overlay' || target.id === 'smart-resume-notification') return;

  if (hoveredElement !== target) {
    hoveredElement = target;
    updateOverlayPosition(target);
  }
}

function handleClick(e: MouseEvent) {
  if (!isSelectionMode || !hoveredElement) return;

  e.preventDefault();
  e.stopPropagation();

  const selectedText = hoveredElement.textContent?.trim() || '';
  const maxLength = 10000;
  const extractedText = selectedText.slice(0, maxLength);

  chrome.runtime.sendMessage({
    action: 'manualSelectionComplete',
    text: extractedText
  });

  exitSelectionMode();
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isSelectionMode) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    exitSelectionMode();
    chrome.runtime.sendMessage({
      action: 'selectionCancelled'
    });
  }
}

function enterSelectionMode() {
  if (isSelectionMode) return;

  isSelectionMode = true;
  document.body.style.cursor = 'crosshair';

  overlayDiv = createOverlay();
  createNotification();

  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
}

function exitSelectionMode() {
  if (!isSelectionMode) return;

  isSelectionMode = false;
  document.body.style.cursor = '';
  hoveredElement = null;

  if (overlayDiv) {
    overlayDiv.remove();
    overlayDiv = null;
  }

  const notification = document.getElementById('smart-resume-notification');
  if (notification) {
    notification.remove();
  }

  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageText') {
    const pageText = detectJobPostingElements();
    sendResponse({ text: pageText });
  } else if (request.action === 'startManualSelection') {
    enterSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'cancelManualSelection') {
    exitSelectionMode();
    sendResponse({ success: true });
  }
  return true;
});

console.log('Smart Resume Assistant content script loaded');
