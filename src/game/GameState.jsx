export function instantiateGameState(numPlayers) {
    return {
        players: Array.from({ length: numPlayers }, (_, idx) => ({
            id: idx + 1,
            drawnPile: [],
            chips: 300,
            stake: 0,
            playing: false,
            total: 0,
        })),
        playerTurn: null,
        dealer: {
            drawnPile: [],
            total: 0,
        },
        // 'betting' | 'initialDealing' | 'playerTurn' | 'dealerTurn' | 'handOver'
        phase: null,
    };
}

export function gameStateReducer(gameState, action) {
    switch (action.type) {
        case "phase":
            return {
                ...gameState,
                phase: action.phase,
                playerTurn:
                    action.phase === "playerTurn"
                        ? gameState.players[0].id
                        : gameState.playerTurn,
            };
        case "reset":
            return {
                ...gameState,
                players: gameState.players.map((player) => ({
                    ...player,
                    drawnPile: [],
                    playing: false,
                    total: 0,
                })),
                dealer: {
                    ...gameState.dealer,
                    drawnPile: [],
                    total: 0,
                },
                phase: "betting",
            };
        case "deal":
            if (action.target === "dealer") {
                const newDrawnPile = [
                    ...gameState.dealer.drawnPile,
                    action.newCard,
                ];
                return {
                    ...gameState,
                    dealer: {
                        ...gameState.dealer,
                        drawnPile: newDrawnPile,
                        total: getTotal(newDrawnPile),
                    },
                };
            } else if (action.target === "player") {
                return {
                    ...gameState,
                    players: gameState.players.map((p) => {
                        if (p.id !== action.playerId) return p;

                        const newDrawnPile = [...p.drawnPile, action.newCard];
                        return {
                            ...p,
                            drawnPile: newDrawnPile,
                            total: getTotal(newDrawnPile),
                        };
                    }),
                };
            }
        case "flipDealerCard":
            const updatedPile = gameState.dealer.drawnPile.map((card, idx) => ({
                ...card,
                faceUp: idx === 1 ? true : card.faceUp,
            }));
            return {
                ...gameState,
                dealer: {
                    ...gameState.dealer,
                    drawnPile: updatedPile,
                    total: getTotal(updatedPile),
                },
            };
        case "setPlayerTurn":
            return {
                ...gameState,
                playerTurn: action.playerId,
            };
        case "addPlayer":
            return {
                ...gameState,
                players: [
                    ...gameState.players,
                    {
                        id: Math.max(gameState.players.map((p) => p.id)) + 1,
                        drawnPile: [],
                        playing: false,
                        chips: 300,
                        stake: 15,
                        total: 0,
                    },
                ],
            };
        case "removePlayer":
            return {
                ...gameState,
                players:
                    gameState.players.length > 1
                        ? gameState.players.slice(
                              0,
                              gameState.players.length - 1
                          )
                        : gameState.players,
            };
        default:
            return gameState;
    }
}

export const getTotal = (cards) => {
    return cards.reduce(
        (sum, card) =>
            sum + (card && card.faceUp ? getCardValue(card.rank) : 0),
        0
    );
};

const getCardValue = (rank) => {
    if (rank === "A") return 11;
    if (["K", "Q", "J"].includes(rank)) return 10;
    return parseInt(rank, 10);
};
