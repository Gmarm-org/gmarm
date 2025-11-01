# Build stage
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app

# Instalar fuentes y curl para healthcheck y generación de PDFs
RUN apt-get update && apt-get install -y \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto-cjk \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configurar variables de entorno para generación de PDFs (Flying Saucer)
ENV JAVA_OPTS="-Djava.awt.headless=true -Dfile.encoding=UTF-8"

COPY --from=build /app/target/backend-armas-importacion-0.0.1-SNAPSHOT.jar app.jar
# Copiar archivos de configuración
COPY --from=build /app/src/main/resources ./
# Copiar clases compiladas para desarrollo
COPY --from=build /app/target/classes ./classes

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]