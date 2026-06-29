FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY recommendation-core/pom.xml ./recommendation-core/pom.xml
COPY recommendation-core/src ./recommendation-core/src

COPY content-embedding/pom.xml ./content-embedding/pom.xml
COPY content-embedding/src ./content-embedding/src
COPY content-embedding/models ./content-embedding/models

RUN mvn -f recommendation-core/pom.xml clean install -DskipTests
RUN mvn -f content-embedding/pom.xml clean package dependency:copy-dependencies -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/content-embedding/target/movie-recommendation-content-embedding-1.0.0.jar ./app.jar
COPY --from=build /app/content-embedding/target/dependency ./dependency
COPY --from=build /app/content-embedding/models ./models

ENV PORT=7860
ENV CONTENT_EMBEDDING_HTTP_PORT=7860
ENV CONTENT_EMBEDDING_MODEL_PATH=models/all-MiniLM-L6-v2
ENV CONTENT_EMBEDDING_TOKENIZER=models/all-MiniLM-L6-v2
ENV CONTENT_EMBEDDING_DIMENSION=384
ENV CONTENT_EMBEDDING_INCLUDE_TOKEN_TYPES=true
ENV CONTENT_EMBEDDING_INT32=false
ENV CONTENT_EMBEDDING_POOLING_MODE=mean

EXPOSE 7860

CMD ["java", "-cp", "app.jar:dependency/*", "com.example.recommendation.contentembedding.TextEmbeddingHttpApplication"]