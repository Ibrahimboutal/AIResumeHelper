chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Resume Assistant installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobPosting') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: extractPageText,
          },
          (results) => {
            if (results && results[0]) {
              sendResponse({ success: true, text: results[0].result });
            } else {
              sendResponse({ success: false, error: 'Could not extract text' });
            }
          }
        );
      }
    });
    return true;
  }
});

function extractPageText() {
  const bodyText = document.body.innerText;
  const maxLength = 10000;
  return bodyText.slice(0, maxLength);
}
