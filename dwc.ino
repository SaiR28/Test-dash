#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// ================= CONFIG =================

// WiFi
const char* ssid = "EXT_2.4G";
const char* pass = "HieRiih7sai8Choo";

// Backend
const char* SERVER_URL = "http://98.94.183.238/api";
const char* UNIT_ID = "DWC1";  // Change to DWC2 for second unit

// STM UART
#define STM_RX 16
#define STM_TX 17

// DHT - 8 sensors for 4 levels x 2 positions (L11, L12, L21, L22, L31, L32, L41, L42)
#define DHTTYPE DHT22
const int DHT_PINS[8] = {22,23,32,33,25,26,27,14};

// DS18B20
#define ONEWIRE_PIN 4

// ================= GLOBALS =================

DHT dhts[8] = {
  DHT(22,DHTTYPE), DHT(23,DHTTYPE), DHT(32,DHTTYPE), DHT(33,DHTTYPE),
  DHT(25,DHTTYPE), DHT(26,DHTTYPE), DHT(27,DHTTYPE), DHT(14,DHTTYPE)
};

// Climate data: 4 levels x 2 positions
float dhtTemp[8];
float dhtHumidity[8];
float waterTemp = NAN;

// STM values
float stm_ph_v = NAN, stm_turb = NAN, stm_tds = NAN;
long  stm_water = -1;

// DHT scheduler
unsigned long lastDHTRead = 0;
const unsigned long DHT_INTERVAL = 7500;
int dhtIndex = 0;
bool dhtCycleDone = false;

// Periodic send (fallback if no STM32 trigger)
unsigned long lastServerSend = 0;
const unsigned long SERVER_SEND_INTERVAL = 60000; // Send every 60 seconds

// Serial parser
String lineBuf = "";

// DS18
OneWire oneWire(ONEWIRE_PIN);
DallasTemperature ds18(&oneWire);

// ================= HELPERS =================

float calcPH(float v, float waterTempC) {
  if (isnan(v) || isnan(waterTempC)) return NAN;
  return (-75.0f * v + 33.4f) + (waterTempC - 25.0f) * -0.03f;
}

// ================= WIFI =================

void connectWiFi() {
  Serial.println("[WIFI] Connecting...");
  WiFi.begin(ssid, pass);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\n[WIFI] FAILED (timeout)");
      return;
    }
  }

  Serial.println("\n[WIFI] Connected");
  Serial.print("[WIFI] IP: ");
  Serial.println(WiFi.localIP());
}

// ================= SERVER =================

void sendToServer(float ph) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[SERVER] SKIP: WiFi disconnected");
    connectWiFi();
    return;
  }

  Serial.println("-------- BACKEND UPLOAD --------");

  HTTPClient http;
  String url = String(SERVER_URL) + "/units/" + UNIT_ID + "/sensors";

  Serial.print("[SERVER] URL: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Build JSON using ArduinoJson
  StaticJsonDocument<1024> doc;

  // Reservoir data
  JsonObject reservoir = doc.createNestedObject("reservoir");
  if (!isnan(ph)) reservoir["ph"] = ph;
  if (!isnan(stm_tds)) reservoir["tds"] = stm_tds;
  if (!isnan(stm_turb)) reservoir["turbidity"] = stm_turb;
  if (!isnan(waterTemp)) reservoir["water_temp"] = waterTemp;
  if (stm_water >= 0) reservoir["water_level"] = stm_water;

  // Climate data (8 DHT sensors -> L11, L12, L21, L22, L31, L32, L41, L42)
  JsonObject climate = doc.createNestedObject("climate");
  for (int i = 0; i < 8; i++) {
    String key = getClimateKey(i);
    JsonObject level = climate.createNestedObject(key);
    if (!isnan(dhtTemp[i])) level["temp"] = dhtTemp[i];
    if (!isnan(dhtHumidity[i])) level["humidity"] = (int)dhtHumidity[i];
  }

  String payload;
  serializeJson(doc, payload);

  Serial.print("[SERVER] JSON: ");
  Serial.println(payload);

  Serial.println("[SERVER] Sending POST...");
  int code = http.POST(payload);

  Serial.print("[SERVER] HTTP Response: ");
  Serial.println(code);

  if (code == 200) {
    Serial.println("[SERVER] SUCCESS!");
    Serial.println(http.getString());
  } else if (code > 0) {
    Serial.println("[SERVER] ERROR from server:");
    Serial.println(http.getString());
  } else {
    Serial.print("[SERVER] Connection error: ");
    Serial.println(http.errorToString(code));
  }

  http.end();
  Serial.println("--------------------------------");
}

// ================= DHT =================

// Map index to level/position: 0=L11, 1=L12, 2=L21, 3=L22, 4=L31, 5=L32, 6=L41, 7=L42
String getClimateKey(int idx) {
  int level = (idx / 2) + 1;  // 1,1,2,2,3,3,4,4
  int pos = (idx % 2) + 1;    // 1,2,1,2,1,2,1,2
  return "L" + String(level) + String(pos);
}

