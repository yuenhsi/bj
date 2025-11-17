import { getTotal, getCardValue } from "./GameHelpers.js";

/**
 * Basic Strategy Charts for Blackjack
 * These determine optimal play based on player total and dealer up card
 */

// Hard totals (no usable ace)
const HARD_STRATEGY = {
    // Player total: { dealer up card: action }
    8: { all: "hit" },
    9: { 3: "double", 4: "double", 5: "double", 6: "double", all: "hit" },
    10: {
        2: "double",
        3: "double",
        4: "double",
        5: "double",
        6: "double",
        7: "double",
        8: "double",
        9: "double",
        all: "hit",
    },
    11: { all: "double" },
    12: { 4: "stand", 5: "stand", 6: "stand", all: "hit" },
    13: { 2: "stand", 3: "stand", 4: "stand", 5: "stand", 6: "stand", all: "hit" },
    14: { 2: "stand", 3: "stand", 4: "stand", 5: "stand", 6: "stand", all: "hit" },
    15: { 2: "stand", 3: "stand", 4: "stand", 5: "stand", 6: "stand", all: "hit" },
    16: { 2: "stand", 3: "stand", 4: "stand", 5: "stand", 6: "stand", all: "hit" },
    17: { all: "stand" },
    18: { all: "stand" },
    19: { all: "stand" },
    20: { all: "stand" },
    21: { all: "stand" },
};

// Soft totals (usable ace counted as 11)
const SOFT_STRATEGY = {
    // A,2 through A,9
    13: { 5: "double", 6: "double", all: "hit" }, // A,2
    14: { 5: "double", 6: "double", all: "hit" }, // A,3
    15: { 4: "double", 5: "double", 6: "double", all: "hit" }, // A,4
    16: { 4: "double", 5: "double", 6: "double", all: "hit" }, // A,5
    17: { 3: "double", 4: "double", 5: "double", 6: "double", all: "hit" }, // A,6
    18: { 2: "double", 3: "double", 4: "double", 5: "double", 6: "double", 7: "stand", 8: "stand", all: "hit" }, // A,7
    19: { all: "stand" }, // A,8
    20: { all: "stand" }, // A,9
    21: { all: "stand" }, // A,10 (blackjack)
};

// Pair splits
const PAIR_STRATEGY = {
    A: { all: "split" },
    2: { 2: "split", 3: "split", 4: "split", 5: "split", 6: "split", 7: "split", all: "hit" },
    3: { 2: "split", 3: "split", 4: "split", 5: "split", 6: "split", 7: "split", all: "hit" },
    4: { 5: "split", 6: "split", all: "hit" },
    5: { all: "double" }, // Treat as 10
    6: { 2: "split", 3: "split", 4: "split", 5: "split", 6: "split", all: "hit" },
    7: { 2: "split", 3: "split", 4: "split", 5: "split", 6: "split", 7: "split", all: "hit" },
    8: { all: "split" },
    9: { 2: "split", 3: "split", 4: "split", 5: "split", 6: "split", 8: "split", 9: "split", all: "stand" },
    10: { all: "stand" },
    J: { all: "stand" },
    Q: { all: "stand" },
    K: { all: "stand" },
};

/**
 * Determines if a hand is soft (contains an ace counted as 11)
 * @param {Array} cards - Array of card objects
 * @returns {boolean}
 */
function isSoftHand(cards) {
    const faceUpCards = cards.filter((card) => card && card.faceUp);
    const hasAce = faceUpCards.some((card) => card.rank === "A");
    if (!hasAce) return false;

    // Check if we can count an ace as 11 without busting
    let total = 0;
    let aces = 0;

    faceUpCards.forEach((card) => {
        if (card.rank === "A") {
            aces++;
        } else {
            total += getCardValue(card.rank);
        }
    });

    // If we can use one ace as 11 without busting, it's soft
    return total + 11 + (aces - 1) <= 21;
}

/**
 * Gets the dealer's up card value
 * @param {Array} dealerCards - Array of dealer's cards
 * @returns {number}
 */
function getDealerUpCard(dealerCards) {
    const upCard = dealerCards.find((card) => card && card.faceUp);
    if (!upCard) return null;

    const value = getCardValue(upCard.rank);
    // Return face value for number cards, 10 for face cards, 11 for ace
    return value;
}

/**
 * Determines if player has a pair
 * @param {Array} cards - Array of player's cards
 * @returns {boolean|string} - false or the rank of the pair
 */
