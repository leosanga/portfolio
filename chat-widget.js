(function () {
  'use strict';

  var COLD_START_NOTICE_DELAY_MS = 4000;
  var REQUEST_TIMEOUT_MS = 65000;

  function initChatWidget(root) {
    var webhookUrl = root.dataset.webhookUrl;
    var log = root.querySelector('.chat-log');
    var form = root.querySelector('.chat-form');
    var input = root.querySelector('.chat-input');
    var submitButton = form.querySelector('button[type="submit"]');

    function appendMessage(role, text) {
      var entry = document.createElement('p');
      entry.className = 'chat-message chat-message-' + role;
      entry.textContent = (role === 'user' ? 'You: ' : 'Assistant: ') + text;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
      return entry;
    }

    function handleSubmit(event) {
      event.preventDefault();
      var question = input.value.trim();
      if (!question) return;

      input.value = '';
      input.disabled = true;
      submitButton.disabled = true;

      appendMessage('user', question);
      var assistantEntry = appendMessage('assistant', 'Thinking…');

      var wakingTimer = setTimeout(function () {
        assistantEntry.textContent = 'Assistant: Still working — the demo server may be waking up from idle (can take up to ~50s on the first question).';
      }, COLD_START_NOTICE_DELAY_MS);

      var controller = new AbortController();
      var timeoutTimer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: question }),
        signal: controller.signal
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          assistantEntry.textContent = 'Assistant: ' + (data.answer || "Sorry, I couldn't generate a response right now.");
        })
        .catch(function () {
          assistantEntry.textContent = "Assistant: Couldn't reach the assistant right now — please try again in a moment.";
        })
        .finally(function () {
          clearTimeout(wakingTimer);
          clearTimeout(timeoutTimer);
          input.disabled = false;
          submitButton.disabled = false;
          input.focus();
        });
    }

    form.addEventListener('submit', handleSubmit);
  }

  document.querySelectorAll('.chat-widget').forEach(initChatWidget);
})();
