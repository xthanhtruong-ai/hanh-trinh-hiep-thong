import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, 'public');
const port = Number(process.env.PORT || 4173);

const groups = [
  { id: 'brown', label: 'Miền biên viễn', color: '#9a6b49', price: [60, 80, 100], house: 50, dioceses: ['Lạng Sơn – Cao Bằng', 'Hưng Hóa', 'Bắc Ninh'] },
  { id: 'sky', label: 'Đồng bằng Bắc Bộ', color: '#82d7e8', price: [100, 120, 140, 160], house: 50, dioceses: ['Tổng Giáo phận Hà Nội', 'Hải Phòng', 'Thái Bình', 'Bùi Chu'] },
  { id: 'pink', label: 'Bắc Trung Bộ', color: '#db75b5', price: [140, 160, 180, 200], house: 100, dioceses: ['Phát Diệm', 'Thanh Hóa', 'Vinh', 'Hà Tĩnh'] },
  { id: 'orange', label: 'Trung Trung Bộ', color: '#f09545', price: [180, 200, 220], house: 100, dioceses: ['Tổng Giáo phận Huế', 'Đà Nẵng', 'Qui Nhơn'] },
  { id: 'red', label: 'Cao nguyên & duyên hải', color: '#dc5961', price: [220, 240, 260], house: 150, dioceses: ['Kon Tum', 'Nha Trang', 'Ban Mê Thuột'] },
  { id: 'yellow', label: 'Đông Nam Bộ', color: '#e8c94d', price: [260, 280, 300, 320], house: 150, dioceses: ['Đà Lạt', 'Phan Thiết', 'Phú Cường', 'Xuân Lộc'] },
  { id: 'green', label: 'Miền Đông & Tây Nam Bộ', color: '#62b881', price: [300, 320, 340], house: 200, dioceses: ['Bà Rịa', 'Tổng Giáo phận Sài Gòn', 'Mỹ Tho'] },
  { id: 'blue', label: 'Miền Tây Nam Bộ', color: '#547ee8', price: [350, 400, 450], house: 200, dioceses: ['Vĩnh Long', 'Long Xuyên', 'Cần Thơ'] }
];

const propertyGroups = groups.map(group => ({
  ...group,
  properties: group.dioceses.map((name, index) => ({
    id: group.id + '-' + index,
    name,
    groupId: group.id,
    groupLabel: group.label,
    color: group.color,
    price: group.price[index],
    houseCost: group.house,
    rent: [
      Math.max(10, Math.round(group.price[index] * 0.1)),
      Math.round(group.price[index] * 0.3),
      Math.round(group.price[index] * 0.9),
      Math.round(group.price[index] * 2.7),
      Math.round(group.price[index] * 4),
      Math.round(group.price[index] * 6)
    ]
  }))
}));
const propertyById = Object.fromEntries(propertyGroups.flatMap(group => group.properties).map(property => [property.id, property]));
const groupById = Object.fromEntries(propertyGroups.map(group => [group.id, group]));
const property = (groupId, index) => ({ kind: 'property', propertyId: groupId + '-' + index });
const board = [
  { kind: 'start', name: 'Khởi đầu sứ vụ', icon: '➡️', note: 'Nhận 200 khi đi qua' },
  property('brown', 0), { kind: 'chest', name: 'Quỹ bác ái', icon: '🧺' }, property('brown', 1), property('brown', 2),
  { kind: 'tax', name: 'Đóng góp sứ vụ', icon: '🪙', amount: 200 }, { kind: 'railroad', name: 'Tuyến loan báo Tin Mừng I', icon: '🚉' },
  property('sky', 0), { kind: 'chance', name: 'Biến cố sứ vụ', icon: '✨' }, property('sky', 1), property('sky', 2), property('sky', 3),
  { kind: 'jail', name: 'Nhà tĩnh tâm', icon: '🕊️' },
  property('pink', 0), { kind: 'utility', name: 'Trung tâm mục vụ I', icon: '🏛️' }, property('pink', 1), property('pink', 2), property('pink', 3),
  { kind: 'railroad', name: 'Tuyến loan báo Tin Mừng II', icon: '🚉' },
  property('orange', 0), { kind: 'chest', name: 'Quỹ bác ái', icon: '🧺' }, property('orange', 1), property('orange', 2),
  { kind: 'free', name: 'Ngày hội hiệp thông', icon: '🌿' },
  property('red', 0), { kind: 'chance', name: 'Biến cố sứ vụ', icon: '✨' }, property('red', 1), property('red', 2),
  { kind: 'railroad', name: 'Tuyến loan báo Tin Mừng III', icon: '🚉' },
  property('yellow', 0), property('yellow', 1), { kind: 'utility', name: 'Trung tâm mục vụ II', icon: '🏛️' }, property('yellow', 2), property('yellow', 3),
  { kind: 'goJail', name: 'Tĩnh tâm', icon: '🙏' },
  property('green', 0), property('green', 1), { kind: 'chest', name: 'Quỹ bác ái', icon: '🧺' }, property('green', 2),
  { kind: 'railroad', name: 'Tuyến loan báo Tin Mừng IV', icon: '🚉' },
  property('blue', 0), { kind: 'tax', name: 'Quỹ phục vụ cộng đoàn', icon: '🪙', amount: 100 }, property('blue', 1), property('blue', 2),
  { kind: 'chance', name: 'Biến cố sứ vụ', icon: '✨' }
].map((tile, index) => {
  if (tile.kind !== 'property') return { ...tile, index, id: tile.kind + '-' + index };
  const details = propertyById[tile.propertyId];
  return { ...details, kind: 'property', index, id: tile.propertyId, propertyId: tile.propertyId, icon: '⛪' };
});

