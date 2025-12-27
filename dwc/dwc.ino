/* ESP32 Aggregator (UART Serial)
   - Receives STM data over UART SERIAL
   - Reads 8x DHT22 spread over 60s (NO blocking)
   - Reads DS18B20
   - temperature-compensated pH (using WATER temperature) Finally works
   - Pushes JSON to backend server IDK IF THIS WORKS YET OR NO :(
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// ---------- WiFi ----------
const char* ssid = "EXT_2.4G";
const char* pass = "HieRiih7sai8Choo";

// ---------- Backend ----------
const char* SERVER_URL = "http://98.94.183.238/api";
const char* UNIT_ID = "DWC2";

// ---------- DHT ----------
#define DHTTYPE DHT22
const int DHT_PINS[8] = {16,17,22,23,32,33,25,26};
DHT dhts[8] = {
  DHT(16,DHTTYPE), DHT(17,DHTTYPE), DHT(22,DHTTYPE), DHT(23,DHTTYPE),
  DHT(32,DHTTYPE), DHT(33,DHTTYPE), DHT(25,DHTTYPE), DHT(26,DHTTYPE)
};
float dhtTemp[8];

// ---- DHT scheduler ----
unsigned long lastDHTRead = 0;
const unsigned long DHT_INTERVAL = 7500;
int dhtIndex = 0;
bool dhtCycleDone = false;

// ---------- DS18B20 ----------
#define ONEWIRE_PIN 27
OneWire oneWire(ONEWIRE_PIN);
DallasTemperature ds18(&oneWire);
float waterTemp = NAN;

// ---------- STM values ----------
float stm_ph_v = NAN;
float stm_turb = NAN;
float stm_tds  = NAN;
float stm_flow = NAN;
float stm_lux  = NAN;
long  stm_water = -1;

// ---------- Serial parsing ----------
String lineBuf = "";
unsigned long lastCmdPoll = 0;
const unsigned long CMD_INTERVAL = 10000; // every 10 sec

// ---------- Helpers ----------
float avgTempAir() {
  float s = 0; int c = 0;
  for (int i = 0; i < 8; i++) {
    if (!isnan(dhtTemp[i])) { s += dhtTemp[i]; c++; }
  }
  return c ? s / c : NAN;
}

// pH with water temperature compensation
float calcPH(float v, float waterTempC) { //PLZ DONT MESS WITH THIS somehow works ab :)
  if (isnan(v) || isnan(waterTempC)) return NAN;

  const float PH_SLOPE  = -21.4f;
  const float PH_OFFSET_25C = 14.7f;

  float tempCorr = (waterTempC - 25.0f) * -0.03f;
  return (PH_SLOPE * v + PH_OFFSET_25C) + tempCorr;
}

// ---------- JSON wala part to send deta ----------
void sendToServer(float ph) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping POST");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/units/" + UNIT_ID + "/sensors";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  String payload = "{";

  payload += "\"reservoir\":{";
  payload += "\"ph\":" + String(ph,2) + ",";
  payload += "\"tds\":" + String(stm_tds,1) + ",";
  payload += "\"turbidity\":" + String(stm_turb,2) + ",";
  payload += "\"water_temp\":" + String(waterTemp,2) + ",";
  payload += "\"water_level\":" + String(stm_water);
  payload += "},";

  payload += "\"climate\":{";
  for (int i = 0; i < 8; i++) {
    payload += "\"level_" + String(i+1) + "\":{";
    payload += "\"temp\":";
    payload += isnan(dhtTemp[i]) ? "null" : String(dhtTemp[i],2);
    payload += "}";
    if (i < 7) payload += ",";
  }
  payload += "}";

  payload += "}";

  int code = http.POST(payload);
  Serial.print("POST -> ");
  Serial.println(code);

  if (code > 0) {
    Serial.println(http.getString());
  }

  http.end();
}

// ---------- DHT spread reader ----------
void handleDHTSpreadRead() { //delays dht read over 60 sec to remove errors
  unsigned long now = millis();
  if (now - lastDHTRead < DHT_INTERVAL) return;

  lastDHTRead = now;

  pinMode(DHT_PINS[dhtIndex], OUTPUT);
  digitalWrite(DHT_PINS[dhtIndex], HIGH);
  delay(5);
  pinMode(DHT_PINS[dhtIndex], INPUT);
  delay(5);

  float t = dhts[dhtIndex].readTemperature();
  dhtTemp[dhtIndex] = isnan(t) ? NAN : t;

  dhtIndex++;
  if (dhtIndex >= 8) {
    dhtIndex = 0;
    dhtCycleDone = true;
  }
  delay(100);
}
// Track last known relay states to only send on change
bool lastLights = false;
bool lastFans = false;
bool lastPump = false;

void fetchRelayCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_URL) + "/units/" + UNIT_ID + "/relays";

  http.begin(url);
  http.setTimeout(8000);

  int code = http.GET();
  if (code != 200) {
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  // Backend returns: {"relays": {"lights": "ON", "fans": "OFF", "pump": "OFF"}}
  bool newLights = (payload.indexOf("\"lights\":\"ON\"") > 0 || payload.indexOf("\"lights\": \"ON\"") > 0);
  bool newFans = (payload.indexOf("\"fans\":\"ON\"") > 0 || payload.indexOf("\"fans\": \"ON\"") > 0);
  bool newPump = (payload.indexOf("\"pump\":\"ON\"") > 0 || payload.indexOf("\"pump\": \"ON\"") > 0);

  // Only send command when state changes
  if (newLights != lastLights) {
    Serial.print("RELAY LIGHT ");
    Serial.println(newLights ? "1" : "0");
    lastLights = newLights;
  }
  if (newFans != lastFans) {
    Serial.print("RELAY FAN ");
    Serial.println(newFans ? "1" : "0");
    lastFans = newFans;
  }
  if (newPump != lastPump) {
    Serial.print("RELAY PUMP ");
    Serial.println(newPump ? "1" : "0");
    lastPump = newPump;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("ESP32 Aggregator starting...");

  for (int i = 0; i < 8; i++) {
    dhts[i].begin();
    dhtTemp[i] = NAN;
  }

  ds18.begin();

  WiFi.begin(ssid, pass);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  handleDHTSpreadRead();
if (millis() - lastCmdPoll > CMD_INTERVAL) {
  lastCmdPoll = millis();
  fetchRelayCommands();
}
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\r') continue;

    if (c == '\n') {
      String s = lineBuf;
      lineBuf = "";
      s.trim();

      if (s.startsWith("PH_V=")) stm_ph_v = s.substring(5).toFloat();
      else if (s.startsWith("TURBIDITY")) stm_turb = s.substring(14).toFloat();
      else if (s.startsWith("TDS:")) stm_tds = s.substring(4).toFloat();
      else if (s.startsWith("FLOW")) stm_flow = s.substring(18).toFloat();
      else if (s.startsWith("LIGHT")) stm_lux = s.substring(10).toFloat();
      else if (s.startsWith("WATER_LEVEL")) stm_water = s.substring(15).toInt();

      if (s == "---END REPORT---" && dhtCycleDone) {
        dhtCycleDone = false;

        ds18.requestTemperatures();
        waterTemp = ds18.getTempCByIndex(0);

        float ph = calcPH(stm_ph_v, waterTemp);

        Serial.println("\n=== SNAPSHOT ===");
        Serial.print("pH: "); Serial.println(ph,2);
        Serial.print("Water Temp: "); Serial.println(waterTemp,2);
        Serial.println("Sending to server...");
        Serial.println("=== END ===");

        sendToServer(ph);
      }
    } else {
      lineBuf += c;
    }
  }
}