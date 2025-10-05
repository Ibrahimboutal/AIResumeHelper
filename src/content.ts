// TODO: Implement a more robust manual selection mode
// This is a placeholder to show the concept. A real implementation
// would involve highlighting elements on mouseover and sending the
// selected element's content to the popup.


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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageText') {
    const pageText = detectJobPostingElements();
    sendResponse({ text: pageText });
  }
  return true;
});

console.log('Smart Resume Assistant content script loaded');
