// gameEngine.js
import Deck from "../models/Deck.js";

export const dealCard = (deck, player, faceUp) => {
    if (!deck || deck.isEmpty()) return { player, deck };

    const { newCards, newDeck } = deck.deal(1);
    const updatedPile = [
        ...player.drawnPile,
        ...newCards.map((card) => ({ ...card, faceUp })),
    ];
    const updatedTotal = faceUp ? getTotal(updatedPile) : player.total;

    return {
        player: { ...player, drawnPile: updatedPile, total: updatedTotal },
        deck: newDeck,
    };
};

export const dealCardToDealer = (deck, dealer, faceUp) => {
    if (!deck || deck.isEmpty()) return { dealer, deck };

    const { newCards, newDeck } = deck.deal(1);
    const updatedPile = [
        ...dealer.drawnPile,
        ...newCards.map((card) => ({ ...card, faceUp })),
    ];
    const updatedTotal = faceUp ? getTotal(updatedPile) : dealer.total;

    return {
        dealer: { ...dealer, drawnPile: updatedPile, total: updatedTotal },
        deck: newDeck,
    };
};

export const flipDealerCard = (dealer) => {
    const updatedPile = dealer.drawnPile.map((card, index) => ({
        ...card,
        faceUp: index === 1 ? true : card.faceUp,
    }));
    return { ...dealer, drawnPile: updatedPile, total: getTotal(updatedPile) };
};

export const getTotal = (cards) =>
    cards.reduce(
        (sum, card) =>
            sum + (card && card.faceUp ? Deck.getCardValue(card.rank) : 0),
        0
    );

export const isSoft17 = (cards) => {
    const faceUpCards = cards.filter((c) => c.faceUp);
    const hasAce = faceUpCards.some((c) => c.rank === "A");
    return hasAce && getTotal(cards) === 17;
};

// Utility for running sequences with delays
export const runSequence = (steps) => {
    let totalDelay = 0;
    steps.forEach(({ delay, action }) => {
        totalDelay += delay;
        setTimeout(action, totalDelay);
    });
};
