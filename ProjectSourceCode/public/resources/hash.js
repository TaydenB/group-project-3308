export class WordSelector {

    constructor(url = "words.txt") { //url kept in this.url
        this.url = url;
    }

    static fnv1a(str) { //hash function 
        let h = 0x811c9dc5 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    static TodaysKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async loadWords() {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`Failed To Fecht ${this.url}`);
        const text = await response.text();
        return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    async pickWord() {
        const words = await this.loadWords();
        const key = WordSelector.TodaysKey();
        const hash = WordSelector.fnv1a(key);
        const idex = hash % words.length;
        return words[idex];
    }
};