const colors = ['#e8ad45', '#dd806e', '#88a77c', '#759f95', '#c99265', '#c17d91', '#d2bc79', '#9a7c9f'];
const chanceCards = [
  { text: 'Bạn được sai đi mở đầu một sứ vụ mới. Tiến đến Khởi đầu sứ vụ và nhận 200 điểm sứ vụ từ Quỹ Hiệp Thông.', effect: 'start' },
  { text: 'Quỹ Hiệp Thông gửi bạn 50 điểm sứ vụ hỗ trợ.', effect: 'points', amount: 50 },
  { text: 'Bạn di chuyển thuận lợi. Tiến thêm 3 ô.', effect: 'forward', amount: 3 },
  { text: 'Bạn dành thời gian cầu nguyện và tĩnh tâm.', effect: 'jail' },
  { text: 'Bạn được mời dự sinh hoạt cộng đoàn. Quỹ Hiệp Thông hỗ trợ 100 điểm sứ vụ.', effect: 'points', amount: 100 },
  { text: 'Bạn đóng góp 75 điểm sứ vụ vào Quỹ Hiệp Thông cho công trình chung.', effect: 'points', amount: -75 }
];
const chestCards = [
  { text: 'Quỹ Hiệp Thông hỗ trợ công trình bác ái của bạn 100 điểm sứ vụ.', effect: 'points', amount: 100 },
  { text: 'Quỹ Hiệp Thông hoàn lại cho bạn 20 điểm sứ vụ từ khoản đóng góp trước đây.', effect: 'points', amount: 20 },
  { text: 'Bạn chung tay sửa sang công trình. Đóng 40 điểm sứ vụ vào Quỹ Hiệp Thông.', effect: 'points', amount: -40 },
  { text: 'Bạn được sai đi một sứ vụ mới. Đến Khởi đầu sứ vụ và nhận 200 điểm sứ vụ từ Quỹ Hiệp Thông.', effect: 'start' },
  { text: 'Quỹ Hiệp Thông trao 50 điểm sứ vụ để ghi nhận việc phục vụ cộng đồng.', effect: 'points', amount: 50 },
  { text: 'Bạn nhận một kỳ tĩnh tâm để cầu nguyện và suy niệm.', effect: 'jail' }
];

const rooms = new Map();
const streams = new Map();
const alive = room => room.players.filter(player => !player.bankrupt);
const activePlayer = room => room.players[room.current];
const newId = () => randomBytes(8).toString('hex');
const newCode = () => randomBytes(3).toString('hex').toUpperCase();
const points = amount => Number(amount).toLocaleString('vi-VN') + ' điểm sứ vụ';
const dioceseTitle = name => name.startsWith('Tổng Giáo phận ') ? name : 'Giáo phận ' + name;

function addLog(room, text) {
  room.log.unshift({ id: newId(), text, time: new Date().toISOString() });
  room.log = room.log.slice(0, 18);
}

function fundReceives(room, player, amount, reason) {
  amount = Math.floor(Number(amount) || 0);
  if (amount <= 0) return;
  addLog(room, 'Quỹ Hiệp Thông nhận ' + points(amount) + ' từ ' + player.name + (reason ? ' — ' + reason : '') + '.');
}

function fundGrants(room, player, amount, reason) {
  amount = Math.floor(Number(amount) || 0);
  if (amount <= 0) return;
  player.points += amount;
  addLog(room, 'Quỹ Hiệp Thông trao ' + points(amount) + ' cho ' + player.name + (reason ? ' — ' + reason : '') + '.');
}

