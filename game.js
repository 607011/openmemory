(function (window) {
    "use strict";

    import('./rng.js');

    const el = {};

    const DEFAULT_PALETTE = {
        Nothing: new Uint8Array([0, 0, 0, 0]),
        Outline: new Uint8Array([0, 0, 0, 255]),
        Foot: new Uint8Array([255, 178, 176, 255]),
        Fur1: new Uint8Array([226, 148, 13, 255]),
        Fur2: new Uint8Array([226, 93, 14, 255]),
        Fur3: new Uint8Array([38, 38, 38, 255]),
        Mouth1: new Uint8Array([83, 138, 235, 255]),
        Mouth2: new Uint8Array([133, 207, 96, 255]),
        Nose: new Uint8Array([101, 83, 235, 255]),
        Accent: new Uint8Array([247, 247, 246, 255]),
        Ear: new Uint8Array([193, 193, 159, 255]),
        Eye: new Uint8Array([26, 26, 26, 255]),
    };

    const PALETTES = [
        DEFAULT_PALETTE,
        {
            Nothing: new Uint8Array([0, 0, 0, 0]),
            Outline: new Uint8Array([0, 0, 0, 255]),
            Foot: new Uint8Array([255, 178, 176, 255]),
            Fur1: new Uint8Array([128, 128, 128, 255]),
            Fur2: new Uint8Array([89, 89, 89, 255]),
            Fur3: new Uint8Array([38, 38, 38, 255]),
            Mouth1: new Uint8Array([243, 81, 73, 255]),
            Mouth2: new Uint8Array([17, 163, 236, 255]),
            Nose: new Uint8Array([236, 17, 69, 255]),
            Accent: new Uint8Array([247, 247, 246, 255]),
            Ear: new Uint8Array([193, 193, 159, 255]),
            Eye: new Uint8Array([26, 26, 26, 255]),
        },
        {
            Nothing: new Uint8Array([0, 0, 0, 0]),
            Outline: new Uint8Array([0, 0, 0, 255]),
            Foot: new Uint8Array([109, 99, 99, 255]),
            Fur1: new Uint8Array([128, 128, 128, 255]),
            Fur2: new Uint8Array([89, 89, 89, 255]),
            Fur3: new Uint8Array([38, 38, 38, 255]),
            Mouth1: new Uint8Array([243, 81, 73, 255]),
            Mouth2: new Uint8Array([17, 163, 236, 255]),
            Nose: new Uint8Array([101, 83, 235, 255]),
            Accent: new Uint8Array([247, 247, 246, 255]),
            Ear: new Uint8Array([252, 242, 242, 255]),
            Eye: new Uint8Array([26, 26, 26, 255]),
        },
        {
            Nothing: new Uint8Array([0, 0, 0, 0]),
            Outline: new Uint8Array([0, 0, 0, 255]),
            Foot: new Uint8Array([109, 99, 99, 255]),
            Fur1: new Uint8Array([189, 154, 106, 255]),
            Fur2: new Uint8Array([94, 66, 26, 255]),
            Fur3: new Uint8Array([38, 38, 38, 255]),
            Mouth1: new Uint8Array([243, 81, 73, 255]),
            Mouth2: new Uint8Array([17, 163, 236, 255]),
            Nose: new Uint8Array([101, 83, 235, 255]),
            Accent: new Uint8Array([247, 247, 246, 255]),
            Ear: new Uint8Array([252, 242, 242, 255]),
            Eye: new Uint8Array([26, 26, 26, 255]),
        },
    ];

    class MemoryCard extends HTMLImageElement {
        constructor() {
            super();
        }

        connectedCallback() { }
        disconnectedCallback() { }
        attributeChangedCallback(name, oldValue, newValue) { }
    }

    class MemoryGame extends HTMLDivElement {
        #cards
        #rng
        #width
        #height
        #cardSize
        #seed
        #images

        constructor() {
            super();
            this.#clear();
            this.#cardSize = 24;
            for (let i = 1; i <= 7; ++i) {
                const image = document.createElement("img");
                image.onload = () => { this.#addImage(image); }
                image.setAttribute("src", `_raw/kitten${i}.png`);
            }
        }

        #modifiedImage(image, palette) {
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, image.width, image.height);
            const allowed_colors = Object.entries(DEFAULT_PALETTE);
            for (let y = 0; y < canvas.height; ++y) {
                for (let x = 0; x < canvas.width; ++x) {
                    const rgba = ctx.getImageData(x, y, 1, 1).data;
                    const [name, _] = allowed_colors.find(c => indexedDB.cmp(rgba, c[1]) === 0);
                    ctx.putImageData(palette[name], x, y);
                }
            }
            const newImage = new Image;
            image.src = canvas.toDataURL();
            return newImage;
        }

        #checkImage(image) {
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
            const ctx = canvas.getContext("2d");
            const allowed_colors = Object.entries(DEFAULT_PALETTE);
            let ok = true;
            for (let y = 0; y < canvas.height; ++y) {
                for (let x = 0; x < canvas.width; ++x) {
                    const rgba = ctx.getImageData(x, y, 1, 1).data;
                    const c = allowed_colors.find(c => indexedDB.cmp(rgba, c[1]) === 0);
                    if (typeof c === "undefined") {
                        console.error(`bad color found at ${x},${y} in ${image.src}: ${rgba}`);
                        ok = false;
                    }
                }
            }
            return ok ? canvas : null;
        }

        #addImage(image) {
            const canvas = this.#checkImage(image);
            if (canvas !== null) {
                this.#images.push(canvas);
            }
        }

        #clear() {
            this.#cards = [];
            this.#images = [];
            if (this.shadowRoot !== null) {
                while (this.shadowRoot.firstChild) {
                    this.shadowRoot.removeChild(this.shadowRoot.firstChild)
                }
            }
        }

        #generate() {
            this.#clear();
            const shadow = this.attachShadow({ mode: "open" });
            const linkEl = document.createElement("link");
            linkEl.setAttribute("rel", "stylesheet");
            linkEl.setAttribute("href", "shadow.css");
            const gridEl = document.createElement("div");
            gridEl.className = "grid";
            gridEl.style.gridTemplateColumns = `repeat(${this.#width}, ${this.#cardSize}px)`;
            gridEl.style.gridTemplateRows = `repeat(${this.#height}, ${this.#cardSize}px)`;
            const N_CARDS = this.#width * this.#height;
            for (let i = 0; i < N_CARDS; ++i) {
                const card = document.createElement("memory-card");
                gridEl.appendChild(card);
            }
            shadow.appendChild(linkEl);
            shadow.appendChild(gridEl);

        }

        connectedCallback() {
            this.#seed = parseInt(this.getAttribute("data-seed"));
            this.#width = parseInt(this.getAttribute("width"));
            this.#height = parseInt(this.getAttribute("height"));
            this.#rng = new RNG(this.#seed);
            this.#generate();
        }

        disconnectedCallback() {
            console.log("Custom element removed from page.");
        }

        adoptedCallback() {
            console.log("Custom element moved to new page.");
        }

        attributeChangedCallback(name, oldValue, newValue) {
            console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
            if (name === "data-seed") {
                this.#seed = parseInt(newValue);
                this.#rng = new RNG(this.#seed);
                this.#generate();
            }
        }

        static generateCards(howMany) {

        }
    }

    function main() {
        console.debug("Ready.");
        customElements.define("memory-game", MemoryGame, { extends: "div" });
        customElements.define("memory-card", MemoryCard, { extends: "img" });
    }
    window.addEventListener("load", main);
})(window);
