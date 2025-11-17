import "./Player.scss";

const Player = ({
    onHit,
    onStand,
    onDouble,
    canHit,
    canStand,
    canDouble,
    playerCards,
    chips,
    stake,
    changeStake,
    total,
}) => {
    // Determine points status
    let pointsClass = "";
    if (total === 21) {
        pointsClass = "player-point-success";
    } else if (total > 21) {
        pointsClass = "player-point-bust";
    }

    const handleStakeUp = () => {
        if (chips > stake + 15) {
            changeStake(stake + 15);
        } else {
            changeStake(chips);
        }
    };

    const handleStakeDown = () => {
        if (stake > 15) {
            changeStake(stake - 15);
        } else {
            changeStake(0);
        }
    };

    return (
        <div>
            <div className={`player-point-total ${pointsClass}`}>
                Points: {total}
            </div>
            <div className="player-area">
                <button
                    className="action-btn-small"
                    onClick={onHit}
                    disabled={!canHit || total >= 21}
                >
                    Hit
                </button>
                <button
                    className="action-btn-small"
                    onClick={onDouble}
                    disabled={!canDouble}
                >
                    Double
                </button>
                {playerCards && (
                    <div className="player-cards">
                        {playerCards.map((card, idx) => (
                            <div
                                className={`drawn-card ${
                                    card && !card.faceUp ? "face-down" : ""
                                }`}
                                key={idx}
                            >
                                {card && card.faceUp ? (
                                    <span>
                                        {card.rank}
                                        {card.suit}
                                    </span>
                                ) : card ? (
                                    <span className="card-back">🂠</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
                <button
                    className="action-btn-small"
                    onClick={onStand}
                    disabled={!canStand}
                >
                    Stand
                </button>
            </div>
            <div className="player-chips">
                <div className="chips-safe" onClick={handleStakeUp}>
                    <span className="chip-label">Safe</span>
                    <span className="chip-count">{chips}</span>
                </div>
                <div className="chips-staked" onClick={handleStakeDown}>
                    <span className="chip-label">Staked</span>
                    <span className="chip-count">{stake}</span>
                </div>
            </div>
        </div>
    );
};

export default Player;
