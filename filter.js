const badWords = [
  'đụ','địt','lồn','cặc','buồi','đéo','vãi','clgt','dmm','dkm',
  'đmm','đkm','dcm','đcm','đm','dm','cl','vl','lz','loz','cc',
  'cac','đút','djt','đjt','đỵt','deo','đuỵt','cức','cứt','bòi',
  'bú','dái','suc','cẹc','bùi','vloz','me','lon',
  't.me','zalo','zl','tele','nt','nhắn','miễn phí','hỗ trợ','lộc','sau giờ',
  'lừa','xạo','cam','campuchia','đào lửa','công an',
  'ngu','súc vật','chó','mày','thần kinh','óc chó','điên','khùng',
  'rủ','quay','ib','ăn chia','hang hốc',
  'fuck','shit','bitch','ass','damn','wtf',
];

function containsBadWord(text) {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/\s+/g,'');
  return badWords.some(word => lower.includes(word.toLowerCase().replace(/\s+/g,'')));
}

function filterText(text) {
  if (!text) return text;
  let result = text;
  badWords.forEach(word => {
    const regex = new RegExp(word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    result = result.replace(regex, '***');
  });
  return result;
}

module.exports = { containsBadWord, filterText };
