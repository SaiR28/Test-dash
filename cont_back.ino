#include <IRremote.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_task_wdt.h>  // Include the Watchdog Timer library
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DFRobot_BME68x.h"
#include "Wire.h"

#define CALIBRATE_PRESSURE
DFRobot_BME68x_I2C bme(0x76);  //0x76 I2C address
float seaLevel;

#define SEND_PIN 32     // GPIO pin for IR LED
int lastHour = -1;

int pwmPin = 34;

// WiFi settings
const char* ssid = "EXT_2.4G";
const char* password = "HieRiih7sai8Choo";

// Backend API settings
const char* backendURL = "http://98.94.183.238/api";

// NTP settings
WiFiUDP udp;
NTPClient timeClient(udp, "pool.ntp.org", 19800, 60000); // UTC offset for IST (5 hours 30 minutes)

// Timing for data sending
unsigned long lastDataSendTime = 0;
const unsigned long DATA_SEND_INTERVAL = 30000; // Send data every 30 seconds

// Empty arrays for temperature range 16°C to 25°C
// Empty arrays for temperature range 16°C to 25°C
uint16_t rawTimings_25[] = {
  1100, 500,
1100, 500, 1100, 2450, 1100, 2550, 1050, 550,
1050, 500, 1100, 2500, 1050, 2550, 1050, 2550,
1050, 2500, 1050, 2550, 1050, 550, 1050, 2550,
1050, 550, 1050, 500, 1100, 500, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1100, 2500,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2500, 1050, 2600, 1000, 550,
1050, 550, 1050, 2550, 1050, 550, 1050
};
uint16_t rawTimings_24[] = {
  1100, 500,
1100, 500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1100, 2500, 1050, 2550,
1050, 2550, 1050, 2550, 1050, 500, 1100, 2500,
1050, 550, 1050, 550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2500, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 2500,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 500, 1100, 2500, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2500, 1100, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 500,
1050, 550, 1050, 600, 1000, 550, 1050, 550,
1050, 2550, 1050, 2550, 1050, 2550, 1050, 550,
1000, 550, 1050, 2550, 1050, 2550, 1050

};
uint16_t rawTimings_23[] = {
  1150, 450,
1150, 450, 1100, 2500, 1100, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 2550, 1050, 2550, 1050, 550, 1050, 2550,
1050, 500, 1100, 500, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 2500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1100, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2550,
1050, 500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 500,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 500,
1100, 550, 1050, 550, 1000, 2600, 1000, 600,
1000, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2500, 1050, 2550, 1050, 600,
1000, 2550, 1050, 550, 1050, 550, 1050

};
uint16_t rawTimings_22[] = {
  1150, 450,
1150, 450, 1100, 2500, 1100, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 2550, 1050, 2550, 1050, 500, 1100, 2500,
1050, 550, 1050, 550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 2500, 1050, 2550, 1050, 550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 500,
1100, 500, 1100, 2500, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 500, 1100, 550, 1050, 2550, 1000, 600,
1000, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 600, 1000, 550, 1050, 600,
1000, 2550, 1050, 2550, 1050, 2500, 1050, 550,
1050, 2600, 1000, 600, 1000, 2550, 1050

};
uint16_t rawTimings_21[] = {
  1150, 450,
1150, 450, 1100, 2500, 1100, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 2550, 1050, 2550, 1050, 550, 1050, 2500,
1100, 500, 1050, 550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 2500, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 500,
1100, 500, 1050, 2550, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2550, 1000, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2550,
1000, 600, 1000, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 600, 1000, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 600, 1000, 550, 1050, 600, 1000, 600,
1000, 2550, 1050, 2550, 1050, 2550, 1000, 600,
1000, 2600, 1000, 2550, 1050, 550, 1050

};
uint16_t rawTimings_20[] = {
  1150, 450,
1150, 450, 1150, 2450, 1100, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2550,
1050, 2500, 1050, 2550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 2500,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2550, 1050, 2500, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 2550, 1050, 550, 1050, 550, 1050, 500,
1100, 500, 1050, 2550, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2600,
1000, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 500, 1100, 2500, 1050, 2600, 1000, 2550,
1050, 550, 1050, 2500, 1100, 2550, 1000, 600,
1000, 600, 1000, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1100, 550,
1000, 600, 1000, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2550, 1000, 2550, 1050, 550,
1050, 2550, 1050, 2550, 1050, 2550, 1000

};
uint16_t rawTimings_19[] = {1100, 500,
1100, 500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1100, 2500, 1050, 2550,
1050, 2550, 1050, 2550, 1050, 500, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2500, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1100, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 500,
1050, 550, 1050, 2600, 1000, 2550, 1050, 2550,

1050, 550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1100, 2550,
1000, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1000, 600,
1000, 600, 1000, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 500,
1050, 550, 1050, 600, 1000, 600, 1000, 600,
1000, 2550, 1050, 2550, 1050, 2500, 1100, 2500,
1050, 600, 1000, 600, 1000, 600, 1000
};
uint16_t rawTimings_18[] = {
1100, 500, 
1100, 500, 1100, 2450, 1100, 2500, 1100, 500,
1100, 500, 1050, 2550, 1050, 2550, 1050, 2500,
1100, 2500, 1050, 2550, 1050, 550, 1050, 2550,
1050, 500, 1100, 500, 1100, 500, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 500, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 500, 1050, 600, 1000, 600,
1000, 2550, 1050, 2550, 1050, 2550, 1000, 2600,
1000, 600, 1000, 550, 1050, 2550, 1050
};
uint16_t rawTimings_17[] = {
1100, 500, 
1100, 500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 2550, 1050, 2500, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 2550,
1050, 500, 1100, 500, 1050, 550, 1050, 550,
1050, 2550, 1050, 2550, 1050, 2500, 1100, 500,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2550,
1050, 500, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2500, 1050, 2550, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 600, 1000, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 600, 1000, 600, 1000, 550, 1050, 550,
1050, 2550, 1050, 2550, 1000, 2550, 1050, 2550,
1050, 550, 1050, 2550, 1000, 600, 1000
};
uint16_t rawTimings_16[] = {
1150, 450,
1150, 450, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 2550,
1050, 2550, 1050, 2550, 1050, 550, 1050, 2500,
1050, 550, 1050, 550, 1050, 550, 1050, 2550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 2500, 1100, 2500, 1050, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2500, 1050, 550,
1050, 550, 1050, 550, 1050, 550, 1050, 550,
1050, 550, 1050, 2550, 1050, 2550, 1050, 2500,
1050, 550, 1050, 2550, 1050, 2550, 1050, 550,
1050, 550, 1050, 2550, 1000, 2550, 1050, 2550,
1050, 550, 1050, 2550, 1050, 2500, 1050, 600,
1000, 600, 1000, 2550, 1050, 2550, 1050, 2550,
1000, 600, 1000, 2600, 1000, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1000, 600,
1000, 600, 1000, 600, 1000, 2550, 1050, 550,
1050, 550, 1050, 550, 1050, 2550, 1050, 550,
1000, 600, 1000, 600, 1000, 600, 1000, 600,
1000, 2550, 1050, 2550, 1050, 2550, 1000, 2600,
1000, 550, 1050, 2550, 1050, 2550, 1000
};
const uint16_t arraySize = sizeof(rawTimings_16) / sizeof(rawTimings_16[0]);
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000; // 5 seconds between sends (if required)
unsigned long lastTemperatureChangeTime = 0;
int lastTemp = -1; // Start with an invalid value for temperature

