function memoize(func, { maxSize = Infinity, policy = 'LRU', ttl = null, custom = null } = {}) {
  const cache = new Map();
  const frequency = policy === 'LFU' ? new Map() : null;
  const expiry = ttl !== null ? new Map() : null;

  function get_key(...args) {
    return JSON.stringify(args);
  }

  function cleanExpired() {
    if (!expiry) return;
    const now = Date.now();
    const toDelete = [];
    for (const [key, exp] of expiry) {
      if (now > exp) toDelete.push(key);
    }
    for (const key of toDelete) {
      cache.delete(key);
      expiry.delete(key);
      frequency?.delete(key);
    }
  }

  function evict() {
    while (cache.size > maxSize) {
      let evicted = null;
      if (policy === 'LRU') {
        evicted = cache.keys().next().value;
      } else if (policy === 'LFU' && frequency) {
        let minF = Infinity;
        let cand = [];
        for (const [k, f] of frequency) {
          if (f < minF) { minF = f; cand = [k]; }
          else if (f === minF) cand.push(k);
        }
        evicted = cand[0];
      } else if (policy === 'Time-Based Expiry' && expiry) {
        let earliest = Infinity;
        for (const [k, t] of expiry) {
          if (t < earliest) { earliest = t; evicted = k; }
        }
        if (!evicted) evicted = cache.keys().next().value;
      } else if (policy === 'custom' && typeof custom === 'function') {
        const keys = Array.from(cache.keys());
        evicted = custom(keys, new Map(cache));
      } else {
        evicted = cache.keys().next().value;
      }
      if (evicted !== null) {
        cache.delete(evicted);
        frequency?.delete(evicted);
        expiry?.delete(evicted);
      }
    }
  }

  const wrapper = function (...args) {
    const key = get_key(...args);
    cleanExpired();

    if (cache.has(key)) {
      const result = cache.get(key);
      if (policy === 'LRU') {
        cache.delete(key);
        cache.set(key, result);
      }
      if (frequency && frequency.has(key)) {
        frequency.set(key, frequency.get(key) + 1);
      }
      return result;
    }

    const result = func(...args);
    cache.set(key, result);
    if (frequency) frequency.set(key, 1);
    if (expiry) expiry.set(key, Date.now() + ttl * 1000);
    evict();
    return result;
  };

  wrapper.cache = cache;
  wrapper.clear = () => { cache.clear(); frequency?.clear(); expiry?.clear(); };
  wrapper.size = () => cache.size;

  return wrapper;
}

function slow(x) { console.log(`compute ${x}...`); return x * 100; }

console.log('LRU');
const m1 = memoize(slow, { maxSize: 3, policy: 'LRU' });
console.log(m1(10)); console.log(m1(20)); console.log(m1(30)); console.log(m1(10)); console.log(m1(40));
console.log('size:', m1.size());

console.log('\nLFU');
const m2 = memoize(slow, { maxSize: 3, policy: 'LFU' });
console.log(m2(5)); console.log(m2(5)); console.log(m2(5));
console.log(m2(6)); console.log(m2(7)); console.log(m2(8));
console.log('size:', m2.size());

console.log('\nTime-Based Expiry');
const m3 = memoize(slow, { maxSize: 5, policy: 'Time-Based Expiry', ttl: 2 });
console.log(m3(99));
setTimeout(() => {
  console.log(m3(99));
  console.log('size after ttl:', m3.size());
}, 2500);

console.log('\ncustom');
function customEvict(keys) { return keys[keys.length - 1]; }
const m4 = memoize(slow, { maxSize: 3, policy: 'custom', customEviction: customEvict });
console.log(m4(1)); console.log(m4(2)); console.log(m4(3)); console.log(m4(4));
console.log('size:', m4.size());
