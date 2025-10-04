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
