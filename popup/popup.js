/**
 * Saksham Path - Popup Controller Script
 * Handles popup actions and communicates with active tab content script
 */
document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById('btn-open-panel');
  const btnReset = document.getElementById('btn-reset-page');
  const statusBadge = document.getElementById('status-badge');

  // Check tab status
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;
    const activeTab = tabs[0];

    if (activeTab.url && (activeTab.url.startsWith('http://') || activeTab.url.startsWith('https://'))) {
      chrome.tabs.sendMessage(activeTab.id, { action: 'PING' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          if (statusBadge) {
            statusBadge.textContent = 'Ready (Reload page)';
            statusBadge.style.background = '#fef3c7';
            statusBadge.style.color = '#92400e';
          }
        }
      });
    } else {
      if (statusBadge) {
        statusBadge.textContent = 'Disabled on browser pages';
        statusBadge.style.background = '#f1f5f9';
        statusBadge.style.color = '#64748b';
      }
      if (btnOpen) {
        btnOpen.disabled = true;
        btnOpen.style.opacity = '0.6';
        btnOpen.style.cursor = 'not-allowed';
      }
      if (btnReset) {
        btnReset.disabled = true;
        btnReset.style.opacity = '0.6';
        btnReset.style.cursor = 'not-allowed';
      }
    }
  });

  // Handle open button
  if (btnOpen) {
    btnOpen.addEventListener('click', async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_PANEL' }, () => {
            window.close();
          });
        }
      });
    });
  }

  // Handle reset button
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'RESET_SETTINGS' }, () => {
            window.close();
          });
        }
      });
    });
  }
});
