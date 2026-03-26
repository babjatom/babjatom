package main

const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>X Hashtag Feed — #Iran #Trump #Saudi</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#000;--surface:#16181c;--border:#2f3336;
    --text:#e7e9ea;--text-secondary:#71767b;
    --accent:#1d9bf0;--accent-hover:#1a8cd8;
    --red:#f91880;--green:#00ba7c;--blue:#1d9bf0;
    --retweet:#00ba7c;
  }
  html{font-size:15px}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg);color:var(--text);
    min-height:100vh;display:flex;flex-direction:column;align-items:center;
  }

  header{
    position:sticky;top:0;z-index:100;
    width:100%;max-width:620px;
    background:rgba(0,0,0,.85);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border);
    padding:12px 16px 0;
  }
  .header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .logo{font-size:1.4rem;font-weight:800;color:var(--text)}
  .logo span{color:var(--accent)}
  .status-bar{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--text-secondary)}
  .status-dot{width:8px;height:8px;border-radius:50%;background:#00ba7c;flex-shrink:0}
  .status-dot.loading{background:#ffd700;animation:pulse 1s infinite}
  .status-dot.error{background:#f4212e}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  .tabs{display:flex;gap:0}
  .tab{
    flex:1;padding:12px 0;
    text-align:center;font-weight:700;font-size:.95rem;
    color:var(--text-secondary);cursor:pointer;
    border:none;background:none;
    border-bottom:3px solid transparent;
    transition:all .2s;
  }
  .tab:hover{background:rgba(231,233,234,.05)}
  .tab.active{color:var(--text);border-bottom-color:var(--accent)}

  main{width:100%;max-width:620px;flex:1}

  .tweet{
    padding:16px;border-bottom:1px solid var(--border);
    transition:background .15s;cursor:pointer;
  }
  .tweet:hover{background:rgba(231,233,234,.03)}
  .tweet-header{display:flex;align-items:flex-start;gap:12px}
  .avatar{
    width:44px;height:44px;border-radius:50%;
    background:var(--accent);flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:1.1rem;color:#fff;
    overflow:hidden;
  }
  .avatar img{width:100%;height:100%;object-fit:cover}
  .tweet-author{display:flex;flex-direction:column;min-width:0;flex:1}
  .author-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
  .author-name{font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .author-handle{color:var(--text-secondary);font-size:.9rem;white-space:nowrap}
  .tweet-time{color:var(--text-secondary);font-size:.9rem;white-space:nowrap}
  .dot-sep{color:var(--text-secondary);font-size:.9rem}

  .tweet-body{margin:8px 0 12px 56px;line-height:1.45;word-wrap:break-word}
  .tweet-body a{color:var(--accent);text-decoration:none}
  .tweet-body a:hover{text-decoration:underline}
  .hashtag{color:var(--accent);font-weight:600}

  .tweet-actions{display:flex;margin-left:56px;gap:0;justify-content:space-between;max-width:400px}
  .action{
    display:flex;align-items:center;gap:6px;
    padding:4px 8px;border-radius:999px;
    font-size:.85rem;color:var(--text-secondary);
    transition:all .15s;cursor:pointer;
    border:none;background:none;
  }
  .action:hover{background:rgba(29,155,240,.1)}
  .action.reply:hover{color:var(--blue)}
  .action.retweet:hover{color:var(--retweet)}
  .action.like:hover{color:var(--red)}
  .action svg{width:18px;height:18px;fill:currentColor}

  .loading-container{
    display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:60px 20px;gap:16px;
  }
  .spinner{
    width:32px;height:32px;border:3px solid var(--border);
    border-top-color:var(--accent);border-radius:50%;
    animation:spin .8s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-text{color:var(--text-secondary);font-size:.9rem}

  .mock-banner{
    background:rgba(29,155,240,.1);border:1px solid rgba(29,155,240,.3);
    border-radius:12px;margin:16px;padding:12px 16px;
    font-size:.85rem;color:var(--accent);text-align:center;
    line-height:1.4;
  }
  .mock-banner strong{display:block;margin-bottom:4px}

  .refresh-bar{
    display:flex;align-items:center;justify-content:center;
    padding:10px;border-bottom:1px solid var(--border);
    font-size:.85rem;color:var(--text-secondary);gap:8px;
  }
  .countdown{font-variant-numeric:tabular-nums;color:var(--accent);font-weight:600}

  @media(max-width:640px){
    header,main{max-width:100%}
    .tweet{padding:12px}
    .tweet-body{margin-left:0;margin-top:12px}
    .tweet-actions{margin-left:0}
  }
</style>
</head>
<body>

<header>
  <div class="header-top">
    <div class="logo"><span>X</span> Hashtag Feed</div>
    <div class="status-bar">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">Connecting...</span>
    </div>
  </div>
  <div class="tabs" id="tabs">
    <button class="tab active" data-tag="iran">#Iran</button>
    <button class="tab" data-tag="trump">#Trump</button>
    <button class="tab" data-tag="saudi">#Saudi</button>
  </div>
</header>

<main id="feed">
  <div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading tweets...</div></div>
</main>

<script>
(function(){
  const REFRESH_INTERVAL = 30;
  let currentTag = 'iran';
  let countdown = REFRESH_INTERVAL;
  let timer = null;
  let isMock = false;

  const $feed = document.getElementById('feed');
  const $tabs = document.getElementById('tabs');
  const $statusDot = document.getElementById('statusDot');
  const $statusText = document.getElementById('statusText');

  function setStatus(type, text) {
    $statusDot.className = 'status-dot' + (type === 'ok' ? '' : ' ' + type);
    $statusText.textContent = text;
  }

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return Math.floor(diff) + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    return Math.floor(diff / 86400) + 'd';
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  function linkify(text) {
    text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    text = text.replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" rel="noopener">@$1</a>');
    return text;
  }

  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function renderTweet(t) {
    const avatar = t.profile_image_url
      ? '<img src="' + t.profile_image_url + '" alt="" loading="lazy">'
      : getInitial(t.author_name);
    return '<div class="tweet" onclick="window.open(\'' + t.tweet_url + '\',\'_blank\')">' +
      '<div class="tweet-header">' +
        '<div class="avatar">' + avatar + '</div>' +
        '<div class="tweet-author">' +
          '<div class="author-row">' +
            '<span class="author-name">' + (t.author_name || 'Unknown') + '</span>' +
            '<span class="author-handle">@' + (t.author_username || 'unknown') + '</span>' +
            '<span class="dot-sep">&middot;</span>' +
            '<span class="tweet-time">' + timeAgo(t.created_at) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tweet-body">' + linkify(t.text) + '</div>' +
      '<div class="tweet-actions">' +
        '<button class="action reply" onclick="event.stopPropagation()">' +
          '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.82l-5.72 5.77a.749.749 0 01-1.275-.533V17.2H9.756c-4.421 0-8.005-3.58-8.005-8v-.8l.001-.4zm8.005-6.5A6.505 6.505 0 003.251 10v.8a6.505 6.505 0 006.505 6.5h3.994a.75.75 0 01.75.75v2.8l4.19-4.23A6.127 6.127 0 0020.751 10.13 6.629 6.629 0 0014.122 3.5H9.756z"/></svg>' +
          formatNumber(t.reply_count) +
        '</button>' +
        '<button class="action retweet" onclick="event.stopPropagation()">' +
          '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>' +
          formatNumber(t.retweet_count) +
        '</button>' +
        '<button class="action like" onclick="event.stopPropagation()">' +
          '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>' +
          formatNumber(t.like_count) +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function renderFeed(data) {
    isMock = data.is_mock;
    let html = '';

    if (data.is_mock) {
      html += '<div class="mock-banner"><strong>Demo Mode</strong>Set the TWITTER_BEARER_TOKEN environment variable for live tweets from X. Showing sample data.</div>';
    }

    html += '<div class="refresh-bar">Auto-refresh in <span class="countdown" id="countdown">' + REFRESH_INTERVAL + '</span>s</div>';

    if (!data.tweets || data.tweets.length === 0) {
      html += '<div class="loading-container"><div class="loading-text">No tweets found for #' + data.hashtag + '</div></div>';
    } else {
      data.tweets.forEach(function(t) { html += renderTweet(t); });
    }

    $feed.innerHTML = html;
  }

  function fetchFeed() {
    setStatus('loading', 'Fetching #' + currentTag + '...');
    fetch('/api/tweets?hashtag=' + currentTag)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        renderFeed(data);
        setStatus('ok', (data.is_mock ? 'Demo' : 'Live') + ' \u00b7 #' + data.hashtag + ' \u00b7 ' + (data.tweets ? data.tweets.length : 0) + ' tweets');
        countdown = REFRESH_INTERVAL;
      })
      .catch(function(err) {
        setStatus('error', 'Error: ' + err.message);
      });
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(function() {
      countdown--;
      var el = document.getElementById('countdown');
      if (el) el.textContent = countdown;
      if (countdown <= 0) {
        fetchFeed();
      }
    }, 1000);
  }

  $tabs.addEventListener('click', function(e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    currentTag = btn.dataset.tag;
    $feed.innerHTML = '<div class="loading-container"><div class="spinner"></div><div class="loading-text">Loading #' + currentTag + '...</div></div>';
    countdown = REFRESH_INTERVAL;
    fetchFeed();
  });

  fetchFeed();
  startTimer();
})();
</script>
</body>
</html>`