function transferPoints(room, fromPlayer, toPlayer, amount, reason) {
  amount = Math.floor(Number(amount) || 0);
  if (amount <= 0) return;
  if (!toPlayer || toPlayer.bankrupt) {
    fundReceives(room, fromPlayer, amount, reason);
    return;
  }
  toPlayer.points += amount;
  addLog(room, 'Chuyển ' + points(amount) + ' từ ' + fromPlayer.name + ' cho ân nhân ' + toPlayer.name + (reason ? ' — ' + reason : '') + '.');
}

function publicState(room, playerId) {
  return {
    code: room.code, hostId: room.hostId, started: room.started, phase: room.phase,
    currentPlayerId: activePlayer(room)?.id || null, myId: playerId, players: room.players,
    board, properties: room.properties, assets: room.assets, dice: room.dice, rollSequence: room.rollSequence, log: room.log, chat: room.chat,
    pendingTile: room.pendingTile, shortfall: room.shortfall, auction: room.auction, lastCard: room.lastCard,
    winnerId: room.winnerId, extraTurn: room.extraTurn
  };
}

function notifyRoom(room) {
  const clients = streams.get(room.code);
  if (!clients) return;
  for (const client of clients) client.res.write('data: ' + JSON.stringify(publicState(room, client.playerId)) + '\n\n');
}

function createRoom(name) {
  let code = newCode();
  while (rooms.has(code)) code = newCode();
  const playerId = newId();
  const player = { id: playerId, name, color: colors[0], position: 0, points: 0, bankrupt: false, jailed: false, jailTurns: 0, getOutJail: false };
  const properties = Object.fromEntries(Object.keys(propertyById).map(id => [id, { benefactorId: null, level: 0 }]));
  const assets = Object.fromEntries(board.filter(tile => tile.kind === 'railroad' || tile.kind === 'utility').map(tile => [tile.id, { benefactorId: null }]));
  const room = {
    code, hostId: playerId, players: [player], properties, assets, started: false, current: 0, phase: 'lobby',
    pendingTile: null, shortfall: null, auction: null, dice: null, rollSequence: 0, doublesCount: 0, extraTurn: false, log: [], chat: [], lastCard: null, winnerId: null
  };
  addLog(room, name + ' đã tạo phòng.');
  fundGrants(room, player, 1500, 'điểm khởi đầu sứ vụ');
  rooms.set(code, room);
  return { room, playerId };
}

function joinRoom(code, name) {
  const room = rooms.get(code);
  if (!room) throw new Error('Không tìm thấy phòng này.');
  if (room.started) throw new Error('Ván chơi đã bắt đầu, không thể tham gia thêm.');
  if (room.players.length >= 8) throw new Error('Phòng đã đủ 8 người chơi.');
  const playerId = newId();
  const player = { id: playerId, name, color: colors[room.players.length % colors.length], position: 0, points: 0, bankrupt: false, jailed: false, jailTurns: 0, getOutJail: false };
  room.players.push(player);
  addLog(room, name + ' đã vào phòng.');
  fundGrants(room, player, 1500, 'điểm khởi đầu sứ vụ');
  notifyRoom(room);
  return { room, playerId };
}

function leaveRoom(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error('Không tìm thấy phòng.');
  const playerIndex = room.players.findIndex(player => player.id === playerId);
  if (playerIndex < 0) throw new Error('Không tìm thấy người chơi trong phòng.');
  const player = room.players[playerIndex];

  if (!room.started) {
    fundReceives(room, player, player.points, 'người chơi rời phòng chờ');
    player.points = 0;
    room.players.splice(playerIndex, 1);
    addLog(room, player.name + ' đã rời phòng.');
    if (room.hostId === playerId) room.hostId = room.players[0]?.id || null;
    if (room.players.length === 0) {
      rooms.delete(code);
      for (const client of streams.get(code) || []) client.res.end();
      streams.delete(code);
      return;
    }
    notifyRoom(room);
    return;
  }

  const wasCurrent = activePlayer(room)?.id === playerId;
  fundReceives(room, player, player.points, 'người chơi rời hành trình');
  player.points = 0;
  player.left = true;
  player.bankrupt = true;
  for (const [id, state] of Object.entries(room.properties)) {
    if (state.benefactorId === playerId) room.properties[id] = { benefactorId: null, level: 0 };
  }
  for (const state of Object.values(room.assets)) if (state.benefactorId === playerId) state.benefactorId = null;
  if (room.shortfall?.playerId === playerId) room.shortfall = null;
  else if (room.shortfall?.recipientId === playerId) room.shortfall.recipientId = null;

  if (room.auction) {
    if (wasCurrent) {
      room.auction = null;
      room.pendingTile = null;
      room.phase = 'manage';
    } else {
      room.auction.bidders = room.auction.bidders.filter(id => id !== playerId);
      room.auction.passed = room.auction.passed.filter(id => id !== playerId);
      if (room.auction.leaderId === playerId) {
        room.auction.leaderId = null;
        room.auction.bid = 0;
      }
      if (room.auction.currentBidderId === playerId) room.auction.currentBidderId = null;
      advanceAuction(room);
    }
  }

  if (room.hostId === playerId) room.hostId = alive(room)[0]?.id || null;
  addLog(room, player.name + ' đã rời phòng; các nơi họ đang đồng hành được trả lại cho cộng đoàn.');
  if (alive(room).length <= 1) {
    room.winnerId = alive(room)[0]?.id || null;
    room.phase = 'finished';
    if (room.winnerId) addLog(room, room.players.find(item => item.id === room.winnerId).name + ' chiến thắng!');
  } else if (wasCurrent) {
    nextPlayer(room);
  }
  notifyRoom(room);
}

