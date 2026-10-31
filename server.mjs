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
  { kind: 'start', name: 'Xuất phát', icon: '➡️', note: 'Nhận 200 khi đi qua' },
  property('brown', 0), { kind: 'chest', name: 'Quỹ cộng đoàn', icon: '🧺' }, property('brown', 1), property('brown', 2),
  { kind: 'tax', name: 'Đóng góp', icon: '🪙', amount: 200 }, { kind: 'railroad', name: 'Đường hành hương I', icon: '🚉' },
  property('sky', 0), { kind: 'chance', name: 'Cơ duyên', icon: '✨' }, property('sky', 1), property('sky', 2), property('sky', 3),
  { kind: 'jail', name: 'Thăm nhà tạm giữ', icon: '🕊️' },
  property('pink', 0), { kind: 'utility', name: 'Trung tâm mục vụ I', icon: '🏛️' }, property('pink', 1), property('pink', 2), property('pink', 3),
  { kind: 'railroad', name: 'Đường hành hương II', icon: '🚉' },
  property('orange', 0), { kind: 'chest', name: 'Quỹ cộng đoàn', icon: '🧺' }, property('orange', 1), property('orange', 2),
  { kind: 'free', name: 'Nghỉ chân', icon: '🌿' },
  property('red', 0), { kind: 'chance', name: 'Cơ duyên', icon: '✨' }, property('red', 1), property('red', 2),
  { kind: 'railroad', name: 'Đường hành hương III', icon: '🚉' },
  property('yellow', 0), property('yellow', 1), { kind: 'utility', name: 'Trung tâm mục vụ II', icon: '🏛️' }, property('yellow', 2), property('yellow', 3),
  { kind: 'goJail', name: 'Tạm dừng', icon: '⛔' },
  property('green', 0), property('green', 1), { kind: 'chest', name: 'Quỹ cộng đoàn', icon: '🧺' }, property('green', 2),
  { kind: 'railroad', name: 'Đường hành hương IV', icon: '🚉' },
  property('blue', 0), { kind: 'tax', name: 'Quỹ bảo trì', icon: '🪙', amount: 100 }, property('blue', 1), property('blue', 2),
  { kind: 'chance', name: 'Cơ duyên', icon: '✨' }
].map((tile, index) => {
  if (tile.kind !== 'property') return { ...tile, index, id: tile.kind + '-' + index };
  const details = propertyById[tile.propertyId];
  return { ...details, kind: 'property', index, id: tile.propertyId, icon: '⛪' };
});

const colors = ['#ffd166', '#72d6c9', '#c5a1ff', '#ff8792', '#7fc7ff', '#f6a76b', '#a8df7b', '#f3a6d3'];
const chanceCards = [
  { text: 'Bạn tham gia chuyến hành hương. Tiến đến Xuất phát và nhận 200.', effect: 'start' },
  { text: 'Một người bạn gửi lời chúc mừng. Nhận 50.', effect: 'cash', amount: 50 },
  { text: 'Bạn di chuyển thuận lợi. Tiến thêm 3 ô.', effect: 'forward', amount: 3 },
  { text: 'Bạn cần nghỉ ngơi. Đến ô Tạm dừng.', effect: 'jail' },
  { text: 'Bạn được mời dự sinh hoạt cộng đoàn. Nhận 100.', effect: 'cash', amount: 100 },
  { text: 'Bạn đóng góp cho công trình chung 75.', effect: 'cash', amount: -75 }
];
const chestCards = [
  { text: 'Quỹ cộng đoàn gửi bạn khoản hỗ trợ 100.', effect: 'cash', amount: 100 },
  { text: 'Bạn nhận lại khoản đóng góp trước đây. Nhận 20.', effect: 'cash', amount: 20 },
  { text: 'Bạn chung tay sửa sang công trình. Đóng 40.', effect: 'cash', amount: -40 },
  { text: 'Bạn được mời đến Xuất phát. Nhận 200.', effect: 'start' },
  { text: 'Bạn nhận phần thưởng phục vụ cộng đồng 50.', effect: 'cash', amount: 50 },
  { text: 'Bạn được nghỉ một lượt ở Tạm dừng.', effect: 'jail' }
];

const rooms = new Map();
const streams = new Map();
const alive = room => room.players.filter(player => !player.bankrupt);
const activePlayer = room => room.players[room.current];
const newId = () => randomBytes(8).toString('hex');
const newCode = () => randomBytes(3).toString('hex').toUpperCase();
const money = amount => Number(amount).toLocaleString('vi-VN') + ' xu';

