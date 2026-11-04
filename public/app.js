const $ = selector => document.querySelector(selector);
const roomName = $('#playerName');
const roomCodeInput = $('#roomCode');
const saved = JSON.parse(sessionStorage.getItem('journey27') || 'null');
let session = saved;
let state = null;
let source = null;
let activeAnimations = 0;
let focusedPlayerId = null;
let rollInProgress = false;
let playersExpanded = true;
let eventsExpanded = false;
let lastChatMessageId = null;
let lastDisplayedRollSequence = null;
const displayedPositions = new Map();
const movementRuns = new Map();
const movingPlayers = new Set();
let activeHelpTile = null;
let helpCloseTimer = null;

setInterval(() => {
  if (session) fetch('/health', { cache: 'no-store' }).catch(() => {});
}, 5 * 60 * 1000);

const tileIcons = {
  property: 'church', start: 'cross-sun', chest: 'charity', chance: 'event-card',
  tax: 'mission-coin', railroad: 'pilgrim-route', utility: 'mission-center',
  jail: 'sanctuary', goJail: 'retreat', free: 'community'
};
const currency = amount => Number(amount || 0).toLocaleString('vi-VN') + ' điểm sứ vụ';
const dioceseTitle = name => name.startsWith('Tổng Giáo phận ') ? name : 'Giáo phận ' + name;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function assetIcon(name, className) {
  return '<svg class="' + (className || 'asset-icon') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="/assets/game-icons.svg#' + name + '"></use></svg>';
}

function setDieFace(element, value) {
  const face = Math.max(1, Math.min(6, Number(value) || 1));
  element.dataset.value = String(face);
  element.setAttribute('aria-label', 'Mặt xúc xắc ' + face);
  element.querySelector('img').src = '/assets/dice/faces/face-' + face + '.webp';
}

function setDieRollingFrame(element, frame) {
  const index = ((Number(frame) - 1) % 9 + 9) % 9 + 1;
  element.querySelector('img').src = '/assets/dice/rolling/frame-' + String(index).padStart(2, '0') + '.webp';
}

function showDiceTotal(total) {
  const popup = $('#diceTotal');
  popup.textContent = '+ ' + total;
  popup.classList.remove('is-visible');
  void popup.offsetWidth;
  popup.classList.add('is-visible');
}

function tileHelpText(tile) {
  switch (tile.kind) {
    case 'start': return 'Khi đi qua Khởi đầu sứ vụ, Quỹ Hiệp Thông trao bạn 200 điểm sứ vụ. Một số thẻ cũng đưa bạn đến đây và trao khoản này.';
    case 'chance': return 'Rút một thẻ Biến cố sứ vụ. Thẻ có thể trao hoặc lấy điểm sứ vụ, di chuyển quân cờ hay đưa bạn vào kỳ tĩnh tâm.';
    case 'chest': return 'Rút một thẻ Quỹ bác ái. Thẻ có thể hỗ trợ, yêu cầu đóng góp, di chuyển quân cờ hoặc mời bạn vào kỳ tĩnh tâm.';
    case 'tax': return 'Khi dừng tại đây, đóng ' + currency(tile.amount) + ' vào Quỹ Hiệp Thông qua ' + tile.name + '.';
    case 'railroad': return 'Nếu chưa có ân nhân, bạn có thể đóng góp 200 điểm sứ vụ để đồng hành cùng tuyến. Nếu đã có ân nhân, mức đóng góp bắt đầu từ 25 điểm và tăng gấp đôi theo số tuyến cùng loại người đó đang đồng hành.';
    case 'utility': return 'Nếu chưa có ân nhân, bạn có thể đóng góp 150 điểm sứ vụ để đồng hành cùng trung tâm. Nếu đã có ân nhân, mức đóng góp bằng tổng xúc xắc ×4; nếu người đó đồng hành cùng cả hai trung tâm mục vụ thì ×10.';
    case 'jail': return 'Ô ghé thăm bình thường, không bị phạt. Bạn chỉ vào kỳ tĩnh tâm khi bị ô Tĩnh tâm hoặc gieo đôi ba lần liên tiếp.';
    case 'goJail': return 'Chuyển đến Nhà tĩnh tâm và tạm ngưng di chuyển. Bạn có thể gieo được đôi hoặc đóng góp 50 điểm sứ vụ để kết thúc kỳ tĩnh tâm.';
    case 'free': return 'Ngày hội hiệp thông là điểm dừng chân tự do: không phải đóng hay nhận điểm sứ vụ.';
    default: return 'Ô chức năng này áp dụng hiệu ứng được ghi trong tên ô.';
  }
}

