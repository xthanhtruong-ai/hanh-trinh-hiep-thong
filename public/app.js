const $ = selector => document.querySelector(selector);
const roomName = $('#playerName');
const roomCodeInput = $('#roomCode');
const saved = JSON.parse(sessionStorage.getItem('journey27') || 'null');
let session = saved;
let state = null;
let source = null;

const dieFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const currency = amount => Number(amount || 0).toLocaleString('vi-VN') + ' xu';

async function request(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thể hoàn tất yêu cầu.');
  return data;
}

function showError(message, target) {
  const element = $(target || '#lobbyError');
  element.textContent = message || '';
}

function enterRoom(data) {
  session = data;
  sessionStorage.setItem('journey27', JSON.stringify(session));
  $('#lobby').classList.add('hidden');
  $('#game').classList.remove('hidden');
  $('#roomCodeLabel').textContent = data.code;
  history.replaceState(null, '', '/?room=' + encodeURIComponent(data.code));
  connect();
}

function connect() {
  if (!session) return;
  if (source) source.close();
  source = new EventSource('/events?code=' + encodeURIComponent(session.code) + '&playerId=' + encodeURIComponent(session.playerId));
  source.onopen = () => {
    $('#connection').innerHTML = '<i></i> Đang kết nối';
    $('#connection').classList.add('online');
  };
  source.onmessage = event => {
    state = JSON.parse(event.data);
    render();
  };
  source.onerror = () => {
    $('#connection').innerHTML = '<i></i> Đang kết nối lại';
    $('#connection').classList.remove('online');
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderBoard() {
  const lanes = [
    { side: $('#side-bottom'), indexes: Array.from({ length: 13 }, (_, i) => 12 - i) },
    { side: $('#side-left'), indexes: Array.from({ length: 11 }, (_, i) => 13 + i) },
    { side: $('#side-top'), indexes: Array.from({ length: 11 }, (_, i) => 24 + i) },
    { side: $('#side-right'), indexes: Array.from({ length: 10 }, (_, i) => 35 + i) }
  ];
  for (const lane of lanes) {
    lane.side.replaceChildren();
    for (const index of lane.indexes) {
      const tile = state.board[index];
      if (!tile) continue;
      const element = document.createElement('div');
      const tileState = tile.kind === 'property' ? state.properties[tile.id] : state.assets[tile.id];
      element.className = 'tile tile-' + tile.kind + ' tile-' + lane.side.id.replace('side-', '');
      element.dataset.index = tile.index;
      if (tile.kind === 'property') element.style.setProperty('--tile-color', tile.color);
      const title = tile.kind === 'property' ? tile.name.replace(/^Tổng Giáo phận /, 'TGP ') : tile.name;
      const owner = tileState?.ownerId;
      const stateLine = tile.kind === 'property' ? '<small>' + currency(tile.price) + '</small>' : '';
      const level = tile.kind === 'property' && tileState?.level ? '<b class="house-count">' + (tileState.level === 5 ? 'H' : '⌂'.repeat(tileState.level)) + '</b>' : '';
      const ownerMarker = owner ? '<span class="owner-marker" style="--owner-color:' + playerColor(owner) + '"></span>' : '';
      const playersHere = state.players.filter(player => !player.bankrupt && player.position === tile.index).map(player => '<i class="token-dot" style="--player-color:' + player.color + '" title="' + escapeHtml(player.name) + '">' + escapeHtml(player.name.slice(0, 1).toUpperCase()) + '</i>').join('');
      element.innerHTML = '<span class="tile-icon">' + (tile.icon || '•') + '</span><span class="tile-name">' + escapeHtml(title) + '</span>' + stateLine + level + ownerMarker + '<span class="tokens">' + playersHere + '</span>';
      if (state.pendingTile === tile.index) element.classList.add('is-current');
      lane.side.append(element);
    }
  }
}

function playerColor(id) {
  return state.players.find(player => player.id === id)?.color || '#fff';
}

function button(label, actionName, className) {
  return '<button class="' + (className || 'secondary') + '" data-action="' + actionName + '">' + label + '</button>';
}

function mortgageButtons(player) {
  const owned = Object.entries(state.properties).filter(([, item]) => item.ownerId === player.id);
  return owned.map(([id, item]) => {
    const details = state.board.find(tile => tile.id === id);
    if (!details) return '';
    if (item.mortgaged) return button('Chuộc ' + escapeHtml(details.name), 'unmortgage:' + id);
    return button('Thế chấp ' + escapeHtml(details.name), 'mortgage:' + id);
  }).join('');
}

function managementButtons(player) {
  const owned = Object.entries(state.properties).filter(([, item]) => item.ownerId === player.id);
  if (!owned.length) return '';
  return '<div class="asset-actions"><span>TÀI SẢN CỦA BẠN</span>' + owned.map(([id, item]) => {
    const details = state.board.find(tile => tile.id === id);
    if (!details) return '';
    const group = state.board.filter(tile => tile.kind === 'property' && tile.groupId === details.groupId);
    const ownsGroup = group.every(tile => state.properties[tile.id].ownerId === player.id && !state.properties[tile.id].mortgaged);
    const controls = [];
    if (ownsGroup && item.level < 5) controls.push(button('＋ Xây (' + currency(details.houseCost) + ')', 'build:' + id));
    if (ownsGroup && item.level > 0) controls.push(button('－ Bán nhà', 'sellHouse:' + id));
    if (item.mortgaged) controls.push(button('Chuộc (' + currency(Math.ceil(details.price * 0.55)) + ')', 'unmortgage:' + id));
    else if (!group.some(tile => state.properties[tile.id].level > 0)) controls.push(button('Thế chấp', 'mortgage:' + id));
    return '<div class="asset-row"><span><b style="--tile-color:' + details.color + '"></b>' + escapeHtml(details.name) + '<small>' + (item.level ? ' · ' + (item.level === 5 ? 'Khách sạn' : item.level + ' nhà') : '') + (item.mortgaged ? ' · Đang thế chấp' : '') + '</small></span><div>' + controls.join('') + '</div></div>';
  }).join('') + '</div>';
}

function actionMarkup() {
  const me = state.players.find(player => player.id === session.playerId);
  const active = state.players.find(player => player.id === state.currentPlayerId);
  if (!state.started) return '<p>Đợi chủ phòng bắt đầu ván chơi.</p>';
  if (state.phase === 'finished') return '<p class="winner">🏆 ' + escapeHtml(state.players.find(player => player.id === state.winnerId)?.name || 'Người chơi') + ' chiến thắng!</p>';
  if (state.phase === 'auction') {
    const auction = state.auction;
    if (auction.currentBidderId !== session.playerId) return '<p>Đang chờ người chơi trả giá…</p>';
    const tile = state.board[auction.tileIndex];
    return '<p>Đấu giá: <strong>' + escapeHtml(tile.name) + '</strong><br>Giá hiện tại: ' + currency(auction.bid) + '</p><div class="bid-row"><input id="bidAmount" type="number" min="' + (auction.bid + 10) + '" step="10" value="' + (auction.bid + 10) + '"><button class="primary" data-action="bid">Trả giá</button></div>' + button('Bỏ lượt', 'passBid');
  }
  if (state.phase === 'debt') {
    const debt = state.debt;
    if (debt.debtorId !== session.playerId) return '<p>Đang chờ người chơi thanh toán nợ…</p>';
    const canPay = me.cash >= debt.amount;
    return '<p class="debt">Bạn cần thanh toán ' + currency(debt.amount) + ' (' + escapeHtml(debt.reason) + ').</p>' + (canPay ? button('Thanh toán', 'payDebt', 'primary') : '<p>Hãy thế chấp tài sản hoặc tuyên bố phá sản.</p>') + mortgageButtons(me) + button('Tuyên bố phá sản', 'bankrupt', 'danger');
  }
  if (active?.id !== session.playerId) return '<p>Đến lượt <strong>' + escapeHtml(active?.name || '') + '</strong>.</p>';
  if (state.phase === 'roll') {
    let markup = button(me.jailed ? 'Gieo xúc xắc để thử ra' : '🎲 Gieo xúc xắc', 'roll', 'primary');
    if (me.jailed) markup += button('Trả 50 để rời nhà tạm giữ', 'payJail');
    return markup;
  }
  if (state.phase === 'buy') {
    const tile = state.board[state.pendingTile];
    const price = tile.kind === 'property' ? tile.price : tile.kind === 'railroad' ? 200 : 150;
    return '<p>Ô <strong>' + escapeHtml(tile.name) + '</strong> chưa có chủ. Giá ' + currency(price) + '.</p>' + button('Mua ô này', 'buy', 'primary') + button('Đưa ra đấu giá', 'decline');
  }
  let result = '<p>' + (state.extraTurn ? 'Bạn gieo đôi và được thêm lượt.' : 'Hoàn tất thao tác rồi kết thúc lượt.') + '</p>';
  if (state.dice) result += '<p class="dice-result">Lượt trước: ' + state.dice[0] + ' + ' + state.dice[1] + '</p>';
  result += managementButtons(me) + button(state.extraTurn ? 'Gieo lượt tiếp theo' : 'Kết thúc lượt', 'endTurn', 'primary');
  return result;
}

function render() {
  if (!state) return;
  $('#roomCodeLabel').textContent = state.code;
  $('#playerCount').textContent = state.players.filter(player => !player.bankrupt).length + '/8';
  $('#startGame').classList.toggle('hidden', state.started || state.hostId !== session.playerId);
  $('#startGame').disabled = state.players.length < 2;
  $('#players').innerHTML = state.players.map(player => {
    const active = player.id === state.currentPlayerId && state.started && state.phase !== 'finished';
    return '<div class="player-row ' + (active ? 'active' : '') + (player.bankrupt ? ' bankrupt' : '') + '"><span class="avatar" style="--player-color:' + player.color + '">' + escapeHtml(player.name.slice(0, 1).toUpperCase()) + '</span><span class="player-name">' + escapeHtml(player.name) + (player.id === state.hostId ? '<small>Chủ phòng</small>' : '') + '</span><b>' + currency(player.cash) + '</b></div>';
  }).join('');
  $('#eventLog').innerHTML = state.log.map(item => '<div class="event-item">' + escapeHtml(item.text) + '</div>').join('');
  $('#turnStatus').textContent = state.started ? state.phase === 'finished' ? 'Ván chơi đã kết thúc' : 'Đang chơi: ' + (state.players.find(player => player.id === state.currentPlayerId)?.name || '') : 'Đang chờ người chơi…';
  if (state.dice) {
    $('#dieOne').textContent = dieFaces[state.dice[0] - 1];
    $('#dieTwo').textContent = dieFaces[state.dice[1] - 1];
  }
  $('#actionPanel').innerHTML = actionMarkup();
  renderBoard();
}

async function sendAction(actionName, extra) {
  if (!session) return;
  try {
    showError('', '#gameError');
    await request('/api/action', { code: session.code, playerId: session.playerId, action: actionName, ...(extra || {}) });
  } catch (error) { showError(error.message, '#gameError'); }
}

$('#createRoom').addEventListener('click', async () => {
  try {
    showError('');
    const result = await request('/api/create', { name: roomName.value });
    enterRoom(result);
  } catch (error) { showError(error.message); }
});

$('#joinRoom').addEventListener('click', async () => {
  try {
    showError('');
    const result = await request('/api/join', { name: roomName.value, code: roomCodeInput.value });
    enterRoom(result);
  } catch (error) { showError(error.message); }
});

$('#startGame').addEventListener('click', async () => {
  try {
    showError('', '#gameError');
    await request('/api/start', { code: session.code, playerId: session.playerId });
  } catch (error) { showError(error.message, '#gameError'); }
});

$('#actionPanel').addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const spec = target.dataset.action;
  if (spec === 'bid') return sendAction('bid', { amount: $('#bidAmount').value });
  const separator = spec.indexOf(':');
  if (separator >= 0) return sendAction(spec.slice(0, separator), { propertyId: spec.slice(separator + 1) });
  sendAction(spec);
});

$('#copyRoom').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.origin + '/?room=' + state.code);
    $('#copyRoom').textContent = '✓';
    setTimeout(() => $('#copyRoom').textContent = '⧉', 1200);
  } catch { showError('Không thể sao chép liên kết.', '#gameError'); }
});

const invitedRoom = new URLSearchParams(location.search).get('room');
if (invitedRoom) roomCodeInput.value = invitedRoom.toUpperCase();
if (session) enterRoom(session);
