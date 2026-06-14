# Offline Evaluation

Module này dùng MovieLens để đánh giá offline pipeline recommendation.

## Vai trò

- `training-spark`: production trainer, đọc PostgreSQL thật và ghi embeddings thật.
- `offline-evaluation`: benchmark/evaluation riêng, đọc MovieLens CSV và train ALS riêng.
- `recommendation-core`: ranking/rerank logic dùng chung. Module này được `offline-evaluation` gọi trực tiếp.

## Alignment với training-spark

Default ALS của evaluation đang mirror `training-spark/AlsEmbeddingTrainingJob`:

- `implicitPrefs=true`
- `alsRank=64`
- `alsMaxIter=20`
- `alsRegParam=0.08`
- `strength=max(rating)` theo `(userId, movieId)`

MovieLens không có `user_movie_interactions`, nên strength chỉ lấy từ `ratings.csv`.

## Alignment với backend/recommendation-core

Các variant hybrid không tự viết lại score nữa. Evaluation gọi:

- `RecommendationRanker`
- `RecommendationWeightResolver`
- `GenreDiversityReRanker`

Tức là ranking/rerank được đánh giá bằng logic trong `recommendation-core`.

## Cấu trúc dữ liệu

Đặt MovieLens ở root repo:

```text
movie-recommendation/
├── recommendation-core/
├── offline-evaluation/
└── datasets/
    └── ml-32m/
        ├── ratings.csv
        └── movies.csv
```

## Chạy bằng Maven từ root repo

```bash
mvn -pl offline-evaluation -am clean compile exec:java -Dexec.args="--dataDir=../datasets/ml-32m --outputDir=./output --maxUsers=5000"
```

Nếu đang đứng trong `offline-evaluation`, chạy được sau khi đã install core:

```bash
cd ../recommendation-core
mvn clean install

cd ../offline-evaluation
mvn clean compile exec:java -Dexec.args="--dataDir=../datasets/ml-32m --outputDir=./output --maxUsers=5000"
```

## Chạy nhanh với sample nhỏ

```bash
mvn -pl offline-evaluation -am clean compile exec:java -Dexec.args="--dataDir=../datasets/ml-latest-small --outputDir=./output-small --maxUsers=500"
```

## Output

```text
offline-evaluation/output/summary.csv
```

Các variant:

- `POPULARITY`
- `CONTENT_BASED`
- `ALS_ONLY`
- `ALS_HYBRID_RANKING`
- `ALS_HYBRID_RANKING_RERANK`

Metrics:

- `precision_at_k`
- `recall_at_k`
- `hit_rate_at_k`
- `ndcg_at_k`
- `map_at_k`
- `mrr_at_k`
- `catalog_coverage`
- `distinct_genres_per_item_at_k`