void handleDHTSpreadRead() {
  if (millis() - lastDHTRead < DHT_INTERVAL) return;
  lastDHTRead = millis();

  float t = dhts[dhtIndex].readTemperature();
  float h = dhts[dhtIndex].readHumidity();

  dhtTemp[dhtIndex] = isnan(t) ? NAN : t;
  dhtHumidity[dhtIndex] = isnan(h) ? NAN : h;

  Serial.print("[DHT] ");
  Serial.print(getClimateKey(dhtIndex));
  Serial.print(" -> Temp: ");
  Serial.print(isnan(t) ? "NA" : String(t,1));
  Serial.print("C, Humidity: ");
  Serial.println(isnan(h) ? "NA" : String(h,0) + "%");

  dhtIndex++;
  if (dhtIndex >= 8) {
    dhtIndex = 0;
    dhtCycleDone = true;
    Serial.println("[DHT] Full cycle complete");
  }
}

// ================= SETUP =================

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, STM_RX, STM_TX);

  Serial.println("\n========================================");
  Serial.println("   DWC Hydroponic Unit Controller");
  Serial.print("   Unit ID: ");
  Serial.println(UNIT_ID);
  Serial.println("========================================");

  for (int i = 0; i < 8; i++) {
    dhts[i].begin();
    dhtTemp[i] = NAN;
    dhtHumidity[i] = NAN;
  }

  ds18.begin();
  connectWiFi();

  Serial.println("[BOOT] Waiting for STM data...");
  Serial.println();
}

// ================= LOOP =================

void loop() {
  handleDHTSpreadRead();

  while (Serial2.available()) {
    char c = Serial2.read();
    if (c == '\r') continue;

    if (c == '\n') {
      String s = lineBuf;
      lineBuf = "";
      s.trim();

      Serial.print("[STM] ");
      Serial.println(s);

      if (s.startsWith("PH_V=")) stm_ph_v = s.substring(5).toFloat();
      else if (s.startsWith("TURBIDITY")) stm_turb = s.substring(14).toFloat();
      else if (s.startsWith("TDS:")) stm_tds = s.substring(4).toFloat();
      else if (s.startsWith("WATER_LEVEL")) stm_water = s.substring(15).toInt();

      if (s == "---END REPORT---") {
        Serial.println("[STM] End of report received");

        if (!dhtCycleDone) {
          Serial.println("[WAIT] DHT cycle not complete yet");
          return;
        }

        dhtCycleDone = false;

        ds18.requestTemperatures();
        waterTemp = ds18.getTempCByIndex(0);

        float ph = calcPH(stm_ph_v, waterTemp);

        Serial.println("\n========== SENSOR SNAPSHOT ==========");
        Serial.println("--- Reservoir ---");
        Serial.print("  pH:          "); Serial.println(isnan(ph) ? "N/A" : String(ph, 2));
        Serial.print("  Water Temp:  "); Serial.println(isnan(waterTemp) ? "N/A" : String(waterTemp, 1) + " C");
        Serial.print("  TDS:         "); Serial.println(isnan(stm_tds) ? "N/A" : String(stm_tds, 0) + " ppm");
        Serial.print("  Turbidity:   "); Serial.println(isnan(stm_turb) ? "N/A" : String(stm_turb, 1) + " NTU");
        Serial.print("  Water Level: "); Serial.println(stm_water >= 0 ? String(stm_water) + "%" : "N/A");

        Serial.println("--- Climate (8 DHT Sensors) ---");
        for (int i = 0; i < 8; i++) {
          Serial.print("  ");
          Serial.print(getClimateKey(i));
          Serial.print(": ");
          Serial.print(isnan(dhtTemp[i]) ? "N/A" : String(dhtTemp[i], 1) + "C");
          Serial.print(", ");
          Serial.println(isnan(dhtHumidity[i]) ? "N/A" : String((int)dhtHumidity[i]) + "%");
        }
        Serial.println("=====================================");

        sendToServer(ph);
        lastServerSend = millis();
      }
    } else {
      lineBuf += c;
    }
  }

  // Periodic send every 60 seconds (even without STM32 trigger)
  if (millis() - lastServerSend >= SERVER_SEND_INTERVAL) {
    Serial.println("\n[AUTO] Periodic send triggered (no STM32 data)");

    // Read water temperature
    ds18.requestTemperatures();
    waterTemp = ds18.getTempCByIndex(0);

    float ph = calcPH(stm_ph_v, waterTemp);

    Serial.println("========== SENSOR SNAPSHOT ==========");
    Serial.println("--- Reservoir ---");
    Serial.print("  pH:          "); Serial.println(isnan(ph) ? "N/A" : String(ph, 2));
    Serial.print("  Water Temp:  "); Serial.println(isnan(waterTemp) ? "N/A" : String(waterTemp, 1) + " C");
    Serial.print("  TDS:         "); Serial.println(isnan(stm_tds) ? "N/A" : String(stm_tds, 0) + " ppm");
    Serial.print("  Turbidity:   "); Serial.println(isnan(stm_turb) ? "N/A" : String(stm_turb, 1) + " NTU");
    Serial.print("  Water Level: "); Serial.println(stm_water >= 0 ? String(stm_water) + "%" : "N/A");

    Serial.println("--- Climate (8 DHT Sensors) ---");
    for (int i = 0; i < 8; i++) {
      Serial.print("  ");
      Serial.print(getClimateKey(i));
      Serial.print(": ");
      Serial.print(isnan(dhtTemp[i]) ? "N/A" : String(dhtTemp[i], 1) + "C");
      Serial.print(", ");
      Serial.println(isnan(dhtHumidity[i]) ? "N/A" : String((int)dhtHumidity[i]) + "%");
    }
    Serial.println("=====================================");

    sendToServer(ph);
    lastServerSend = millis();
  }
}
