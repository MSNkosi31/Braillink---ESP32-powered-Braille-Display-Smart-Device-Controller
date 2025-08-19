#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const int LED1 = 26;

// If your LED anode is on GPIO and cathode to GND -> active-high (false)
// If your LED anode is on 3V3 and cathode goes to GPIO -> active-low (true)
const bool LED_ACTIVE_LOW = true;   // <-- set this to match your wiring

const char* mqtt_server = "5.tcp.eu.ngrok.io";
const int   mqtt_port   = 16653 ;

const char* deviceTopic       = "kitchen/light";
const char* deviceStatusTopic = "kitchen/light_status";
const char* deviceName        = "ESP32Lightbulb";

WiFiClient espClient;
PubSubClient client(espClient);

void publishStatus(const char* s) {
  client.publish(deviceStatusTopic, s, true);
  Serial.print("Status -> "); Serial.println(s);
}

void setLed(bool on) {
  // Map ON/OFF to the correct logic level
  int level = LED_ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW);
  digitalWrite(LED1, level);
  publishStatus(on ? "ON" : "OFF");
}

void callback(char* topic, byte* message, unsigned int length) {
  String payload;
  for (unsigned int i = 0; i < length; i++) payload += (char)message[i];
  payload.trim();

  Serial.print("RX ["); Serial.print(topic); Serial.print("] "); Serial.println(payload);

  if (String(topic) == deviceTopic) {
    if (payload.equalsIgnoreCase("ON"))       setLed(true);
    else if (payload.equalsIgnoreCase("OFF")) setLed(false);
    else                                      Serial.println("Unknown command");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("MQTT connect… ");
    if (client.connect(deviceName)) {
      Serial.println("ok");
      client.subscribe(deviceTopic);
      setLed(digitalRead(LED1) == (LED_ACTIVE_LOW ? LOW : HIGH)); // publish current state
    } else {
      Serial.print("failed rc="); Serial.println(client.state());
      delay(1500);
    }
  }
}

void setup() {
  pinMode(26, OUTPUT);          // same pin as in the diagram
digitalWrite(26, LOW);  delay(300);
digitalWrite(26, HIGH); delay(1000);   // LED should turn ON here
digitalWrite(26, LOW);  delay(300);

  Serial.begin(115200);
  pinMode(LED1, OUTPUT);
  // Start OFF
  digitalWrite(LED1, LED_ACTIVE_LOW ? HIGH : LOW);

  Serial.print("WiFi…");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print('.'); }
  Serial.print(" connected. IP="); Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
}
