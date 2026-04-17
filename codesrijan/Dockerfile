# Stage 1: Build the Java application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Final image with Java and Python
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Create a virtual environment and install requirements
COPY requirements.txt .
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the jar and the python script
COPY --from=build /app/target/codesrijan-0.0.1-SNAPSHOT.jar app.jar
COPY predict.py .
COPY rf_equipment_model.pkl .
COPY equipment_encoder.pkl .
COPY feature_scaler.pkl .

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
