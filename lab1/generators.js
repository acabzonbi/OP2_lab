function* randomGenerator(min = 1, max = 100) {
    while (true) {
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        yield randomNumber;
    }
}

async function consumeWithTimeout(iterator, timeoutSeconds) {
    const endTime = Date.now() + timeoutSeconds * 1000;
    let count = 0;
    let total = 0;
    while (Date.now() < endTime) {
        const { value, done } = iterator.next();
        if (done) break;
        count++;
        total += value;
        const average = total / count;
        console.log(
            `Value: ${value} | Total: ${total} | Average: ${average.toFixed(2)}`
        );
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log("\n timeout reached");
    console.log(`Count: ${count}`);
    console.log(`Total: ${total}`);
    console.log(`Average: ${(total / count).toFixed(2)}`);
}

const randomIterator = randomGenerator(10, 50);
consumeWithTimeout(randomIterator, 5);