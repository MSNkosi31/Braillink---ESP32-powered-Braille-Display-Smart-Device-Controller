#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const int LED1 = 26;

const char* mqtt_server = "6.tcp.eu.ngrok.io";
const int mqtt_port = 11771;
const char* mqtt_main_topic = "esp32/status";
const char* mqtt_led1 = "esp32/led1";
//const char* mqtt_led2 = "esp32/led2";
//const char* mqtt_main_topic = "esp32/status";
//const char* mqtt_main_topic = "esp32/status";


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

  if(messageTemp=="ON"){
    digitalWrite(LED1, HIGH);
    delay(2000);
  }

  if(messageTemp=="OFF"){
    digitalWrite(LED1, LOW);
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client_1234")) {
      client.subscribe(mqtt_main_topic);
      client.subscribe(mqtt_led1); //make a list of all topics then loop through
      //Serial.println("Subscribed to: " + String(mqtt_topic));
      // Publish once at connection
      client.publish(mqtt_main_topic, "On and Connected");// can be moved to specific methods that change a devices status
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void switcher(){

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
