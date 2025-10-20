// deck.js
export default class Deck {
    static SUITS = ["♠", "♥", "♦", "♣"];
    static RANKS = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
    ];

    constructor(numDecks = 1) {
        this.numDecks = numDecks;
        this.cards = this._generateDeck(numDecks);
        this.totalCards = this.cards.length;
        this.shuffle();
    }

    _generateDeck(numDecks) {
        const deck = [];
        for (let i = 0; i < numDecks; i++) {
            for (const suit of Deck.SUITS) {
                for (const rank of Deck.RANKS) {
                    deck.push({ rank, suit });
                }
            }
        }
        return deck;
    }

    shuffle() {
        // Fisher–Yates shuffle
        const { cards } = this;
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return this;
    }

    deal(numCards = 1) {
        if (this.cards.length < numCards) {
            throw new Error("Not enough cards left to deal.");
        }
        const newCards = this.cards.splice(0, numCards);
        return {
            newCards,
            newDeck: this,
        };
    }

    reset() {
        this.cards = this._generateDeck(this.numDecks);
        this.shuffle();
    }

    remaining() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    // Optional utility for blackjack
    static getCardValue(rank) {
        if (rank === "A") return 11;
        if (["K", "Q", "J"].includes(rank)) return 10;
        return parseInt(rank, 10);
    }
}
