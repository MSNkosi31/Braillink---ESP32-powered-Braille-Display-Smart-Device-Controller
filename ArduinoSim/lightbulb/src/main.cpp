#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const int LED1 = 26;

//=========== MQTT ================

/*=========== MQTT variables ==============
These variables are responsible for connecting the esp32 to the broker, the topics it subs/pubs to and its name to the rest of the network.*/
const char* mqtt_server = "2.tcp.eu.ngrok.io";
const int mqtt_port = 17316;
const char* deviceStatusTopic = "kitchen/Light1_status";
const char* deviceTopic = "kitchen/Light1";
const char* deviceName = "kitchen/Light1";

//===============WiFi===============
WiFiClient espClient;
PubSubClient client(espClient);


/*============MQTT Messaging=============
This function is called everytime a message is recieved on the topic the device is subscribed to. It then parses the messege, prints in the serial for testing and then runs code to control the esp32 depending on the message. Everything but the code to control the esp32 funcrions is the exact same for all other devices*/ 
void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String messageTemp;
  for (unsigned int i = 0; i < length; i++) {
    messageTemp += (char)message[i];
  }
  Serial.print("Message : ");
  Serial.println(messageTemp);//the recieved message

//Logic to control the device depending on the message recieved. Changes per device 
  if (String(topic) == deviceTopic) {
    if (messageTemp.equalsIgnoreCase("ON")) {
      digitalWrite(LED1, HIGH);
      //Serial.println("Light has been turned on");
    }
    else if (messageTemp.equalsIgnoreCase("OFF")) {
      digitalWrite(LED1, LOW);
      //Serial.println("Light has been turned off");
    }
  }
}
// Code to reconnect the esp32 to the broker, subscribe to all relatice topics adn publish that it is on and connected, all automatically
void reconnect() {
  while(!client.connected()) {
    if(client.connect(deviceName)) {
      client.subscribe(deviceStatusTopic);
      client.subscribe(deviceTopic);
      client.publish(deviceStatusTopic, "On and Connected");
    }else{
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
  //loops to keep the esp32 connected to the broker
 if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
