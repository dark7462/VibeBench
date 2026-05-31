# Use official lightweight OpenJDK 21 JRE runtime
FROM eclipse-temurin:21-jre-jammy

# Establish runtime workspace directory
WORKDIR /app

# Copy the packaged Spring Boot executable JAR (contains backend + built React frontend assets)
COPY target/vibebench-0.0.1-SNAPSHOT.jar app.jar

# Expose web service container port
EXPOSE 8080

# Configure execution command to start the web app
ENTRYPOINT ["java", "-jar", "app.jar"]
