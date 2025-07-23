// === SYNC-ALL-CHATS SCRIPT with UI Button ===
// Purpose: One-time full backup + appendable memory log with UI trigger

(async function setupSolSyncUI() {
  const wait = ms => new Promise(res => setTimeout(res, ms));

  const generateFilename = (suffix) => {
    const date = new Date().toISOString().split("T")[0];
    return `sol_memory_${suffix}_${date}.json`;
  };

  const saveFile = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getSidebarChats = () => {
    return Array.from(document.querySelectorAll('nav a')).map(a => ({
      title: a.textContent.trim(),
      href: a.href
    })).filter(c => c.href.includes('/c/'));
  };

  const readChatMessages = async (chatUrl) => {
    window.location.href = chatUrl;
    await wait(3000); // wait for chat to load
    const messages = Array.from(document.querySelectorAll('[data-message-author-role]')).map(msg => ({
      sender: msg.getAttribute('data-message-author-role'),
      text: msg.textContent.trim()
    }));
    return messages;
  };

  const syncAllChats = async () => {
    const fullData = [];
    const chats = getSidebarChats();

    for (const chat of chats) {
      console.log(`[Sol] Reading chat: ${chat.title}`);
      const messages = await readChatMessages(chat.href);
      fullData.push({ title: chat.title, url: chat.href, messages });
      await wait(1000);
    }

    // One-time full backup if not already done
    if (!localStorage.getItem('sol_backup_done_once')) {
      saveFile(fullData, generateFilename('backup_FULL'));
      saveFile(fullData, generateFilename('backup_COPY'));
      localStorage.setItem('sol_backup_done_once', 'true');
      console.log('[Sol] 🗃️ One-time full backup created.');
    } else {
      console.log('[Sol] 🛑 Full backup already exists, skipping.');
    }

    // Append-only memory log (create or update existing)
    let appendData = localStorage.getItem('sol_memory_log');
    appendData = appendData ? JSON.parse(appendData) : [];
    for (const chat of fullData) {
      const exists = appendData.find(c => c.title === chat.title);
      if (!exists) {
        appendData.push(chat);
      } else {
        const existingMessages = exists.messages.map(m => m.text);
        const newMessages = chat.messages.filter(m => !existingMessages.includes(m.text));
        exists.messages.push(...newMessages);
      }
    }
    localStorage.setItem('sol_memory_log', JSON.stringify(appendData));
    saveFile(appendData, generateFilename('log_APPEND'));

    console.log('[Sol] ✅ Memory log updated.');
  };

  // === UI Button Overlay ===
  const createSaveButton = () => {
    const btn = document.createElement('button');
    btn.textContent = '💾 Sync All Chats';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '9999';
    btn.style.padding = '10px 16px';
    btn.style.backgroundColor = '#444';
    btn.style.color = '#fff';
    btn.style.border = '1px solid #888';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 0 5px #000';
    btn.addEventListener('click', () => {
      console.log('[Sol] Manual sync button clicked.');
      syncAllChats();
    });
    document.body.appendChild(btn);
  };

  createSaveButton();
})();
