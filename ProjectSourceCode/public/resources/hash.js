// public/resources/hash.js
export class WordSelector {

    constructor(url = "words.txt") {
        this.url = url;
    }

    static fnv1a(str) {
        let h = 0x811c9dc5 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    static TodaysKey() {
    // Force America/Denver timezone (client-side)
    const local = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Denver" })
    );

    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, '0');
    const day = String(local.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


    async loadWords() {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`Failed To Fetch ${this.url}`);
        const text = await response.text();
        return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    async pickWord() {
        const words = await this.loadWords();
        const key = WordSelector.TodaysKey();
        const hash = WordSelector.fnv1a(key);
        const index = hash % words.length;
        return words[index];
    }
}
