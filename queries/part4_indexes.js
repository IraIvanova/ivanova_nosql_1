db = db.getSiblingDB("spotify");
db.tracks.dropIndexes();

let printSummary = (explainObj) => {
    const stage = explainObj.executionStats.executionStages;

    printjson({
        winningStage: stage.stage,
        inputStage: stage.inputStage ? stage.inputStage.stage : null,
        totalKeysExamined: explainObj.executionStats.totalKeysExamined,
        totalDocsExamined: explainObj.executionStats.totalDocsExamined,
        executionTimeMillis: explainObj.executionStats.executionTimeMillis
    });
}

print("Task 1")
print("Explain before index");

const firstQuery = {
    track_genre: "pop",
    "audio_features.danceability": {$gte: 0.7}
};

const firstSort = {popularity: -1};

const firstExplain = db.tracks.find(firstQuery).sort(firstSort).explain("executionStats")
printSummary(firstExplain)

print("Creating index");

db.tracks.createIndex({
    track_genre: 1,
    popularity: -1,
    "audio_features.danceability": 1
});

print("Explain after index");

const secondExplain = db.tracks.find(firstQuery).sort(firstSort).explain("executionStats");
printSummary(secondExplain)


print("Task 2");
print("Explain before index");

const workQuery = {
    explicit: false,
    "audio_features.instrumentalness": { $gt: 0.5 },
    "audio_features.speechiness": { $lt: 0.1 }
};

const workExplainBefore = db.tracks.find(workQuery).explain("executionStats");
printSummary(workExplainBefore);

print("Creating index");

db.tracks.createIndex({
    explicit: 1,
    "audio_features.instrumentalness": 1,
    "audio_features.speechiness": 1
});

print("Explain after index");

const workExplainAfter = db.tracks.find(workQuery).explain("executionStats");
printSummary(workExplainAfter);


print("Task 3");
print("Covered query check");

const coveredQuery = {
    track_genre: "pop",
    popularity: {$gte: 70}
};

const coveredExplainWithoutProjection = db.tracks.find(coveredQuery).explain("executionStats");

printSummary(coveredExplainWithoutProjection);

print("With indexed fields");

const coveredExplainWithProjection = db.tracks.find(coveredQuery,
        {
            _id: 0,
            track_genre: 1,
            popularity: 1
        }
    ).explain("executionStats");

printSummary(coveredExplainWithProjection);