function requirePlayer(room, playerId) {
  const player = room.players.find(item => item.id === playerId);
  if (!player || player.bankrupt) throw new Error('Không tìm thấy người chơi đang hoạt động.');
  return player;
}
function requireTurn(room, playerId) {
  if (activePlayer(room)?.id !== playerId) throw new Error('Chưa đến lượt của bạn.');
}

function nextPlayer(room) {
  const living = alive(room);
  if (living.length <= 1) {
    room.winnerId = living[0]?.id || null;
    room.phase = 'finished';
    if (room.winnerId) addLog(room, room.players.find(player => player.id === room.winnerId).name + ' chiến thắng!');
    return;
  }
  let next = room.current;
  do { next = (next + 1) % room.players.length; } while (room.players[next].bankrupt);
  room.current = next;
  room.phase = 'roll';
  room.pendingTile = null;
  room.shortfall = null;
  room.extraTurn = false;
  room.doublesCount = 0;
}

function pay(room, player, amount, recipientId, reason) {
  amount = Math.max(0, Math.floor(amount));
  const paidNow = Math.min(player.points, amount);
  player.points -= paidNow;
  const recipient = recipientId ? room.players.find(item => item.id === recipientId && !item.bankrupt) : null;
  transferPoints(room, player, recipient, paidNow, reason);
  if (paidNow < amount) {
    room.shortfall = { playerId: player.id, recipientId: recipient?.id || null, amount: amount - paidNow, reason };
    room.phase = 'shortfall';
    addLog(room, player.name + ' đang thiếu ' + points(amount - paidNow) + ' cho ' + reason + '.');
    return false;
  }
  return true;
}

function movePlayer(room, player, steps) {
  const raw = player.position + steps;
  if (raw >= board.length) {
    fundGrants(room, player, 200, 'khi đi qua Khởi đầu sứ vụ');
  }
  player.position = raw % board.length;
  room.pendingTile = player.position;
  addLog(room, player.name + ' đi đến ô ' + board[player.position].name + '.');
  resolveTile(room, player, board[player.position]);
}

function propertyRent(room, tile) {
  const propertyId = tile.propertyId || tile.id;
  const details = propertyById[propertyId];
  const state = room.properties[propertyId];
  if (!details || !state) throw new Error('Không tìm thấy dữ liệu giáo phận để tính khoản duy tu.');
  const churchCount = Math.max(1, Math.min(state.level, details.rent.length - 1));
  return details.rent[churchCount];
}

function assetRent(room, tile, diceTotal) {
  const state = room.assets[tile.id];
  const accompanied = Object.entries(room.assets).filter(([id, item]) => item.benefactorId === state.benefactorId && id.startsWith(tile.kind + '-')).length;
  return tile.kind === 'railroad' ? 25 * Math.pow(2, Math.max(0, accompanied - 1)) : diceTotal * (accompanied >= 2 ? 10 : 4);
}