function positionTileTooltip(tileElement) {
  const tooltip = tileElement.querySelector('.tile-tooltip');
  if (!tooltip || !tileElement.isConnected || !tileElement.classList.contains('help-open')) return;
  const tileRect = tileElement.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.left = '0px';
  tooltip.style.top = '0px';
  tooltip.style.visibility = 'hidden';
  const tooltipRect = tooltip.getBoundingClientRect();
  const side = ['top', 'bottom', 'left', 'right'].find(name => tileElement.classList.contains('tile-' + name));
  const gap = 8;
  let left = tileRect.left + (tileRect.width - tooltipRect.width) / 2;
  let top = tileRect.top + (tileRect.height - tooltipRect.height) / 2;
  if (side === 'top') top = tileRect.top - tooltipRect.height - gap;
  if (side === 'bottom') top = tileRect.bottom + gap;
  if (side === 'left') left = tileRect.right + gap;
  if (side === 'right') left = tileRect.left - tooltipRect.width - gap;
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.visibility = '';
}

function openTileHelp(tileElement) {
  clearTimeout(helpCloseTimer);
  if (activeHelpTile && activeHelpTile !== tileElement) {
    activeHelpTile.classList.remove('help-open');
    activeHelpTile.querySelector('.tile-help')?.setAttribute('aria-expanded', 'false');
  }
  activeHelpTile = tileElement;
  tileElement.classList.add('help-open');
  tileElement.querySelector('.tile-help')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => positionTileTooltip(tileElement));
}

function scheduleCloseTileHelp(tileElement) {
  clearTimeout(helpCloseTimer);
  helpCloseTimer = setTimeout(() => {
    const helpButton = tileElement.querySelector('.tile-help');
    const tooltip = tileElement.querySelector('.tile-tooltip');
    if (helpButton?.matches(':hover, :focus-visible') || tooltip?.matches(':hover')) return;
    tileElement.classList.remove('help-open');
    tileElement.querySelector('.tile-help')?.setAttribute('aria-expanded', 'false');
    if (activeHelpTile === tileElement) activeHelpTile = null;
  }, 140);
}

window.addEventListener('resize', () => {
  if (activeHelpTile) positionTileTooltip(activeHelpTile);
});
window.addEventListener('scroll', () => {
  if (activeHelpTile) positionTileTooltip(activeHelpTile);
}, true);

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
    receiveState(JSON.parse(event.data));
  };
  source.onerror = () => {
    $('#connection').innerHTML = '<i></i> Đang kết nối lại';
    $('#connection').classList.remove('online');
  };
}

function receiveState(nextState) {
  const moves = [];
  if (state?.started && nextState.started) {
    for (const player of nextState.players) {
      const previous = state.players.find(item => item.id === player.id);
      if (!previous) continue;
      if (player.bankrupt) {
        movementRuns.set(player.id, (movementRuns.get(player.id) || 0) + 1);
        displayedPositions.delete(player.id);
        movingPlayers.delete(player.id);
        continue;
      }
      if (previous.position === player.position) continue;
      const from = displayedPositions.has(player.id) ? displayedPositions.get(player.id) : previous.position;
      const steps = (player.position - from + nextState.board.length) % nextState.board.length;
      if (steps > 0 && steps <= 12) {
        displayedPositions.set(player.id, from);
        movingPlayers.add(player.id);
        moves.push({ playerId: player.id, from, steps });
      } else {
        movementRuns.set(player.id, (movementRuns.get(player.id) || 0) + 1);
        displayedPositions.delete(player.id);
        movingPlayers.delete(player.id);
      }
    }
  }
  activeAnimations += moves.length;
  state = nextState;
  render();
  for (const move of moves) animatePlayerMove(move.playerId, move.from, move.steps);
}