function addLog(room, text) {
  room.log.unshift({ id: newId(), text, time: new Date().toISOString() });
  room.log = room.log.slice(0, 18);
}

function publicState(room, playerId) {
  return {
    code: room.code, hostId: room.hostId, started: room.started, phase: room.phase,
    currentPlayerId: activePlayer(room)?.id || null, myId: playerId, players: room.players,
    board, properties: room.properties, assets: room.assets, dice: room.dice, log: room.log,
    pendingTile: room.pendingTile, debt: room.debt, auction: room.auction, lastCard: room.lastCard,
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
  const player = { id: playerId, name, color: colors[0], position: 0, cash: 1500, bankrupt: false, jailed: false, jailTurns: 0, getOutJail: false };
  const properties = Object.fromEntries(Object.keys(propertyById).map(id => [id, { ownerId: null, level: 0, mortgaged: false }]));
  const assets = Object.fromEntries(board.filter(tile => tile.kind === 'railroad' || tile.kind === 'utility').map(tile => [tile.id, { ownerId: null, mortgaged: false }]));
  const room = {
    code, hostId: playerId, players: [player], properties, assets, started: false, current: 0, phase: 'lobby',
    pendingTile: null, debt: null, auction: null, dice: null, doublesCount: 0, extraTurn: false, log: [], lastCard: null, winnerId: null
  };
  addLog(room, name + ' đã tạo phòng.');
  rooms.set(code, room);
  return { room, playerId };
}

function joinRoom(code, name) {
  const room = rooms.get(code);
  if (!room) throw new Error('Không tìm thấy phòng này.');
  if (room.started) throw new Error('Ván chơi đã bắt đầu, không thể tham gia thêm.');
  if (room.players.length >= 8) throw new Error('Phòng đã đủ 8 người chơi.');
  const playerId = newId();
  room.players.push({ id: playerId, name, color: colors[room.players.length % colors.length], position: 0, cash: 1500, bankrupt: false, jailed: false, jailTurns: 0, getOutJail: false });
  addLog(room, name + ' đã vào phòng.');
  notifyRoom(room);
  return { room, playerId };
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
  room.debt = null;
  room.extraTurn = false;
  room.doublesCount = 0;
}

function pay(room, player, amount, creditorId, reason) {
  amount = Math.max(0, Math.floor(amount));
  const paidNow = Math.min(player.cash, amount);
  player.cash -= paidNow;
  if (creditorId) {
    const creditor = room.players.find(item => item.id === creditorId);
    if (creditor && !creditor.bankrupt) creditor.cash += paidNow;
  }
  if (paidNow < amount) {
    room.debt = { debtorId: player.id, creditorId: creditorId || null, amount: amount - paidNow, reason };
    room.phase = 'debt';
    addLog(room, player.name + ' còn thiếu ' + money(amount - paidNow) + ' cho khoản ' + reason + '.');
    return false;
  }
  addLog(room, player.name + ' trả ' + money(amount) + ' — ' + reason + '.');
  return true;
}

function movePlayer(room, player, steps) {
  const raw = player.position + steps;
  if (raw >= board.length) {
    player.cash += 200;
    addLog(room, player.name + ' đi qua Xuất phát và nhận 200.');
  }
  player.position = raw % board.length;
  room.pendingTile = player.position;
  addLog(room, player.name + ' đi đến ô ' + board[player.position].name + '.');
  resolveTile(room, player, board[player.position]);
}

function propertyRent(room, tile) {
  const details = propertyById[tile.propertyId];
  const state = room.properties[tile.propertyId];
  const group = groupById[details.groupId];
  const groupOwned = group.properties.every(item => room.properties[item.id].ownerId === state.ownerId && !room.properties[item.id].mortgaged);
  return state.level === 0 && groupOwned ? details.rent[0] * 2 : details.rent[state.level];
}

function assetRent(room, tile, diceTotal) {
  const state = room.assets[tile.id];
  const owned = Object.entries(room.assets).filter(([id, item]) => item.ownerId === state.ownerId && id.startsWith(tile.kind + '-')).length;
  return tile.kind === 'railroad' ? 25 * Math.pow(2, Math.max(0, owned - 1)) : diceTotal * (owned >= 2 ? 10 : 4);
}

function resolveTile(room, player, tile) {
  room.pendingTile = tile.index;
  if (tile.kind === 'property' || tile.kind === 'railroad' || tile.kind === 'utility') {
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    if (!state.ownerId) { room.phase = 'buy'; return; }
    if (state.ownerId === player.id || state.mortgaged) { room.phase = 'manage'; return; }
    const owner = room.players.find(item => item.id === state.ownerId);
    const rent = tile.kind === 'property' ? propertyRent(room, tile) : assetRent(room, tile, room.dice[0] + room.dice[1]);
    if (pay(room, player, rent, owner?.id, 'tiền thuê ' + tile.name)) addLog(room, owner.name + ' nhận được ' + money(rent) + ' tiền thuê.');
    if (room.phase !== 'debt') room.phase = 'manage';
    return;
  }
  if (tile.kind === 'tax') {
    if (pay(room, player, tile.amount, null, tile.name)) room.phase = 'manage';
    return;
  }
  if (tile.kind === 'goJail') {
    player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
    addLog(room, player.name + ' phải đến ô Thăm nhà tạm giữ.');
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
  if (card.effect === 'cash') {
    if (card.amount >= 0) player.cash += card.amount;
    else if (!pay(room, player, -card.amount, null, 'thẻ sự kiện')) return;
  } else if (card.effect === 'start') {
    player.position = 0; player.cash += 200;
    addLog(room, player.name + ' đến Xuất phát và nhận 200.');
  } else if (card.effect === 'forward') {
    movePlayer(room, player, card.amount);
    return;
  } else if (card.effect === 'jail') {
    player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
    return;
  }
  if (room.phase !== 'debt') room.phase = 'manage';
}

function finishAuction(room) {
  const auction = room.auction;
  if (auction.leaderId && auction.bid > 0) {
    const winner = room.players.find(player => player.id === auction.leaderId);
    const tile = board[auction.tileIndex];
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    state.ownerId = winner.id;
    winner.cash -= auction.bid;
    addLog(room, winner.name + ' thắng đấu giá ô ' + tile.name + ' với ' + money(auction.bid) + '.');
  } else addLog(room, 'Không có ai đấu giá ô này.');
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
      if (!Number.isFinite(amount) || amount < room.auction.bid + 10 || amount > player.cash) throw new Error('Giá đấu phải cao hơn giá hiện tại ít nhất 10 và không vượt quá tiền của bạn.');
      room.auction.bid = amount; room.auction.leaderId = player.id;
      addLog(room, player.name + ' trả giá ' + money(amount) + '.');
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
    const total = dice[0] + dice[1];
    const isDouble = dice[0] === dice[1];
    addLog(room, player.name + ' gieo được ' + dice[0] + ' và ' + dice[1] + '.');
    if (player.jailed) {
      if (isDouble) {
        player.jailed = false; player.jailTurns = 0;
        addLog(room, player.name + ' gieo đôi và rời nhà tạm giữ.');
      } else if (player.jailTurns >= 2) {
        if (!pay(room, player, 50, null, 'phí rời nhà tạm giữ')) return;
        player.jailed = false; player.jailTurns = 0;
      } else {
        player.jailTurns++; room.phase = 'manage';
        addLog(room, player.name + ' chưa gieo được đôi, ở lại nhà tạm giữ.');
        return;
      }
    } else if (isDouble) {
      room.doublesCount++;
      if (room.doublesCount >= 3) {
        player.position = 12; player.jailed = true; player.jailTurns = 0; room.phase = 'manage';
        addLog(room, player.name + ' gieo đôi ba lần liên tiếp và vào nhà tạm giữ.');
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
    if (!player.jailed || room.phase !== 'roll') throw new Error('Bạn không cần trả phí lúc này.');
    if (!pay(room, player, 50, null, 'phí rời nhà tạm giữ')) return;
    player.jailed = false; player.jailTurns = 0; room.phase = 'roll';
    return;
  }
  if (name === 'buy') {
    if (room.phase !== 'buy' || room.pendingTile === null) throw new Error('Không có ô nào đang chờ mua.');
    const tile = board[room.pendingTile];
    const state = tile.kind === 'property' ? room.properties[tile.id] : room.assets[tile.id];
    const price = tile.kind === 'property' ? tile.price : tile.kind === 'railroad' ? 200 : 150;
    if (player.cash < price) throw new Error('Bạn không đủ tiền mua ô này.');
    player.cash -= price; state.ownerId = player.id;
    addLog(room, player.name + ' mua ' + tile.name + ' với giá ' + money(price) + '.');
    room.pendingTile = null; room.phase = 'manage';
    return;
  }
  if (name === 'decline') {
    if (room.phase !== 'buy') throw new Error('Không có ô mua bán nào đang chờ.');
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
  if (name === 'build' || name === 'sellHouse') {
    if (room.phase !== 'manage') throw new Error('Chỉ có thể xây hoặc bán nhà khi quản lý tài sản.');
    const details = propertyById[data.propertyId];
    const state = room.properties[data.propertyId];
    if (!details || !state || state.ownerId !== player.id) throw new Error('Bạn không sở hữu tài sản này.');
    const group = groupById[details.groupId];
    const groupStates = group.properties.map(item => room.properties[item.id]);
    if (!groupStates.every(item => item.ownerId === player.id && !item.mortgaged)) throw new Error('Cần sở hữu trọn bộ màu và không được thế chấp mới xây.');
    const levels = groupStates.map(item => item.level);
    if (name === 'build') {
      const minimum = Math.min(...levels);
      if (state.level !== minimum || state.level >= 5) throw new Error('Phải xây đều trong cả bộ màu.');
      if (player.cash < details.houseCost) throw new Error('Bạn không đủ tiền xây.');
      player.cash -= details.houseCost; state.level++;
      addLog(room, player.name + ' xây thêm một cấp nhà tại ' + details.name + '.');
    } else {
      const maximum = Math.max(...levels);
      if (state.level !== maximum || state.level <= 0) throw new Error('Phải bán nhà theo thứ tự xây đều.');
      state.level--; player.cash += Math.floor(details.houseCost / 2);
      addLog(room, player.name + ' bán một cấp nhà tại ' + details.name + '.');
    }
    return;
  }
  if (name === 'mortgage' || name === 'unmortgage') {
    const details = propertyById[data.propertyId];
    const state = room.properties[data.propertyId];
    if (!details || !state || state.ownerId !== player.id) throw new Error('Bạn không sở hữu tài sản này.');
    if (name === 'mortgage') {
      if (state.mortgaged) throw new Error('Tài sản đã được thế chấp.');
      const group = groupById[details.groupId];
      if (group.properties.some(item => room.properties[item.id].level > 0)) throw new Error('Hãy bán hết nhà trong bộ màu trước khi thế chấp.');
      state.mortgaged = true; player.cash += Math.floor(details.price / 2);
      addLog(room, player.name + ' thế chấp ' + details.name + '.');
    } else {
      const cost = Math.ceil(details.price * 0.55);
      if (!state.mortgaged || player.cash < cost) throw new Error('Không đủ điều kiện hoặc tiền để chuộc tài sản.');
      state.mortgaged = false; player.cash -= cost;
      addLog(room, player.name + ' chuộc lại ' + details.name + '.');
    }
    return;
  }
  if (name === 'payDebt') {
    if (room.phase !== 'debt' || room.debt?.debtorId !== player.id) throw new Error('Bạn không có khoản nợ đang chờ.');
    if (player.cash < room.debt.amount) throw new Error('Bạn cần bán hoặc thế chấp thêm tài sản.');
    const debt = room.debt; player.cash -= debt.amount;
    if (debt.creditorId) {
      const creditor = room.players.find(item => item.id === debt.creditorId);
      if (creditor) creditor.cash += debt.amount;
    }
    room.debt = null; room.phase = 'manage';
    addLog(room, player.name + ' đã thanh toán khoản nợ ' + money(debt.amount) + '.');
    return;
  }
  if (name === 'bankrupt') {
    if (room.phase !== 'debt' || room.debt?.debtorId !== player.id) throw new Error('Bạn không có khoản nợ đang chờ.');
    const debt = room.debt;
    const creditor = debt.creditorId ? room.players.find(item => item.id === debt.creditorId) : null;
    if (creditor) creditor.cash += player.cash;
    player.cash = 0; player.bankrupt = true;
    for (const [id, state] of Object.entries(room.properties)) if (state.ownerId === player.id) {
      if (creditor) state.ownerId = creditor.id;
      else room.properties[id] = { ownerId: null, level: 0, mortgaged: false };
    }
    for (const state of Object.values(room.assets)) if (state.ownerId === player.id) state.ownerId = creditor?.id || null;
    addLog(room, player.name + ' tuyên bố phá sản.');
    room.debt = null;
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
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
  res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log('Hành Trình 27 đang chạy tại http://localhost:' + port);
});
