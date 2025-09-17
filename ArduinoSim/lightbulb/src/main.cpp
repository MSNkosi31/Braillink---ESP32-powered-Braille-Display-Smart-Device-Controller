#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const int LED1 = 26;

//=========== MQTT ================

/*=========== MQTT variables ==============
These variables are responsible for connecting the esp32 to the broker, the topics it subs/pubs to and its name to the rest of the network.*/
const char* mqtt_server = "5.tcp.ngrok.io";
const int mqtt_port = 27483;
const char* deviceStatusTopic = "kitchen/Light1_status";
const char* deviceTopic = "kitchen/Light1";
const char* deviceName = "kitchen/Light1";
bool deviceState;

//===============WiFi===============
WiFiClient espClient;
PubSubClient client(espClient);


//============MQTT Messaging=============

void deviceControl(String message){
  if (message.equalsIgnoreCase("ON")) {
      digitalWrite(LED1, HIGH);
      deviceState = true;
      //Serial.println("Light has been turned on");
    }
    else if (message.equalsIgnoreCase("OFF")) {
      digitalWrite(LED1, LOW);
      deviceState = false;
      //Serial.println("Light has been turned off");
    }
}

void statusCheck(){
  if(deviceState == true){
    client.publish(deviceStatusTopic, "ON");
  }
  else if(deviceState == false){
    client.publish(deviceStatusTopic, "OFF");
  }
}
 
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
    deviceControl(messageTemp);
  }

  if (String(topic) == deviceStatusTopic && messageTemp.equalsIgnoreCase("check")) {
    statusCheck();
  }
}
// Code to reconnect the esp32 to the broker, subscribe to all relative topics and publish that it is on and connected, all automatically
void reconnect() {
  while(!client.connected()) {
    if(client.connect(deviceName)) {
      client.subscribe(deviceTopic);
      client.subscribe(deviceStatusTopic);
      Serial.println("MQTT Connected");
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

  deviceState = false;

  Serial.print("Connecting to WiFi hi");
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
