#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DFRobot_BME68x.h"
#include "Wire.h"

#define CALIBRATE_PRESSURE
DFRobot_BME68x_I2C bme(0x76);  // 0x76 I2C address
float seaLevel;

int pwmPin = 34;  // CO2 sensor PWM pin

// WiFi settings
const char* ssid = "EXT_2.4G";
const char* password = "HieRiih7sai8Choo";

// Backend API settings
const char* backendURL = "http://98.94.183.238/api";

// NTP settings
WiFiUDP udp;
NTPClient timeClient(udp, "pool.ntp.org", 19800, 60000); // UTC offset for IST

// Timing for data sending
unsigned long lastDataSendTime = 0;
const unsigned long DATA_SEND_INTERVAL = 30000; // Send data every 30 seconds

void setup() {
    Serial.begin(115200);
    uint8_t rslt = 1;

    // Connect to Wi-Fi
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println();
    Serial.println("Connected to WiFi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Initialize BME68x sensor
    while (!Serial);
    delay(1000);
    Serial.println();

    while (rslt != 0) {
        rslt = bme.begin();
        if (rslt != 0) {
            Serial.println("BME68x init failed, retrying...");
            delay(2000);
        }
    }
    Serial.println("BME68x initialized successfully!");

    #ifdef CALIBRATE_PRESSURE
    bme.startConvert();
    delay(1000);
    bme.update();
    seaLevel = bme.readSeaLevel(32.0);
    Serial.print("Sea Level Pressure: ");
    Serial.println(seaLevel);
    #endif

    bool res = bme.setGasHeater(360, 100);
    if (res) {
        Serial.println("Gas heater set successfully!");
    } else {
        Serial.println("Gas heater setup failed!");
    }

    // Initialize NTP client
    timeClient.begin();
    timeClient.update();

    Serial.println("Front Room Controller Ready!");
    Serial.println("================================");

    lastDataSendTime = millis();
}

void loop() {
    timeClient.update();

    // ---------- Read Sensors ----------
    float co2 = 0;
    float temp = 0;
    float humidity = 0;
    int pressure = 0;
    int iaq = 0;

    // Try to read CO2 sensor (PWM)
    unsigned long high_us = pulseIn(pwmPin, HIGH, 200000);
    if (high_us > 0) {
        float high_ms = high_us / 1000.0;
        co2 = 5000 * (high_ms - 2.0) / 98.0;
    } else {
        Serial.println("Note: No CO2 pulse detected");
        co2 = 0;
    }

    // Always read BME sensor
    bme.startConvert();
    delay(200);
    bme.update();

    temp = bme.readTemperature() / 100.0;  // Convert to actual temperature
    humidity = bme.readHumidity() / 1073.0;
    pressure = bme.readPressure() / 100; // Convert to hPa
    iaq = bme.readGasResistance() / 1000; // Simplified IAQ from gas resistance

    // Print all sensor readings
    Serial.println("======= FRONT ROOM SENSORS =======");
    Serial.print("Temperature:  ");
    Serial.print(temp, 1);
    Serial.println(" C");
    Serial.print("Humidity:     ");
    Serial.print(humidity, 1);
    Serial.println(" %RH");
    Serial.print("Pressure:     ");
    Serial.print(pressure);
    Serial.println(" hPa");
    Serial.print("CO2:          ");
    Serial.print((int)co2);
    Serial.println(" ppm");
    Serial.print("IAQ (gas):    ");
    Serial.println(iaq);
    Serial.print("Time (IST):   ");
    Serial.print(timeClient.getHours());
    Serial.print(":");
    Serial.print(timeClient.getMinutes());
    Serial.print(":");
    Serial.println(timeClient.getSeconds());
    Serial.println("==================================");

    // Send data to backend every 30 seconds
    unsigned long timeSinceLastSend = millis() - lastDataSendTime;
    Serial.print("Time since last send: ");
    Serial.print(timeSinceLastSend / 1000);
    Serial.println(" seconds");

    if (timeSinceLastSend >= DATA_SEND_INTERVAL) {
        Serial.println(">>> SENDING DATA TO BACKEND...");
        sendSensorData(temp, humidity, pressure, iaq, (int)co2);
        lastDataSendTime = millis();
    } else {
        Serial.print("Next send in: ");
        Serial.print((DATA_SEND_INTERVAL - timeSinceLastSend) / 1000);
        Serial.println(" seconds");
    }
    Serial.println();

    delay(1000);
}

// Send sensor data to backend (Front Room)
void sendSensorData(float temp, float humidity, int pressure, int iaq, int co2) {
    Serial.println("-------- BACKEND UPLOAD --------");

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("ERROR: WiFi not connected!");
        Serial.println("Attempting to reconnect...");
        WiFi.begin(ssid, password);
        delay(5000);
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("Reconnection failed!");
            Serial.println("--------------------------------");
            return;
        }
        Serial.println("Reconnected!");
    }
    Serial.println("WiFi: Connected");

    HTTPClient http;
    String url = String(backendURL) + "/room/front/sensors";

    Serial.print("URL: ");
    Serial.println(url);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);

    StaticJsonDocument<256> doc;
    doc["temp"] = temp;
    doc["humidity"] = humidity;
    doc["pressure"] = pressure;
    doc["iaq"] = iaq;
    doc["co2"] = co2;

    String json;
    serializeJson(doc, json);

    Serial.print("JSON: ");
    Serial.println(json);

    Serial.println("Sending POST request...");
    int httpCode = http.POST(json);

    Serial.print("HTTP Response Code: ");
    Serial.println(httpCode);

    if (httpCode == 200) {
        String response = http.getString();
        Serial.println("SUCCESS! Server response:");
        Serial.println(response);
    } else if (httpCode > 0) {
        Serial.println("ERROR: Server returned error");
        String response = http.getString();
        Serial.println(response);
    } else {
        Serial.print("ERROR: Connection failed - ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
    Serial.println("--------------------------------");
}
