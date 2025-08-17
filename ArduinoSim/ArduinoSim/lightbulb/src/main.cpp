#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const int LED1 = 26;

const char* mqtt_server = "2.tcp.eu.ngrok.io";
const int mqtt_port = 13520;
const char* deviceStatusTopic = "kitchen/light_status";
const char* deviceTopic = "kitchen/light";
const char* deviceName = "ESP32Lightbulb";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String messageTemp;
  for (unsigned int i = 0; i < length; i++) {
    messageTemp += (char)message[i];
  }
  Serial.print("Message : ");
  Serial.println(messageTemp);

  if (String(topic) == deviceTopic) {
    if (messageTemp.equalsIgnoreCase("ON")) {
      digitalWrite(LED1, HIGH);
      Serial.println("Light has been turned on");
      delay(2000); // blocks execution, consider removing later
    }
    else if (messageTemp.equalsIgnoreCase("OFF")) {
      digitalWrite(LED1, LOW);
      Serial.println("Light has been turned off");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceName)) {
      //Serial.print("MQTT state: ");
      //Serial.println(client.state());
      client.subscribe(deviceStatusTopic);
      client.subscribe(deviceTopic); //make a list of all topics then loop through
      //Serial.println("Subscribed to: " + String(mqtt_topic));
      // Publish once at connection
      client.publish(deviceStatusTopic, "On and Connected");// can be moved to specific methods that change a devices status
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  //testing the led
  pinMode(LED1, OUTPUT);
  digitalWrite(LED1, HIGH);
  delay(2000);
  digitalWrite(LED1, LOW);

  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
 if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