async function animatePlayerMove(playerId, from, steps) {
  const run = (movementRuns.get(playerId) || 0) + 1;
  movementRuns.set(playerId, run);
  focusedPlayerId = playerId;
  try {
    for (let step = 1; step <= steps; step++) {
      await wait(135);
      if (movementRuns.get(playerId) !== run) return;
      displayedPositions.set(playerId, (from + step) % state.board.length);
      renderBoard();
    }
  } finally {
    if (movementRuns.get(playerId) === run) {
      displayedPositions.delete(playerId);
      movingPlayers.delete(playerId);
      if (focusedPlayerId === playerId) focusedPlayerId = null;
    }
    activeAnimations = Math.max(0, activeAnimations - 1);
    render();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderBoard() {
  clearTimeout(helpCloseTimer);
  activeHelpTile?.classList.remove('help-open');
  activeHelpTile = null;
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
      const benefactorId = tileState?.benefactorId;
      const stateLine = tile.kind === 'property' ? '<small>' + currency(tile.price) + '</small>' : '';
      const level = tile.kind === 'property' && tileState?.level ? '<b class="house-count" title="' + tileState.level + ' nhà thờ">' + tileState.level + assetIcon('church', 'house-icon') + '</b>' : '';
      const benefactor = benefactorId ? state.players.find(player => player.id === benefactorId) : null;
      const benefactorMarker = benefactor ? '<span class="benefactor-marker" style="--benefactor-color:' + playerColor(benefactorId) + '" title="Ân nhân: ' + escapeHtml(benefactor.name) + '"></span>' : '';
      const focusPlayer = state.players.find(player => player.id === focusedPlayerId);
      const focusPosition = focusPlayer ? displayedPositions.get(focusPlayer.id) ?? focusPlayer.position : -1;
      if (movingPlayers.has(focusedPlayerId) && focusPosition === tile.index) element.classList.add('is-focus');
      const playersHere = state.players.filter(player => !player.bankrupt && (displayedPositions.get(player.id) ?? player.position) === tile.index).map(player => '<i class="token-dot' + (movingPlayers.has(player.id) ? ' moving' : '') + (player.id === focusedPlayerId ? ' focused' : '') + '" style="--player-color:' + player.color + '" title="' + escapeHtml(player.name) + '">' + escapeHtml(player.name.slice(0, 1).toUpperCase()) + '</i>').join('');
      const help = tile.kind === 'property' ? '' : '<button class="tile-help" type="button" aria-label="Giải thích ô ' + escapeHtml(title) + '" aria-describedby="tile-help-' + tile.index + '">!</button><span class="tile-tooltip" id="tile-help-' + tile.index + '" role="tooltip">' + escapeHtml(tileHelpText(tile)) + '</span>';
      element.innerHTML = '<span class="tile-icon">' + assetIcon(tileIcons[tile.kind] || 'church') + '</span><span class="tile-content"><span class="tile-name">' + escapeHtml(title) + '</span>' + stateLine + level + '</span>' + help + benefactorMarker + '<span class="tokens">' + playersHere + '</span>';
      if (tile.kind !== 'property') {
        const helpButton = element.querySelector('.tile-help');
        const tooltip = element.querySelector('.tile-tooltip');
        helpButton.addEventListener('pointerenter', () => openTileHelp(element));
        helpButton.addEventListener('pointerleave', () => scheduleCloseTileHelp(element));
        helpButton.addEventListener('focus', () => openTileHelp(element));
        helpButton.addEventListener('blur', () => scheduleCloseTileHelp(element));
        tooltip.addEventListener('pointerenter', () => openTileHelp(element));
        tooltip.addEventListener('pointerleave', () => scheduleCloseTileHelp(element));
      }
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

function managementButtons(player) {
  const contributed = Object.entries(state.properties).filter(([, item]) => item.benefactorId === player.id);
  if (!contributed.length) return '';
  return '<div class="asset-actions"><span>ĐỒNG HÀNH CÙNG GIÁO PHẬN</span>' + contributed.map(([id, item]) => {
    const details = state.board.find(tile => tile.id === id);
    if (!details) return '';
    const group = state.board.filter(tile => tile.kind === 'property' && tile.groupId === details.groupId);
    const accompaniesGroup = group.every(tile => state.properties[tile.id].benefactorId === player.id);
    const controls = [];
    const levels = group.map(tile => state.properties[tile.id].level);
    if (accompaniesGroup && item.level > 1 && item.level === Math.max(...levels)) controls.push(button('－ Thu gọn 1 nhà thờ', 'reduceFacility:' + id));
    const hasOtherChurchesInGroup = group.some(tile => tile.id !== id && state.properties[tile.id].level > 1);
    if (item.level === 1 && !hasOtherChurchesInGroup) controls.push(button('Rút lại đóng góp · nhận ' + currency(Math.floor(details.price / 2)), 'withdrawContribution:' + id));
    else controls.push('<button class="secondary" disabled title="Hãy thu gọn các nhà thờ còn lại trước">Thu gọn để rút lại</button>');
    return '<div class="asset-row"><span><b style="--tile-color:' + details.color + '"></b>' + escapeHtml(dioceseTitle(details.name)) + '<small> · ' + item.level + ' nhà thờ</small></span><div>' + controls.join('') + '</div></div>';
  }).join('') + '</div>';
}

function buildChurchChoice(player, tile) {
  if (!tile || tile.kind !== 'property' || tile.index !== player.position || state.pendingTile !== tile.index) return '';
  const propertyState = state.properties[tile.id];
  if (!propertyState || propertyState.benefactorId !== player.id) return '';
  const group = state.board.filter(item => item.kind === 'property' && item.groupId === tile.groupId);
  const groupStates = group.map(item => state.properties[item.id]);
  let guidance = '';
  if (!groupStates.every(item => item.benefactorId === player.id)) guidance = 'Để xây thêm nhà thờ, bạn cần đồng hành tại tất cả giáo phận cùng nhóm màu.';
  else if (propertyState.level !== Math.min(...groupStates.map(item => item.level))) guidance = 'Hãy xây nhà thờ đồng đều trong cả nhóm giáo phận.';
  else if (propertyState.level >= 5) guidance = 'Giáo phận này đã có đủ 5 nhà thờ.';
  else if (player.points < tile.houseCost) guidance = 'Bạn chưa đủ ' + currency(tile.houseCost) + ' để xây thêm nhà thờ.';
  else return '<p>Đến lượt ghé thăm với tư cách ân nhân. Mỗi lần dừng tại đây, bạn có thể xây tối đa một nhà thờ.</p>' + button('Xây thêm 1 nhà thờ · ' + currency(tile.houseCost), 'buildChurch', 'primary');
  return '<p class="action-hint">' + escapeHtml(guidance) + '</p>';
}

function dialogMarkup(title, content, extraClass = '') {
  return '<div class="action-dialog-heading ' + extraClass + '">' + escapeHtml(title) + '</div><div class="action-dialog-body">' + content + '</div>';
}

function actionMarkup() {
  if (!state.started || activeAnimations > 0) return '';
  const me = state.players.find(player => player.id === session.playerId);
  const active = state.players.find(player => player.id === state.currentPlayerId);
  if (state.phase === 'finished') return dialogMarkup('Hành trình đã khép lại', '<p class="winner">🏆 ' + escapeHtml(state.players.find(player => player.id === state.winnerId)?.name || 'Người chơi') + ' chiến thắng!</p>');
  if (state.phase === 'auction') {
    const auction = state.auction;
    if (auction.currentBidderId !== session.playerId) return '';
    const tile = state.board[auction.tileIndex];
    return dialogMarkup('Mời cộng đoàn đóng góp', '<p>Đề nghị mức đóng góp tại <strong>' + escapeHtml(tile.kind === 'property' ? dioceseTitle(tile.name) : tile.name) + '</strong><br>Điểm sứ vụ hiện tại: ' + currency(auction.bid) + '</p><div class="bid-row"><input id="bidAmount" type="number" min="' + (auction.bid + 10) + '" step="10" value="' + (auction.bid + 10) + '"><button class="primary" data-action="bid">Góp điểm sứ vụ</button>' + button('Nhường lượt', 'passBid') + '</div>');
  }
  if (state.phase === 'shortfall') {
    const shortfall = state.shortfall;
    if (shortfall.playerId !== session.playerId) return '';
    const canSettle = me.points >= shortfall.amount;
    return dialogMarkup('Thiếu điểm sứ vụ', '<p class="shortfall">Bạn còn thiếu ' + currency(shortfall.amount) + ' (' + escapeHtml(shortfall.reason) + ').</p>' + (canSettle ? button('Bổ sung điểm sứ vụ', 'settleShortfall', 'primary') : '<p>Hãy rút lại đóng góp hoặc thu gọn nhà thờ để có thêm điểm.</p>') + managementButtons(me) + button('Rút khỏi hành trình', 'retire', 'danger'));
  }
  if (active?.id !== session.playerId) return '';
  if (state.phase === 'roll') {
    if (!me.jailed) return '';
    return dialogMarkup('Đang ở kỳ tĩnh tâm', '<p>Nhấn xúc xắc trên bàn để gieo. Bạn cũng có thể đóng góp 50 điểm sứ vụ để kết thúc kỳ tĩnh tâm.</p>' + button('Đóng góp 50 điểm sứ vụ', 'payJail', 'primary'), 'jail-choice');
  }
  if (state.phase === 'contribute') {
    const tile = state.board[state.pendingTile];
    const price = tile.kind === 'property' ? tile.price : tile.kind === 'railroad' ? 200 : 150;
    const place = tile.kind === 'property' ? dioceseTitle(tile.name) : tile.name;
    const isDiocese = tile.kind === 'property';
    return dialogMarkup(isDiocese ? 'Xây nhà thờ đầu tiên' : 'Đồng hành cùng sứ vụ', '<p>Đóng góp ' + currency(price) + (isDiocese ? ' để trở thành ân nhân và xây nhà thờ đầu tiên tại ' : ' để trở thành ân nhân cùng ') + '<strong>' + escapeHtml(place) + '</strong>.</p>' + button(isDiocese ? 'Đóng góp và xây nhà thờ' : 'Đóng góp điểm sứ vụ', 'contribute', 'primary') + button('Mời cộng đoàn đóng góp', 'decline'));
  }
  const tile = state.pendingTile === null ? null : state.board[state.pendingTile];
  const buildChoice = buildChurchChoice(me, tile);
  const place = tile?.kind === 'property' ? dioceseTitle(tile.name) : tile?.name;
  const propertyState = tile?.kind === 'property' ? state.properties[tile.id] : null;
  const isVisitingChurch = propertyState?.benefactorId && propertyState.benefactorId !== me.id;
  const churchCount = propertyState?.level || 0;
  const visitAmount = isVisitingChurch ? tile.rent[Math.max(1, Math.min(churchCount, tile.rent.length - 1))] : 0;
  const stopMessage = isVisitingChurch
    ? '<p>Bạn là người đi lễ tại <strong>' + escapeHtml(place) + '</strong> và đã đóng góp ' + currency(visitAmount) + ' để duy tu, sửa chữa nhà thờ (' + churchCount + ' nhà thờ).</p>'
    : (place ? '<p>Bạn đang dừng tại <strong>' + escapeHtml(place) + '</strong>.</p>' : '');
  const content = stopMessage
    + buildChoice + managementButtons(me)
    + '<p>' + (state.extraTurn ? 'Bạn gieo đôi và được thêm lượt.' : 'Hoàn tất thao tác rồi kết thúc lượt.') + '</p>'
    + button(state.extraTurn ? 'Gieo lượt tiếp theo' : 'Kết thúc lượt', 'endTurn', 'primary');
  return dialogMarkup(tile?.kind === 'property' && state.properties[tile.id]?.benefactorId === me.id ? 'Ân nhân tại giáo phận' : 'Hoàn tất điểm dừng', content);
}

function activityStatus() {
  if (!state?.started) return 'Đang chờ cộng đoàn tham gia phòng.';
  const active = state.players.find(player => player.id === state.currentPlayerId);
  if (state.phase === 'finished') return (state.players.find(player => player.id === state.winnerId)?.name || 'Người chơi') + ' đã hoàn thành hành trình.';
  if (!active) return 'Đang chờ người chơi.';
  if (activeAnimations > 0) return active.name + ' đang di chuyển trên bàn cờ.';
  if (state.phase === 'roll') return active.name + (active.jailed ? ' đang ở kỳ tĩnh tâm.' : ' đang đến lượt gieo xúc xắc.');
  if (state.phase === 'contribute') {
    const tile = state.board[state.pendingTile];
    return active.name + ' đang cân nhắc đóng góp tại ' + (tile?.kind === 'property' ? dioceseTitle(tile.name) : tile?.name || 'điểm dừng') + '.';
  }
  if (state.phase === 'auction') {
    const bidder = state.players.find(player => player.id === state.auction?.currentBidderId);
    return bidder ? bidder.name + ' đang đề nghị mức đóng góp.' : 'Cộng đoàn đang hoàn tất lượt đóng góp.';
  }
  if (state.phase === 'shortfall') return active.name + ' đang thiếu điểm sứ vụ để tiếp tục.';
  const tile = state.pendingTile === null ? null : state.board[state.pendingTile];
  if (tile?.kind === 'property') {
    const propertyState = state.properties[tile.id];
    if (propertyState?.benefactorId === active.id) return active.name + ' đang xem xét xây dựng tại ' + dioceseTitle(tile.name) + '.';
    if (propertyState?.benefactorId) {
      const amount = tile.rent[Math.max(1, Math.min(propertyState.level, tile.rent.length - 1))];
      return active.name + ' vừa đi lễ tại ' + dioceseTitle(tile.name) + ' và đóng góp ' + currency(amount) + ' để duy tu nhà thờ.';
    }
  }
  return active.name + ' đang hoàn tất lượt chơi.';
}

function render() {
  if (!state) return;
  const rollSequence = Number(state.rollSequence || 0);
  if (lastDisplayedRollSequence === null || rollSequence < lastDisplayedRollSequence) {
    lastDisplayedRollSequence = rollSequence;
  } else if (rollSequence > lastDisplayedRollSequence) {
    lastDisplayedRollSequence = rollSequence;
    if (state.dice?.length === 2) showDiceTotal(state.dice[0] + state.dice[1]);
  }
  const inLobby = !state.started && state.phase === 'lobby';
  const game = $('#game');
  game.classList.remove('players-open', 'events-open', 'panel-open');
  game.classList.toggle('in-lobby', inLobby);
  game.classList.toggle('players-collapsed', state.started && !playersExpanded);
  game.classList.toggle('events-expanded', state.started && eventsExpanded);
  $('#roomCodeLabel').textContent = state.code;
  $('#lobbyRoomCode').textContent = state.code;
  $('.players-strip .panel-title h3').textContent = inLobby ? 'Phòng công khai' : 'Cộng đoàn người chơi';
  const playerCount = state.players.filter(player => !player.bankrupt).length + '/8';
  $('#playerCount').textContent = playerCount;
  $('#eventsMenuCount').textContent = String(state.log.length);
  $('#playersMenuButton').setAttribute('aria-expanded', String(!state.started || playersExpanded));
  $('#playersMenuButton').setAttribute('aria-label', playersExpanded ? 'Thu gọn danh sách người chơi' : 'Mở danh sách người chơi');
  $('#playersArrow').classList.toggle('is-collapsed', !playersExpanded);
  $('#eventsMenuButton').setAttribute('aria-expanded', String(eventsExpanded));
  $('#eventsMenuButton').setAttribute('aria-label', eventsExpanded ? 'Thu gọn lịch sử hoạt động' : 'Mở lịch sử hoạt động');
  $('#eventsArrow').classList.toggle('is-expanded', eventsExpanded);
  $('#startGame').classList.toggle('hidden', state.started || state.hostId !== session.playerId);
  $('#startGame').disabled = state.players.length < 2;
  const highlightedPlayerId = state.phase === 'auction' ? state.auction?.currentBidderId : state.currentPlayerId;
  const orderedPlayers = [...state.players].sort((a, b) => a.id === state.hostId ? -1 : b.id === state.hostId ? 1 : 0);
  $('#players').innerHTML = orderedPlayers.map(player => {
    const active = player.id === highlightedPlayerId && state.started && state.phase !== 'finished';
    const dioceses = state.board.filter(tile => tile.kind === 'property' && state.properties[tile.id].benefactorId === player.id);
    const dioceseList = dioceses.length ? dioceses.map(tile => '<span class="church-chip">' + escapeHtml(dioceseTitle(tile.name)) + ' · ' + state.properties[tile.id].level + ' nhà thờ</span>').join('') : '<span class="no-churches">Chưa đồng hành tại giáo phận nào</span>';
    const status = player.left ? '<small>Đã rời phòng</small>' : player.bankrupt ? '<small>Đã rút khỏi hành trình</small>' : '';
    return '<article class="player-card ' + (active ? 'active' : '') + (player.bankrupt ? ' bankrupt' : '') + '" style="--player-color:' + player.color + '"><span class="avatar" aria-hidden="true"></span><div class="player-card-content"><div class="player-card-head"><span class="player-name">' + escapeHtml(player.name) + (player.id === state.hostId ? '<small>Chủ phòng</small>' : '') + (active ? '<small>Đang đến lượt</small>' : '') + status + '</span><b>' + currency(player.points) + '</b></div><div class="church-list"><span>ÂN NHÂN TẠI · ' + dioceses.length + '</span><div>' + dioceseList + '</div></div></div></article>';
  }).join('');
  $('#openSlots').innerHTML = inLobby
    ? Array.from({ length: Math.max(0, 8 - state.players.filter(player => !player.bankrupt).length) }, () => '<div class="open-slot"><span></span><b>Chỗ trống</b></div>').join('')
    : '';
  $('#eventLog').innerHTML = state.log.map(item => '<div class="event-item">' + escapeHtml(item.text) + '</div>').join('');
  const activity = activityStatus();
  $('#actionPanel').textContent = activity;
  const chat = state.chat || [];
  $('#chatMessages').innerHTML = chat.length
    ? chat.map(message => {
      const time = new Date(message.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return '<article class="chat-message ' + (message.playerId === session.playerId ? 'mine' : '') + '"><div><b>' + escapeHtml(message.name) + '</b><time>' + time + '</time></div><p>' + escapeHtml(message.text) + '</p></article>';
    }).join('')
    : '<p class="chat-empty">Tin nhắn của cộng đoàn sẽ hiện tại đây.</p>';
  const latestChatMessageId = chat.at(-1)?.id || null;
  if (latestChatMessageId !== lastChatMessageId) $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  lastChatMessageId = latestChatMessageId;
  const activePlayer = state.players.find(player => player.id === state.currentPlayerId);
  const auctionBidder = state.phase === 'auction' ? state.players.find(player => player.id === state.auction?.currentBidderId) : null;
  $('#turnStatus').textContent = auctionBidder ? 'Đang góp điểm: ' + auctionBidder.name : state.started ? (activePlayer ? 'Lượt của ' + activePlayer.name : 'Ván chơi đã kết thúc') : 'Chờ người chơi…';
  const rollDice = $('#rollDice');
  const canRoll = state.started && state.phase === 'roll' && state.currentPlayerId === session.playerId && activeAnimations === 0 && !rollInProgress;
  rollDice.disabled = !canRoll;
  rollDice.classList.toggle('is-rollable', canRoll);
  rollDice.title = canRoll ? 'Nhấn xúc xắc để gieo' : 'Chỉ người đến lượt mới có thể gieo';
  if (state.dice) {
    setDieFace($('#dieOne'), state.dice[0]);
    setDieFace($('#dieTwo'), state.dice[1]);
  }
  const actionMarkupHtml = actionMarkup();
  $('#actionDialogContent').innerHTML = actionMarkupHtml;
  $('#actionDialog').classList.toggle('hidden', !actionMarkupHtml);
  $('#actionDialog').classList.toggle('jail-choice', state.phase === 'roll' && state.players.find(player => player.id === session.playerId)?.jailed);
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

async function rollFromDice() {
  if (rollInProgress || !state || state.phase !== 'roll' || state.currentPlayerId !== session.playerId || activeAnimations > 0) return;
  rollInProgress = true;
  const box = $('#rollDice');
  box.disabled = true;
  box.classList.add('rolling');
  let rollingFrame = 0;
  const ticker = setInterval(() => {
    setDieRollingFrame($('#dieOne'), rollingFrame + 1);
    setDieRollingFrame($('#dieTwo'), rollingFrame + 5);
    rollingFrame = (rollingFrame + 1) % 9;
  }, 90);
  await wait(850);
  clearInterval(ticker);
  box.classList.remove('rolling');
  await sendAction('roll');
  rollInProgress = false;
  if (state) render();
}

$('#rollDice').addEventListener('click', rollFromDice);

$('#actionDialogContent').addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const spec = target.dataset.action;
  if (spec === 'bid') return sendAction('bid', { amount: $('#bidAmount').value });
  const separator = spec.indexOf(':');
  if (separator >= 0) return sendAction(spec.slice(0, separator), { propertyId: spec.slice(separator + 1) });
  sendAction(spec);
});

$('#playersMenuButton').addEventListener('click', () => {
  playersExpanded = !playersExpanded;
  $('#game').classList.toggle('players-collapsed', !playersExpanded);
  $('#playersMenuButton').setAttribute('aria-expanded', String(playersExpanded));
  $('#playersMenuButton').setAttribute('aria-label', playersExpanded ? 'Thu gọn danh sách người chơi' : 'Mở danh sách người chơi');
  $('#playersArrow').classList.toggle('is-collapsed', !playersExpanded);
});

$('#eventsMenuButton').addEventListener('click', () => {
  eventsExpanded = !eventsExpanded;
  $('#game').classList.toggle('events-expanded', eventsExpanded);
  $('#eventsMenuButton').setAttribute('aria-expanded', String(eventsExpanded));
  $('#eventsMenuButton').setAttribute('aria-label', eventsExpanded ? 'Thu gọn lịch sử hoạt động' : 'Mở lịch sử hoạt động');
  $('#eventsArrow').classList.toggle('is-expanded', eventsExpanded);
});

$('#chatForm').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#chatInput');
  const message = input.value.trim();
  if (!message || !session) return;
  const sendButton = $('#chatForm button');
  sendButton.disabled = true;
  $('#chatError').textContent = '';
  try {
    await request('/api/chat', { code: session.code, playerId: session.playerId, message });
    input.value = '';
    input.focus();
  } catch (error) {
    $('#chatError').textContent = error.message;
  } finally {
    sendButton.disabled = false;
  }
});

function fallbackCopyText(value) {
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.left = '-9999px';
  field.style.top = '0';
  field.style.fontSize = '16px';
  document.body.append(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
  let copied = false;
  try { copied = document.execCommand('copy'); }
  finally { field.remove(); }
  return copied;
}

async function copyText(value, button) {
  const oldLabel = button.textContent;
  try {
    if (!value) throw new Error('Chưa có mã phòng để sao chép.');
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); }
      catch { if (!fallbackCopyText(value)) throw new Error('Clipboard bị trình duyệt chặn.'); }
    } else if (!fallbackCopyText(value)) {
      throw new Error('Clipboard không khả dụng.');
    }
    button.textContent = 'Đã chép';
    showError('', '#gameError');
    setTimeout(() => { if (button.isConnected) button.textContent = oldLabel; }, 1200);
  } catch {
    showError('Không thể sao chép. Hãy kiểm tra quyền clipboard của trình duyệt.', '#gameError');
  }
}