// Dynamic temperature schedule - fetched from backend
int tempSchedule[24] = {
  24, 24, 24, 24, 24,  // 00:00 - 04:00
  24, 24, 24, 24, 24,  // 05:00 - 09:00
  24, 24, 24, 24, 24,  // 10:00 - 14:00
  24, 24, 24, 24, 24,  // 15:00 - 19:00
  24, 24, 24, 24       // 20:00 - 23:00
};

// Function declarations
void fetchACSchedule();
void sendSensorData(float temp, float humidity, int pressure, int iaq, int co2, int acTemp);
void sendIRSignalForTemperature(int temp);
void sendIRSignal(uint16_t *rawTimings);

void setup() {
    Serial.begin(115200);
    uint8_t rslt = 1;    
    // Initialize receiver and sender
    IrSender.begin(SEND_PIN);
    
    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to WiFi.");
    while(!Serial);
    delay(1000);
    Serial.println();
    while(rslt != 0) {
    rslt = bme.begin();
    if(rslt != 0) {
      Serial.println("bme begin failure");
      delay(2000);
    } 
    Serial.println("bme begin successful");
    #ifdef CALIBRATE_PRESSURE
    bme.startConvert();
    delay(1000);
    bme.update();
    seaLevel = bme.readSeaLevel(32.0);
    Serial.print("seaLevel :");
    Serial.println(seaLevel);
    #endif
    bool res = bme.setGasHeater(360, 100);
    if(res == true){
      Serial.println("set successful!");
    }else{
      Serial.println("set failure!");
    } 
    // Initialize NTP client
    timeClient.begin();
    timeClient.update();

    Serial.println("IR sender and receiver ready...");

    // Fetch AC schedule from backend
    fetchACSchedule();

    // Send initial IR signal at boot
    int initialTemp = tempSchedule[timeClient.getHours()];
    Serial.print("Initial Temperature: ");
    Serial.println(initialTemp);
    sendIRSignalForTemperature(initialTemp);
    lastTemp = initialTemp; // Store the sent temperature
    lastTemperatureChangeTime = millis(); // Update the time of the last temperature change
    lastDataSendTime = millis();
}
}
void loop() {
    timeClient.update();

    int currentHour = timeClient.getHours();
    int currentTemp = tempSchedule[currentHour];

    // On hour change: fetch new schedule and send IR if temp changed
    if (currentHour != lastHour) {
        Serial.print("Hour changed: ");
        Serial.println(currentHour);

        // Fetch latest schedule from backend
        fetchACSchedule();
        currentTemp = tempSchedule[currentHour];

        Serial.print("Sending IR for scheduled temp: ");
        Serial.println(currentTemp);

        sendIRSignalForTemperature(currentTemp);

        lastHour = currentHour;
        lastTemp = currentTemp;
    }

    // ---------- CO2 + BME ----------
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
        Serial.println("Note: No CO2 pulse detected (sensor may need warm-up or check wiring)");
        co2 = 0;
    }

    // Always read BME sensor
    bme.startConvert();
    delay(200);
    bme.update();

    temp = bme.readTemperature() / 100.0;  // Convert to actual temperature (21.82°C)
    humidity = bme.readHumidity() / 1073.0;
    pressure = bme.readPressure() / 100; // Convert to hPa
    iaq = bme.readGasResistance() / 1000; // Simplified IAQ from gas resistance

    // Print all sensor readings
    Serial.println("========== SENSOR READINGS ==========");
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
    Serial.print("AC Set Temp:  ");
    Serial.print(currentTemp);
    Serial.println(" C");
    Serial.println("=====================================");

    // Send data to backend every 30 seconds
    unsigned long timeSinceLastSend = millis() - lastDataSendTime;
    Serial.print("Time since last send: ");
    Serial.print(timeSinceLastSend / 1000);
    Serial.println(" seconds");

    if (timeSinceLastSend >= DATA_SEND_INTERVAL) {
        Serial.println(">>> SENDING DATA TO BACKEND...");
        sendSensorData(temp, humidity, pressure, iaq, (int)co2, currentTemp);
        lastDataSendTime = millis();
    } else {
        Serial.print("Next send in: ");
        Serial.print((DATA_SEND_INTERVAL - timeSinceLastSend) / 1000);
        Serial.println(" seconds");
    }
    Serial.println();

    delay(1000);
}
void sendIRSignalForTemperature(int temp) {
    Serial.print("Sending IR signal for ");
    Serial.print(temp);
    Serial.println("°C...");

    switch(temp) {
        case 16:
            sendIRSignal(rawTimings_16);
            break;
        case 17:
            sendIRSignal(rawTimings_17);
            break;
        case 18:
            sendIRSignal(rawTimings_18);
            break;
        case 19:
            sendIRSignal(rawTimings_19);
            break;
        case 20:
            sendIRSignal(rawTimings_20);
            break;
        case 21:
            sendIRSignal(rawTimings_21);
            break;
        case 22:
            sendIRSignal(rawTimings_22);
            break;
        case 23:
            sendIRSignal(rawTimings_23);
            break;
        case 24:
            sendIRSignal(rawTimings_24);
            break;
        case 25:
            sendIRSignal(rawTimings_25);
            break;
        default:
            Serial.println("No matching temperature for IR signal.");
            break;
    }
}

