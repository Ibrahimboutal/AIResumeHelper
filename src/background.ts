chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Resume Assistant installed');
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
  } else if (request.action === 'startManualSelection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startManualSelection' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  } else if (request.action === 'manualSelectionComplete') {
    chrome.runtime.sendMessage({
      action: 'manualSelectionComplete',
      text: request.text
    });
  } else if (request.action === 'selectionCancelled') {
    chrome.runtime.sendMessage({
      action: 'selectionCancelled'
    });
  }
});

function extractPageText() {
  const bodyText = document.body.innerText;
  const maxLength = 10000;
  return bodyText.slice(0, maxLength);
}