const currentRoomCode = () => state?.code || session?.code || '';
const currentInviteLink = () => new URL('/?room=' + encodeURIComponent(currentRoomCode()), location.origin).href;

$('#copyCode').addEventListener('click', event => copyText(currentRoomCode(), event.currentTarget));
$('#copyLink').addEventListener('click', event => {
  copyText(currentInviteLink(), event.currentTarget);
});
$('#lobbyCopyCode').addEventListener('click', event => copyText(currentRoomCode(), event.currentTarget));
$('#lobbyCopyLink').addEventListener('click', event => {
  copyText(currentInviteLink(), event.currentTarget);
});

const appShell = $('.app-shell');
const mobileMenuToggle = $('#mobileMenuToggle');
mobileMenuToggle.addEventListener('click', () => {
  const isOpen = appShell.classList.toggle('mobile-menu-open');
  mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Đóng menu phòng' : 'Mở menu phòng');
});
document.addEventListener('click', event => {
  if (!appShell.classList.contains('mobile-menu-open')) return;
  if (event.target.closest('#mobileMenuToggle, .room-actions')) return;
  appShell.classList.remove('mobile-menu-open');
  mobileMenuToggle.setAttribute('aria-expanded', 'false');
  mobileMenuToggle.setAttribute('aria-label', 'Mở menu phòng');
});

