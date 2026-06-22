FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY services/recommendation-core services/recommendation-core
RUN cd services/recommendation-core && mvn clean install -DskipTests

COPY apps/backend apps/backend
RUN cd apps/backend && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/apps/backend/target/*.jar app.jar

EXPOSE 10000

CMD ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar app.jar"]