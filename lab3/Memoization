function memoize(func, { maxSize = Infinity } = {}) {
  const cache = new Map();

  function get_key(...args) {
    return JSON.stringify(args);
  }

  function evict() {
    while (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
  }

  const wrapper = function (...args) {
    const key = get_key(...args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    evict();
    return result;
  };

  wrapper.cache = cache;
  wrapper.clear = () => cache.clear();
  wrapper.size = () => cache.size;
  return wrapper;
}

function slow(x) { console.log(`compute ${x}...`); return x * 100; }

const memo = memoize(slow, { maxSize: 3 });
console.log(memo(10));
console.log(memo(20));
console.log(memo(30));
console.log(memo(40));
console.log('size:', memo.size());