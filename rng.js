class RNG {
    #x
    static A = 16_807; // 7^5
    static MODULUS = 2_147_483_647; // 2^31 - 1
    static DEFAULT_SEED = 0xFEEDC0DE;
    constructor(seed = RNG.DEFAULT_SEED) {
        console.assert(Number.isInteger(seed) && seed !== 0);
        this.#x = seed;
    }
    #next_int() {
        this.#x = (RNG.A * this.#x) % RNG.MODULUS;
        return this.#x;
    }
    int() {
        return this.#next_int();
    }
    intRange(a, b) {
        return a + this.int() % (b - a);
    }
    even() {
        return (this.int() & 1) === 0;
    }
    float() {
        return this.int() / RNG.MODULUS;
    }
}
