// === SYNC-ALL-CHATS SCRIPT ===
// Purpose: Full backup, duplicate, and appendable memory log

(async function syncAllChats() {
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

  const fullData = [];
  const chats = getSidebarChats();

  for (const chat of chats) {
    console.log(`[Sol] Reading chat: ${chat.title}`);
    const messages = await readChatMessages(chat.href);
    fullData.push({ title: chat.title, url: chat.href, messages });
    await wait(1000);
  }

  // Save full backup (1 time)
  saveFile(fullData, generateFilename('backup_FULL'));
  saveFile(fullData, generateFilename('backup_COPY'));

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

  console.log('[Sol] ✅ Memory logs saved.');
})();