function resolveTile(room, player, tile) {
  room.pendingTile = tile.index;
  if (tile.kind === 'property' || tile.kind === 'railroad' || tile.kind === 'utility') {
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    if (!state.benefactorId) { room.phase = 'contribute'; return; }
    if (state.benefactorId === player.id) { room.phase = 'manage'; return; }
    const benefactor = room.players.find(item => item.id === state.benefactorId);
    const rent = tile.kind === 'property' ? propertyRent(room, tile) : assetRent(room, tile, room.dice[0] + room.dice[1]);
    const reason = tile.kind === 'property' ? 'duy tu nhà thờ tại ' + dioceseTitle(tile.name) : 'ghé thăm ' + tile.name;
    const paid = pay(room, player, rent, benefactor?.id, reason);
    if (tile.kind === 'property') {
      addLog(room, paid
        ? player.name + ' là người đi lễ tại ' + dioceseTitle(tile.name) + ' và đóng góp ' + points(rent) + ' để duy tu nhà thờ (' + state.level + ' nhà thờ).'
        : player.name + ' là người đi lễ tại ' + dioceseTitle(tile.name) + '; khoản duy tu nhà thờ là ' + points(rent) + '.');
    }
    if (room.phase !== 'shortfall') room.phase = 'manage';
    return;
  }
  if (tile.kind === 'tax') {
    if (pay(room, player, tile.amount, null, tile.name)) room.phase = 'manage';
    return;
  }
  if (tile.kind === 'goJail') {
    player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
    addLog(room, player.name + ' được mời vào kỳ tĩnh tâm.');
    return;
  }
  if (tile.kind === 'chance' || tile.kind === 'chest') {
    drawCard(room, player, tile.kind === 'chance' ? chanceCards : chestCards);
    return;
  }
  room.phase = 'manage';
}

function drawCard(room, player, deck) {
  const card = deck[Math.floor(Math.random() * deck.length)];
  room.lastCard = { title: board[player.position].name, text: card.text };
  addLog(room, 'Thẻ: ' + card.text);
  if (card.effect === 'points') {
    if (card.amount >= 0) fundGrants(room, player, card.amount, 'theo thẻ sứ vụ');
    else if (!pay(room, player, -card.amount, null, 'thẻ sự kiện')) return;
  } else if (card.effect === 'start') {
    player.position = 0;
    fundGrants(room, player, 200, 'khi đến Khởi đầu sứ vụ theo thẻ');
  } else if (card.effect === 'forward') {
    movePlayer(room, player, card.amount);
    return;
  } else if (card.effect === 'jail') {
    player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
    return;
  }
  if (room.phase !== 'shortfall') room.phase = 'manage';
}

function finishAuction(room) {
  const auction = room.auction;
  if (auction.leaderId && auction.bid > 0) {
    const winner = room.players.find(player => player.id === auction.leaderId);
    const tile = board[auction.tileIndex];
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    state.benefactorId = winner.id;
    if (tile.kind === 'property') state.level = 1;
    winner.points -= auction.bid;
    const target = tile.kind === 'property' ? dioceseTitle(tile.name) : tile.name;
    fundReceives(room, winner, auction.bid, tile.kind === 'property' ? 'đóng góp xây nhà thờ đầu tiên tại ' + target : 'đóng góp để đồng hành cùng ' + target);
    addLog(room, tile.kind === 'property'
      ? winner.name + ' trở thành ân nhân và xây nhà thờ đầu tiên tại ' + target + '.'
      : winner.name + ' trở thành ân nhân đồng hành cùng ' + target + '.');
  } else addLog(room, 'Không có ai đề nghị đóng góp cho ô này.');
  room.auction = null; room.pendingTile = null; room.phase = 'manage';
}

function advanceAuction(room) {
  const auction = room.auction;
  const eligible = auction.bidders.filter(id => !auction.passed.includes(id) && id !== auction.leaderId);
  if (eligible.length === 0) { finishAuction(room); return; }
  let chosen = null;
  for (let offset = 0; offset < auction.bidders.length; offset++) {
    const index = (auction.cursor + offset) % auction.bidders.length;
    if (eligible.includes(auction.bidders[index])) {
      chosen = auction.bidders[index]; auction.cursor = (index + 1) % auction.bidders.length; break;
    }
  }
  auction.currentBidderId = chosen;
}

function beginAuction(room) {
  room.auction = {
    tileIndex: room.pendingTile,
    bidders: alive(room).map(player => player.id),
    passed: [], leaderId: null, bid: 0, currentBidderId: null, cursor: room.current
  };
  room.phase = 'auction';
  advanceAuction(room);
}

