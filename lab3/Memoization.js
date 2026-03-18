function memoize(func, { maxSize = Infinity, policy = 'LRU' } = {}) {
  const cache = new Map();
  const freq = policy === 'LFU' ? new Map() : null;

  function get_key(...args) {
    return JSON.stringify(args);
  }

  function evict() {
    while (cache.size > maxSize) {
      let evicted = null;
      if (policy === 'LRU') {
        evicted = cache.keys().next().value;
      } else if (policy === 'LFU' && freq) {
        let minF = Infinity;
        let cand = [];
        for (const [k, f] of freq) {
          if (f < minF) { minF = f; cand = [k]; }
          else if (f === minF) cand.push(k);
        }
        evicted = cand[0];
      } else {
        evicted = cache.keys().next().value;
      }
      if (evicted !== null) {
        cache.delete(evicted);
        freq?.delete(evicted);
      }
    }
  }

  const wrapper = function (...args) {
    const key = get_key(...args);

    if (cache.has(key)) {
      const result = cache.get(key);
      if (policy === 'LRU') {
        cache.delete(key);
        cache.set(key, result);
      }
      if (freq && freq.has(key)) {
        freq.set(key, freq.get(key) + 1);
      }
      return result;
    }

    const result = func(...args);
    cache.set(key, result);
    if (freq) freq.set(key, 1);
    evict();
    return result;
  };

  wrapper.cache = cache;
  wrapper.clear = () => { cache.clear(); freq?.clear(); };
  wrapper.size = () => cache.size;

  return wrapper;
}

function slow(x) { console.log(`compute ${x}`); return x * 100; }

const memo = memoize(slow, { maxSize: 3, policy: 'LFU' });
console.log(memo(10));
console.log(memo(20));
console.log(memo(10));
console.log(memo(30));
console.log(memo(40));
console.log('size:', memo.size());