void sendIRSignal(uint16_t *rawTimings) {
    for (int i = 0; i < 3; i++) {
        IrSender.sendRaw(rawTimings, arraySize, 38); // 38kHz carrier frequency
        delay(2000);  // Short delay between sends (500ms)
        Serial.print("Sending IR signal (Attempt ");
        Serial.print(i + 1);
        Serial.println("/3)");
    }
    return;
}

// Fetch AC schedule from backend
void fetchACSchedule() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected, skipping schedule fetch");
        return;
    }

    HTTPClient http;
    String url = String(backendURL) + "/room/back/ac_schedule";

    Serial.print("Fetching AC schedule from: ");
    Serial.println(url);

    http.begin(url);
    http.setTimeout(10000);
    int httpCode = http.GET();

    if (httpCode == 200) {
        String payload = http.getString();
        Serial.println("Schedule response: " + payload);

        StaticJsonDocument<1024> doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
            JsonObject schedule = doc["ac_schedule"];
            for (int i = 0; i < 24; i++) {
                char hourKey[3];
                sprintf(hourKey, "%02d", i);
                if (schedule.containsKey(hourKey)) {
                    tempSchedule[i] = schedule[hourKey];
                }
            }
            Serial.println("AC schedule updated from backend");
        } else {
            Serial.print("JSON parse error: ");
            Serial.println(error.c_str());
        }
    } else {
        Serial.print("HTTP error fetching schedule: ");
        Serial.println(httpCode);
    }

    http.end();
}

// Send sensor data to backend
void sendSensorData(float temp, float humidity, int pressure, int iaq, int co2, int acTemp) {
    Serial.println("-------- BACKEND UPLOAD --------");

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("ERROR: WiFi not connected!");
        Serial.println("--------------------------------");
        return;
    }
    Serial.println("WiFi: Connected");

    HTTPClient http;
    String url = String(backendURL) + "/room/back/sensors";

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
    doc["ac_temp"] = acTemp;
    doc["ac_mode"] = "COOL";

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