function performAction(room, playerId, name, data) {
  const player = requirePlayer(room, playerId);
  if (!room.started) throw new Error('Ván chơi chưa bắt đầu.');
  if (name === 'bid' || name === 'passBid') {
    if (room.phase !== 'auction' || room.auction.currentBidderId !== playerId) throw new Error('Chưa đến lượt đấu giá của bạn.');
    if (name === 'bid') {
      const amount = Math.floor(Number(data.amount));
      if (!Number.isFinite(amount) || amount < room.auction.bid + 10 || amount > player.points) throw new Error('Mức đóng góp phải cao hơn hiện tại ít nhất 10 điểm và không vượt quá số điểm sứ vụ của bạn.');
      room.auction.bid = amount; room.auction.leaderId = player.id;
      addLog(room, player.name + ' đề nghị mức đóng góp ' + points(amount) + '.');
    } else {
      room.auction.passed.push(player.id);
      addLog(room, player.name + ' bỏ lượt đấu giá.');
    }
    advanceAuction(room);
    return;
  }
  requireTurn(room, playerId);
  if (name === 'roll') {
    if (room.phase !== 'roll') throw new Error('Bạn chưa thể gieo xúc xắc.');
    const dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    room.dice = dice;
    room.rollSequence += 1;
    const total = dice[0] + dice[1];
    const isDouble = dice[0] === dice[1];
    addLog(room, player.name + ' gieo được ' + dice[0] + ' và ' + dice[1] + '.');
    if (player.jailed) {
      if (isDouble) {
        player.jailed = false; player.jailTurns = 0;
        addLog(room, player.name + ' gieo đôi và kết thúc kỳ tĩnh tâm.');
      } else if (player.jailTurns >= 2) {
        if (!pay(room, player, 50, null, 'khoản đóng góp kết thúc kỳ tĩnh tâm')) return;
        player.jailed = false; player.jailTurns = 0;
      } else {
        player.jailTurns++; room.phase = 'manage';
        addLog(room, player.name + ' chưa gieo được đôi, tiếp tục kỳ tĩnh tâm.');
        return;
      }
    } else if (isDouble) {
      room.doublesCount++;
      if (room.doublesCount >= 3) {
        player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
        addLog(room, player.name + ' gieo đôi ba lần liên tiếp và được mời vào kỳ tĩnh tâm.');
        return;
      }
      room.extraTurn = true;
    } else {
      room.extraTurn = false; room.doublesCount = 0;
    }
    movePlayer(room, player, total);
    return;
  }
  if (name === 'payJail') {
    if (!player.jailed || room.phase !== 'roll') throw new Error('Bạn không ở trong kỳ tĩnh tâm.');
    if (!pay(room, player, 50, null, 'khoản đóng góp kết thúc kỳ tĩnh tâm')) return;
    player.jailed = false; player.jailTurns = 0; room.phase = 'roll';
    return;
  }
  if (name === 'contribute') {
    if (room.phase !== 'contribute' || room.pendingTile === null) throw new Error('Không có nơi nào đang chờ nhận đóng góp.');
    const tile = board[room.pendingTile];
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    const price = tile.kind === 'property' ? tile.price : tile.kind === 'railroad' ? 200 : 150;
    if (player.points < price) throw new Error('Bạn chưa đủ điểm sứ vụ để đóng góp tại đây.');
    player.points -= price; state.benefactorId = player.id;
    if (tile.kind === 'property') state.level = 1;
    fundReceives(room, player, price, tile.kind === 'property' ? 'đóng góp xây nhà thờ đầu tiên tại ' + dioceseTitle(tile.name) : 'đóng góp để đồng hành cùng ' + tile.name);
    const project = tile.kind === 'property'
      ? 'trở thành ân nhân và xây nhà thờ đầu tiên tại ' + dioceseTitle(tile.name)
      : tile.kind === 'utility'
        ? 'đồng hành cùng ' + tile.name
        : 'đồng hành cùng ' + tile.name;
    addLog(room, player.name + ' ' + project + ' với đóng góp ' + points(price) + '.');
    room.pendingTile = null; room.phase = 'manage';
    return;
  }
  if (name === 'decline') {
    if (room.phase !== 'contribute') throw new Error('Không có công trình nào đang chờ mời cộng đoàn đóng góp.');
    beginAuction(room);
    return;
  }
  if (name === 'endTurn') {
    if (room.phase !== 'manage') throw new Error('Hoàn tất hành động hiện tại trước.');
    if (room.extraTurn && !player.jailed) {
      room.phase = 'roll'; room.extraTurn = false;
      addLog(room, player.name + ' được gieo thêm một lượt.');
    } else nextPlayer(room);
    return;
  }
  if (name === 'buildChurch') {
    if (room.phase !== 'manage' || room.pendingTile === null || room.pendingTile !== player.position) throw new Error('Bạn chỉ có thể xây thêm nhà thờ khi ghé ô giáo phận đang đồng hành.');
    const tile = board[room.pendingTile];
    const details = tile?.kind === 'property' ? propertyById[tile.propertyId || tile.id] : null;
    const state = details ? room.properties[details.id] : null;
    if (!details || !state || state.benefactorId !== player.id) throw new Error('Bạn cần là ân nhân tại giáo phận này để xây thêm nhà thờ.');
    const group = groupById[details.groupId];
    const groupStates = group.properties.map(item => room.properties[item.id]);
    if (!groupStates.every(item => item.benefactorId === player.id)) throw new Error('Cần đồng hành tại toàn bộ giáo phận trong nhóm màu để xây thêm nhà thờ.');
    const minimum = Math.min(...groupStates.map(item => item.level));
    if (state.level !== minimum) throw new Error('Hãy xây nhà thờ đồng đều trong cả nhóm giáo phận.');
    if (state.level >= 5) throw new Error('Giáo phận này đã có đủ 5 nhà thờ.');
    if (player.points < details.houseCost) throw new Error('Bạn chưa đủ điểm sứ vụ để xây thêm nhà thờ.');
    player.points -= details.houseCost;
    state.level++;
    fundReceives(room, player, details.houseCost, 'xây thêm nhà thờ tại ' + dioceseTitle(details.name));
    addLog(room, player.name + ' xây thêm nhà thờ tại ' + dioceseTitle(details.name) + ' (' + state.level + ' nhà thờ).');
    room.pendingTile = null;
    return;
  }
  if (name === 'reduceFacility') {
    if (room.phase !== 'manage' && room.phase !== 'shortfall') throw new Error('Chỉ có thể thu gọn nhà thờ khi quản lý sứ vụ hoặc đang thiếu điểm.');
    const details = propertyById[data.propertyId];
    const state = room.properties[data.propertyId];
    if (!details || !state || state.benefactorId !== player.id) throw new Error('Bạn không phải ân nhân tại giáo phận này.');
    const group = groupById[details.groupId];
    const groupStates = group.properties.map(item => room.properties[item.id]);
    if (!groupStates.every(item => item.benefactorId === player.id)) throw new Error('Cần đồng hành tại toàn bộ giáo phận trong nhóm màu để thu gọn nhà thờ đồng đều.');
    const levels = groupStates.map(item => item.level);
    const maximum = Math.max(...levels);
    if (state.level !== maximum || state.level <= 1) throw new Error('Hãy thu gọn nhà thờ theo thứ tự phát triển đồng đều và giữ lại ít nhất một nhà thờ.');
    state.level--;
    const returnedPoints = Math.floor(details.houseCost / 2);
    fundGrants(room, player, returnedPoints, 'hoàn lại một phần điểm khi thu gọn nhà thờ tại ' + dioceseTitle(details.name));
    addLog(room, player.name + ' thu gọn một nhà thờ tại ' + dioceseTitle(details.name) + '.');
    return;
  }
  if (name === 'withdrawContribution') {
    if (room.phase !== 'manage' && room.phase !== 'shortfall') throw new Error('Chỉ có thể rút lại đóng góp khi quản lý sứ vụ hoặc đang thiếu điểm.');
    const details = propertyById[data.propertyId];
    const state = room.properties[data.propertyId];
    if (!details || !state || state.benefactorId !== player.id) throw new Error('Bạn không phải ân nhân tại giáo phận này.');
    const group = groupById[details.groupId];
    if (state.level !== 1 || group.properties.some(item => item.id !== details.id && room.properties[item.id].level > 1)) throw new Error('Hãy thu gọn các nhà thờ còn lại trước khi rút lại đóng góp.');
    const returnedPoints = Math.floor(details.price / 2);
    state.benefactorId = null;
    state.level = 0;
    fundGrants(room, player, returnedPoints, 'hoàn lại 50% điểm khi rút đóng góp tại ' + dioceseTitle(details.name));
    addLog(room, player.name + ' rút lại đóng góp và không còn là ân nhân tại ' + dioceseTitle(details.name) + '.');
    return;
  }
  if (name === 'settleShortfall') {
    if (room.phase !== 'shortfall' || room.shortfall?.playerId !== player.id) throw new Error('Bạn không còn thiếu điểm sứ vụ.');
    if (player.points < room.shortfall.amount) throw new Error('Bạn chưa đủ điểm sứ vụ để hoàn tất khoản đóng góp.');
    const shortfall = room.shortfall;
    player.points -= shortfall.amount;
    const recipient = shortfall.recipientId ? room.players.find(item => item.id === shortfall.recipientId && !item.bankrupt) : null;
    transferPoints(room, player, recipient, shortfall.amount, shortfall.reason);
    room.shortfall = null; room.phase = 'manage';
    return;
  }
  if (name === 'retire') {
    if (room.phase !== 'shortfall' || room.shortfall?.playerId !== player.id) throw new Error('Bạn chỉ có thể rút khỏi hành trình khi thiếu điểm sứ vụ.');
    const shortfall = room.shortfall;
    const recipient = shortfall.recipientId ? room.players.find(item => item.id === shortfall.recipientId && !item.bankrupt) : null;
    transferPoints(room, player, recipient, player.points, 'khi rút khỏi hành trình');
    player.points = 0; player.bankrupt = true;
    for (const [id, state] of Object.entries(room.properties)) if (state.benefactorId === player.id) {
      if (recipient) state.benefactorId = recipient.id;
      else room.properties[id] = { benefactorId: null, level: 0 };
    }
    for (const state of Object.values(room.assets)) if (state.benefactorId === player.id) state.benefactorId = recipient?.id || null;
    addLog(room, player.name + ' rút khỏi hành trình sứ vụ.');
    room.shortfall = null;
    if (alive(room).length <= 1) {
      room.winnerId = alive(room)[0]?.id || null; room.phase = 'finished';
    } else if (activePlayer(room)?.id === player.id) nextPlayer(room);
    else room.phase = 'manage';
    return;
  }
  throw new Error('Hành động không hợp lệ.');
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) { reject(new Error('Yêu cầu quá lớn.')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Dữ liệu JSON không hợp lệ.')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true });
  if (req.method === 'GET' && url.pathname === '/events') {
    const code = (url.searchParams.get('code') || '').toUpperCase();
    const playerId = url.searchParams.get('playerId') || '';
    const room = rooms.get(code);
    if (!room || !room.players.some(player => player.id === playerId)) return json(res, 404, { error: 'Không tìm thấy phòng hoặc người chơi.' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('data: ' + JSON.stringify(publicState(room, playerId)) + '\n\n');
    if (!streams.has(code)) streams.set(code, new Set());
    const client = { res, playerId };
    streams.get(code).add(client);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => { clearInterval(heartbeat); streams.get(code)?.delete(client); });
    return;
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
    try {
      const data = await readBody(req);
      if (url.pathname === '/api/create') {
        const name = String(data.name || '').trim().slice(0, 18);
        if (!name) throw new Error('Nhập tên người chơi trước.');
        const result = createRoom(name);
        return json(res, 200, { code: result.room.code, playerId: result.playerId });
      }
      if (url.pathname === '/api/join') {
        const code = String(data.code || '').trim().toUpperCase();
        const name = String(data.name || '').trim().slice(0, 18);
        if (!name || !code) throw new Error('Nhập tên và mã phòng.');
        const result = joinRoom(code, name);
        return json(res, 200, { code: result.room.code, playerId: result.playerId });
      }
      if (url.pathname === '/api/leave') {
        leaveRoom(String(data.code || '').toUpperCase(), String(data.playerId || ''));
        return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/start') {
        const room = rooms.get(String(data.code || '').toUpperCase());
        if (!room) throw new Error('Không tìm thấy phòng.');
        if (room.hostId !== data.playerId) throw new Error('Chỉ chủ phòng mới có thể bắt đầu.');
        if (room.started || room.players.length < 2) throw new Error('Cần từ 2 người chơi và phòng chưa bắt đầu.');
        room.started = true; room.phase = 'roll';
        addLog(room, 'Ván chơi bắt đầu với ' + room.players.length + ' người.');
        notifyRoom(room);
        return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/action') {
        const room = rooms.get(String(data.code || '').toUpperCase());
        if (!room) throw new Error('Không tìm thấy phòng.');
        performAction(room, data.playerId, data.action, data);
        notifyRoom(room);
        return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/chat') {
        const room = rooms.get(String(data.code || '').toUpperCase());
        if (!room) throw new Error('Không tìm thấy phòng.');
        const player = requirePlayer(room, String(data.playerId || ''));
        const text = String(data.message || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 300);
        if (!text) throw new Error('Nhập nội dung tin nhắn trước.');
        room.chat.push({ id: newId(), playerId: player.id, name: player.name, text, time: new Date().toISOString() });
        if (room.chat.length > 100) room.chat.shift();
        notifyRoom(room);
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'Không tìm thấy đường dẫn.' });
    } catch (error) {
      return json(res, 400, { error: error.message || 'Yêu cầu không hợp lệ.' });
    }
  }
  if (req.method !== 'GET') return json(res, 405, { error: 'Phương thức không được hỗ trợ.' });
  const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.resolve(publicDir, '.' + requestedPath);
  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) return json(res, 403, { error: 'Không được phép.' });
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return json(res, 404, { error: 'Không tìm thấy tệp.' });
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
  res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log('Hành Trình 27 đang chạy tại http://localhost:' + port);
});
