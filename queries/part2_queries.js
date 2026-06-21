db = db.getSiblingDB("spotify");


// Завдання 1. Треки для вечірки
print("Task 1: Party tracks");

const getPartyTracksQuery =  {
        "audio_features.danceability": {$gt: 0.7},
        "audio_features.energy": {$gt: 0.7},
        duration_ms: {$gte: 180000, $lte: 300000}
    };

const partyTracksCount = db.tracks.countDocuments(getPartyTracksQuery)
const documentExample = db.tracks.findOne(
    getPartyTracksQuery,
    {
        _id: 0,
        track_name: 1,
        artists: 1,
        duration_ms: 1,
        "audio_features.danceability": 1,
        "audio_features.energy": 1
    }
);

printjson(`Party tracks found: ${partyTracksCount}`)
printjson(documentExample)

// Завдання 2. Виконавці, у яких усі треки популярні
print("Task 2: Popular artists");

db.tracks.aggregate([
    {
        $unwind: "$artists"
    },
    {
        $group: {
            _id: "$artists",
            track_count: {$sum: 1},
            min_popularity: {$min: "$popularity"},
            avg_popularity: {$avg: "$popularity"}
        }
    },
    {
        $match: {
            min_popularity: {$gte: 60},
            track_count: {$gte: 3},
        }
    },
    {
        $sort: {
            avg_popularity: -1,
            track_count: -1
        }
    },
    {
        $limit: 20
    },
    {
        $project: {
            _id: 0,
            artist: "$_id",
            track_count: 1,
            min_popularity: {$round: ["$min_popularity", 1]},
            avg_popularity: {$round: ["$avg_popularity", 1]}
        }
    }
]).forEach(printjson);


// Завдання 3. Нетипові треки
print("Task 3: Tempo outliers by genre");

const tempoOutliers = db.tracks.aggregate([
    {
        $group: {
            _id: "$track_genre",
            avg_tempo: {$avg: "$audio_features.tempo"},
            std_tempo: {$stdDevPop: "$audio_features.tempo"},
            tracks: {
                $push: {
                    _id: "$_id",
                    track_name: "$track_name",
                    popularity: "$popularity",
                    artists: "$artists",
                    audio_features: {tempo: "$audio_features.tempo"}
                }
            }
        }
    },
    {
        $addFields: {
            outlier_threshold: {
                $add: ["$avg_tempo", {$multiply: [2, "$std_tempo"]}]
            }
        }
    },
    {
        $project: {
            _id: 0,
            genre: "$_id",
            avg_tempo: {$round: ["$avg_tempo", 1]},
            outlier_threshold: {$round: ["$outlier_threshold",]},
            outlier_tracks: {
                $filter: {
                    input: "$tracks",
                    as: "track",
                    cond: {$gt: ["$$track.audio_features.tempo", "$outlier_threshold"]}
                }
            }
        }
    }
]).toArray()

print("One genre example: ")
printjson(tempoOutliers[0])


// Завдання 4. Треки для фонової роботи
print("Task 4: Background work tracks");

const getBackgroundTracksQuery =   {
    "audio_features.loudness": { $lt: -10 },
    "audio_features.speechiness": { $lt: 0.1 },
    "audio_features.instrumentalness": { $gt: 0.5 },
    explicit: false
  };

const getBackgroundTracksCount = db.tracks.countDocuments(getBackgroundTracksQuery)
const backgroundTrackExample = db.tracks.findOne(
    getBackgroundTracksQuery,
  {
    _id: 0,
    track_name: 1,
    artists: 1,
    "audio_features.loudness": 1,
    "audio_features.speechiness": 1,
    "audio_features.instrumentalness": 1
  }
);

printjson(`Background tracks found: ${getBackgroundTracksCount}`)
printjson(backgroundTrackExample)
