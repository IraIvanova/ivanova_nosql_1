db = db.getSiblingDB("spotify");

print("Task 1: Top 10 artists by average popularity");

db.tracks.aggregate([
    {
        $unwind: "$artists"
    },
    {
        $group: {
            _id: "$artists",
            track_count: {$sum: 1},
            avg_popularity: {$avg: "$popularity"}
        }
    },
    {
        $match: {
            track_count: {$gte: 5}
        }
    },
    {
        $sort: {avg_popularity: -1}
    },
    {
        $limit: 10
    }
]).forEach(printjson);


// Завдання 2
print("=== Task 2: Tracks by mood ===");

db.tracks.aggregate([
    {
        $addFields: {
            mood: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $and: [
                                    {$gte: ["$audio_features.valence", 0.5]},
                                    {$gte: ["$audio_features.energy", 0.5]},
                                ],
                            },
                            then: "happy",
                        },
                         {
                            case: {
                                $and: [
                                    {$lt: ["$audio_features.valence", 0.5]},
                                    {$gte: ["$audio_features.energy", 0.5]},
                                ],
                            },
                            then: "angry",
                        },
                        {
                            case: {
                                $and: [
                                    {$gte: ["$audio_features.valence", 0.5]},
                                    {$lt: ["$audio_features.energy", 0.5]},
                                ],
                            },
                            then: "calm",
                        }
                    ],
                    default: "sad"
                }
            }
        },
    },
    {
        $group: {
            _id: "$mood",
            tracks_count: {$sum: 1}
        }
    },
    {
        $project: {
            _id: 0,
            mood: "$_id",
            tracks_count: 1
        }
    }
]).forEach(printjson)


// Завдання 3
print("Task 3: Most danceable genres");

const danceableGenres = db.tracks.aggregate([
    {
        $group: {
            _id: "$track_genre",
            avg_danceability: {$avg: "$audio_features.danceability"},
            avg_energy: {$avg: "$audio_features.energy"},
            avg_valence: {$avg: "$audio_features.valence"},
            tracks_count: {$sum: 1}
        }
    },
    {
        $match: {
            tracks_count: {$gte: 100}
        }
    },
    {
        $sort: {
            avg_danceability: -1
        }
    },
    {
        $project: {
            _id: 0,
            genre: "$_id",
            avg_danceability: 1,
            avg_energy: 1,
            avg_valence: 1,
            tracks_count: 1
        }
    }
]).toArray();

danceableGenres.slice(0, 5).forEach(genre => printjson(genre));