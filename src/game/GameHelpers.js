/**
 * Determines whether the dealer should hit according to blackjack rules.
 * Dealer hits on any total less than 17, or on a soft 17 (a 17 containing an Ace counted as 11).
 *
 * @param {Array} cards - Array of card objects in the dealer's hand.
 * @returns {boolean} - True if the dealer should hit, false otherwise.
 */
export function shouldDealerHit(cards) {
    const total = getTotal(cards);
    const isSoft = isSoft17(cards);

    // Dealer hits on soft 17 and below
    return total < 17 || (total === 17 && isSoft);
}

/**
 * Calculates the total value of cards, handling Aces properly
 * @param {Array} cards - Array of card objects
 * @returns {number} - Total value of the cards
 */
export function getTotal(cards) {
    const faceUpCards = cards.filter((card) => card && card.faceUp);
    let total = 0;
    let aces = 0;

    // First pass: count non-ace cards
    faceUpCards.forEach((card) => {
        if (card.rank === "A") {
            aces++;
        } else {
            total += getCardValue(card.rank);
        }
    });

    // Second pass: handle aces
    // Handle all aces: count one as 11 if it doesn't bust, rest as 1
    if (aces > 0) {
        // Give one ace the value 11 if it doesn't bust
        if (total + 11 + (aces - 1) <= 21) {
            total += 11 + (aces - 1);
        } else {
            total += aces; // all aces are worth 1
        }
    }
    return total;
}

export function hasBlackjack(cards) {
    return getTotal(cards) === 21 && cards.length === 2;
}

/**
 * Determines if the hand is a soft 17 (Ace + 6, where Ace counts as 11)
 * @param {Array} cards - Array of card objects
 * @returns {boolean} - true if the hand is soft 17
 */
export function isSoft17(cards) {
    const faceUpCards = cards.filter((card) => card && card.faceUp);
    const aces = faceUpCards.filter((card) => card.rank === "A");
    const nonAces = faceUpCards.filter((card) => card.rank !== "A");

    if (aces.length === 0) return false;

    // Calculate total with all aces as 1
    let totalWithAcesAs1 =
        nonAces.reduce((sum, card) => sum + getCardValue(card.rank), 0) +
        aces.length;

    // If we can make 17 with one ace as 11, it's soft 17
    if (totalWithAcesAs1 + 10 === 17) {
        return true;
    }
    return false;
}

/**
 * Gets the numeric value of a card rank
 * @param {string} rank - The rank of the card (A, 2-10, J, Q, K)
 * @returns {number} - The numeric value of the card
 */
export function getCardValue(rank) {
    if (rank === "A") return 11;
    if (["K", "Q", "J"].includes(rank)) return 10;
    return parseInt(rank, 10);
}

export function resolvePlayerChips(players, dealerCards) {
    return players.map((p) => {
        if (!p.playing) {
            return p;
        } else {
            let result;
            const playerTotal = getTotal(p.cards);
            const dealerTotal = getTotal(dealerCards);
            // dealerPeek branch
            if (hasBlackjack(dealerCards)) {
                if (hasBlackjack(p.cards)) {
                    result = "push";
                } else {
                    result = "lose";
                }
            }
            // standard branch
            else {
                if (playerTotal > 21) {
                    result = "lose";
                } else if (dealerTotal > 21) {
                    result = "win";
                } else {
                    if (getTotal(p.cards) === getTotal(dealerCards)) {
                        if (hasBlackjack(p.cards)) {
                            result = "win";
                        } else {
                            result = "push";
                        }
                    } else {
                        if (getTotal(p.cards) > getTotal(dealerCards)) {
                            result = "win";
                        } else {
                            result = "lose";
                        }
                    }
                }
            }
            // Calculate payout - blackjack pays 3:2, regular wins pay 1:1
            const isBlackjackWin =
                result === "win" &&
                hasBlackjack(p.cards) &&
                !hasBlackjack(dealerCards);
            const payout = isBlackjackWin ? p.stake * 1.5 : p.stake;

            const newChipMap = {
                win: p.chips + payout,
                lose: p.chips - p.stake,
                push: p.chips,
            };
            console.log(result, isBlackjackWin ? "(Blackjack!)" : "");
            console.log(newChipMap);
            const newChips = newChipMap[result];
            return {
                ...p,
                chips: newChips,
            };
        }
    });
}
