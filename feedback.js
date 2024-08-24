class MoveCandidate {
    constructor(coords, visits, winrate, score) {
        this.coords = coords;
        this.visits = visits;
        this.winrate = winrate;
        this.score = score;
    }
}

class SigmoidTransform {
    constructor() {

    }

    transform() {

    }
}

class FeedbackTransformer {
    constructor() {
        this.transformer = new SigmoidTransform();
        this.currentWinrate = 0.5;
        this.currentScore = 0;
    }

    katago2moves(katagoData) {
        const moveList = [];
        console.log(`parsing JSON: ${katagoData}`);
        const movesData = JSON.parse(katagoData);

        console.log(`moves data: ${JSON.stringify(movesData)}`);

        movesData.moveInfos.forEach(moveInfo => {
            const { move, visits, winrate, scoreLead } = moveInfo;
            const mc = new MoveCandidate(move, visits, winrate, scoreLead);
            moveList.push(mc);
        });
        
        return {
            id: movesData.id,
            moveList: moveList
        };
    }

    calculateFeedback(moveData) {
        const moveList = moveData.moveList;
        console.log(`${moveList}`);
        moveList.sort((a, b) => b.visits - a.visits);

        let bestWinrateLead = 0;
        let bestScoreLead = 0;

        if (moveList.length > 1) {
            bestWinrateLead = moveList[0].winrate - moveList[1].winrate;
            bestScoreLead = moveList[0].score - moveList[1].score;
        }

        this.currentWinrate = moveList[0].winrate;
        this.currentScore = moveList[0].score;

        return {
            gameId: moveData.id,
            winrate: this.currentWinrate,
            score: this.currentScore
        };
    }
};

module.exports = { FeedbackTransformer };