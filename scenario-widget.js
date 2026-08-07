(function () {
  'use strict';

  var COLD_START_NOTICE_DELAY_MS = 4000;
  var REQUEST_TIMEOUT_MS = 65000;

  function initScenarioWidget(root) {
    var apiUrl = root.dataset.apiUrl;
    var log = root.querySelector('.chat-log');
    var buttons = root.querySelectorAll('.scenario-button');

    function appendMessage(role, text) {
      var entry = document.createElement('p');
      entry.className = 'chat-message chat-message-' + role;
      entry.textContent = (role === 'user' ? 'You: ' : 'Assistant: ') + text;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
      return entry;
    }

    function setButtonsDisabled(disabled) {
      buttons.forEach(function (button) { button.disabled = disabled; });
    }

    function handleClick(event) {
      var button = event.currentTarget;
      var scenarioId = button.dataset.scenarioId;
      var label = button.textContent;

      setButtonsDisabled(true);
      appendMessage('user', label);
      var assistantEntry = appendMessage('assistant', 'Thinking…');

      var wakingTimer = setTimeout(function () {
        assistantEntry.textContent = 'Assistant: Still working — the demo server may be waking up from idle (can take up to ~50s on the first question).';
      }, COLD_START_NOTICE_DELAY_MS);

      var controller = new AbortController();
      var timeoutTimer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
        signal: controller.signal
      })
        .then(function (response) {
          if (!response.ok) {
            console.warn('Scenario widget: API returned', response.status);
            throw new Error('Non-OK response: ' + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          assistantEntry.textContent = 'Assistant: ' + (data.answer || "Sorry, I couldn't generate a response right now.");
        })
        .catch(function () {
          assistantEntry.textContent = "Assistant: Couldn't reach the agent right now — please try again in a moment.";
        })
        .finally(function () {
          clearTimeout(wakingTimer);
          clearTimeout(timeoutTimer);
          setButtonsDisabled(false);
        });
    }

    buttons.forEach(function (button) { button.addEventListener('click', handleClick); });
  }

  function init() {
    document.querySelectorAll('.scenario-widget').forEach(initScenarioWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