$('#leaveRoom').addEventListener('click', async () => {
  if (!session || !confirm('Rời phòng này? Nếu ván đang diễn ra, bạn sẽ rút khỏi hành trình và những nơi bạn đang đồng hành sẽ trở về với cộng đoàn.')) return;
  try {
    await request('/api/leave', { code: session.code, playerId: session.playerId });
    source?.close();
    source = null;
    sessionStorage.removeItem('journey27');
    session = null;
    state = null;
    playersExpanded = true;
    eventsExpanded = false;
    lastChatMessageId = null;
    lastDisplayedRollSequence = null;
    rollInProgress = false;
    activeAnimations = 0;
    focusedPlayerId = null;
    displayedPositions.clear();
    movingPlayers.clear();
    for (const [playerId, run] of movementRuns) movementRuns.set(playerId, run + 1);
    appShell.classList.remove('mobile-menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    $('#game').classList.add('hidden');
    $('#lobby').classList.remove('hidden');
    $('#connection').innerHTML = '<i></i> Chưa vào phòng';
    $('#connection').classList.remove('online');
    history.replaceState(null, '', '/');
    roomCodeInput.value = '';
    showError('', '#gameError');
  } catch (error) { showError(error.message, '#gameError'); }
});

const invitedRoom = new URLSearchParams(location.search).get('room');
if (invitedRoom) roomCodeInput.value = invitedRoom.toUpperCase();
if (session) enterRoom(session);
