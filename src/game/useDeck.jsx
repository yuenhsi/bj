import { useState, useEffect, useCallback, useRef } from "react";

const generateDeck = (deckCount = 1) => {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = [
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

    let allCards = [];
    for (let i = 0; i < deckCount; i++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                let faceUp = true;
                allCards.push({ suit, rank, faceUp });
            }
        }
    }
    return shuffle(allCards);
};

const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export function useDeck(deckCount = 1, reshuffleAt = null) {
    const [deck, setDeck] = useState(() => generateDeck(deckCount));
    const [discarded, setDiscarded] = useState(0);
    const deckRef = useRef(deck);

    useEffect(() => {
        deckRef.current = deck;
    }, [deck]);

    useEffect(() => {
        if (reshuffleAt && deck.length <= reshuffleAt) {
            setDeck(generateDeck(deckCount));
            setDiscarded(0);
        }
    }, [deck]);

    const remaining = useCallback(() => deck.length, [deck]);
    const deal = (faceUp = true) => {
        const [newCard, ...newDeck] = deckRef.current;
        setDeck(newDeck);
        return {
            ...newCard,
            faceUp,
        };
    };

    const discard = useCallback((cardsToDiscard) => {
        setDiscarded((prev) => prev + cardsToDiscard);
    }, []);

    return {
        deal,
        discard,
        remaining,
        deck,
        discarded,
    };
}
