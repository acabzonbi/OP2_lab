function* randomGenerator(min = 1, max = 100) {
    while (true) {
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        yield randomNumber;
    }
}