function isPair(cards) {
    if (cards.length !== 2) return false;
    const faceUpCards = cards.filter((card) => card && card.faceUp);
    if (faceUpCards.length !== 2) return false;

    const [card1, card2] = faceUpCards;
    // Treat all 10-value cards as the same for pairing
    const value1 = getCardValue(card1.rank);
    const value2 = getCardValue(card2.rank);

    if (value1 === value2) {
        // Return the actual rank for lookup
        return card1.rank;
    }
    return false;
}

/**
 * Gets the optimal action from a strategy table
 * @param {Object} strategy - Strategy table
 * @param {number} playerValue - Player's hand value
 * @param {number} dealerUpCard - Dealer's up card value
 * @returns {string} - Optimal action
 */
function getOptimalActionFromStrategy(strategy, playerValue, dealerUpCard) {
    const row = strategy[playerValue];
    if (!row) return null;

    // Check if there's a specific action for this dealer card
    if (row[dealerUpCard]) {
        return row[dealerUpCard];
    }

    // Fall back to 'all' if no specific action
    return row.all || null;
}

/**
 * Normalizes player action to standard format
 * @param {string} action - Player action (hit/stand/double)
 * @returns {string}
 */
function normalizeAction(action) {
    return action.toLowerCase().trim();
}

/**
 * Evaluates whether a player action is optimal according to basic strategy
 * @param {Array} playerCards - Player's cards
 * @param {Array} dealerCards - Dealer's cards
 * @param {string} playerAction - The action taken (hit/stand/double)
 * @returns {Object} - { suboptimal: boolean, reason: string|null, optimal: string }
 */
export function evaluatePlay(playerCards, dealerCards, playerAction) {
    const action = normalizeAction(playerAction);
    const dealerUpCard = getDealerUpCard(dealerCards);

    if (dealerUpCard === null) {
        return {
            suboptimal: false,
            reason: "Cannot evaluate without dealer up card",
            optimal: null,
        };
    }

    const playerTotal = getTotal(playerCards);

    // Player is busted or has 21, can't take meaningful action
    if (playerTotal > 21) {
        return {
            suboptimal: false,
            reason: "Hand is already busted",
            optimal: null,
        };
    }

    if (playerTotal === 21 && playerCards.length === 2) {
        return {
            suboptimal: false,
            reason: "Blackjack",
            optimal: "stand",
        };
    }

    let optimalAction;
    let handType;

    // Check for pairs first (only on initial 2 cards)
    const pairRank = isPair(playerCards);
    if (pairRank) {
        optimalAction = getOptimalActionFromStrategy(PAIR_STRATEGY, pairRank, dealerUpCard);
        handType = `pair of ${pairRank}s`;

        // If optimal action is split but player can't split (not implemented),
        // treat as the underlying hand
        if (optimalAction === "split") {
            // For now, we'll still report split as optimal
            // But note that the game doesn't support splitting yet
        }
    }
    // Check for soft hands
    else if (isSoftHand(playerCards)) {
        optimalAction = getOptimalActionFromStrategy(SOFT_STRATEGY, playerTotal, dealerUpCard);
        handType = `soft ${playerTotal}`;
    }
    // Hard hands
    else {
        // For hard totals below 8, always hit
        const lookupTotal = playerTotal < 8 ? 8 : playerTotal;
        optimalAction = getOptimalActionFromStrategy(HARD_STRATEGY, lookupTotal, dealerUpCard);
        handType = `hard ${playerTotal}`;
    }

    // Handle double edge cases
    // Can only double on first two cards
    if (optimalAction === "double" && playerCards.length > 2) {
        optimalAction = "hit";
    }

    // If player can't double (not enough chips), next best is usually hit
    // This is handled by the game logic, but we report the true optimal

    const isSuboptimal = action !== optimalAction;

    if (isSuboptimal) {
        return {
            suboptimal: true,
            reason: `${handType} vs dealer ${dealerUpCard}: should ${optimalAction}, not ${action}`,
            optimal: optimalAction,
        };
    }

    return {
        suboptimal: false,
        reason: null,
        optimal: optimalAction,
    };
}

/**
 * Gets the optimal action without evaluating a specific play
 * @param {Array} playerCards - Player's cards
 * @param {Array} dealerCards - Dealer's cards
 * @returns {string} - Optimal action
 */
export function getOptimalAction(playerCards, dealerCards) {
    const result = evaluatePlay(playerCards, dealerCards, "");
    return result.optimal;
}
