#include <MD_MAX72xx.h>
#include <SPI.h>
#include <WiFi.h>
#include <map>
#include <string>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>

// =================== WiFi CONFIG ===================
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// =================== MQTT SERVER ===================
const char* mqttServer = "10.tcp.eu.ngrok.io";
const int mqttPort = 25115;

WiFiClient espClient;
PubSubClient client(espClient);

const char* REQ_TOPIC = "deviceList";
const char* RESP_TOPIC = "deviceList/response";
const char* CONTROL_TOPIC = "device/control";

// =================== MATRIX DISPLAY CONFIG ===================
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 8
#define CLK_PIN 18
#define DATA_PIN 23
#define CS_PIN 21

MD_MAX72XX matrix = MD_MAX72XX(MD_MAX72XX::PAROLA_HW, CS_PIN, MAX_DEVICES);

//=================== LCD SCREEN===================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// =================== BUTTONS ===================
#define ENTER_PIN 12
#define BACK_PIN 32
#define NEXT_PIN 14
#define PREV_PIN 27

// =================== ROTARY DIAL ===============
#define ENCODER_CLK 2
#define ENCODER_DT  4

// =================== BUZZER ===================
#define BUZZ_PIN 22

// =================== PROX SENSOR ===================
#define PROX_PIN 15

// =================== BRAILLE MAPPING ===================
std::map<char, String> letters = {
  {'a', "100000"},{'b', "110000"},{'c', "100100"},{'d', "100110"},
  {'e', "100010"},{'f', "110100"},{'g', "110110"},{'h', "110010"},
  {'i', "010100"},{'j', "010110"},{'k', "101000"},{'l', "111000"},
  {'m', "101100"},{'n', "101110"},{'o', "101010"},{'p', "111100"},
  {'q', "111110"},{'r', "111010"},{'s', "011100"},{'t', "011110"},
  {'u', "101001"},{'v', "111001"},{'w', "010111"},{'x', "101101"},
  {'y', "111101"},{'z', "101011"},{'#', "001111"},{'0', "010110"},
  {'1', "100000"},{'2', "110000"},{'3', "100100"},{'4', "100110"},
  {'5', "100010"},{'6', "110100"},{'8', "110010"},{'9', "010100"}
};

// =================== GLOBAL VARIABLES ===================
String binLetter[13] = {"000000"};
int currentMainOption = 0;
int currentSubOption = 0;
bool welcomeShown = false;
bool inSubMenu = false;
bool viewingStatus = false;  // NEW: track when user is viewing device status
String mainMenuDynamic[10];
int mainMenuCount = 0;
String newSubMenu[10];
int subMenuCount = 0;
String rawDeviceList = "";
bool menuReady = false;
std::map<String, bool> deviceStates;

int lastClk = HIGH;
unsigned long lastEncoderTime = 0;
const unsigned long encoderDebounce = 120;

unsigned long lastActiveTime = 0;
const unsigned long activeDuration = 10000;

unsigned long lastMqttAttempt = 0;
const unsigned long mqttRetryInterval = 5000;

bool lastEnterState = LOW;
bool lastBackState  = LOW;

bool buzzing = false;
unsigned long buzzEndTime = 0;

// =================== FUNCTION DECLARATIONS ===================
void setupWiFi();
void connectMQTT();
void loopMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void updateMenu(int idx, String selectedMenu[], int menuCount);
void getDevices(int idxMain);
void convertWord(String word, String binLetter[]);
void displayBrailleFormat(String cells[], String menuOption);
void clearBin();
void showWelcomeMessage();
void playBuzz(int freq = 1000, int duration = 200);
void doAction();
void showBrailleStatus(bool state, String premsg);
// =================== SETUP ===================
void setup() {
  Serial.begin(9600);
  matrix.begin();
  matrix.control(MD_MAX72XX::INTENSITY, 5);
  matrix.clear();

  pinMode(NEXT_PIN, INPUT_PULLDOWN);
  pinMode(PREV_PIN, INPUT_PULLDOWN);
  pinMode(ENTER_PIN, INPUT_PULLDOWN);
  pinMode(BACK_PIN, INPUT_PULLDOWN);
  pinMode(BUZZ_PIN, OUTPUT);
  pinMode(PROX_PIN, INPUT);
  pinMode(ENCODER_CLK, INPUT);
  pinMode(ENCODER_DT, INPUT);

  Wire.begin(16, 17);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");

  setupWiFi();
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);
  connectMQTT();

  welcomeShown = true;
  lastActiveTime = millis() - activeDuration;
  clearBin();
  for (int i=0;i<10;i++) newSubMenu[i] = "";
}

// =================== LOOP ===================
void loop() {
  loopMQTT();

  if (!menuReady) {
    lcd.setCursor(0, 0);
    lcd.print("Waiting for menu ");
    delay(200);
    return;
  }

  int newClk = digitalRead(ENCODER_CLK);
  int dtVal  = digitalRead(ENCODER_DT);
  unsigned long now = millis();

  if (newClk != lastClk && newClk == LOW && now - lastEncoderTime > encoderDebounce) {
    lastEncoderTime = now;

    if (!inSubMenu) {
      if (dtVal != newClk) currentMainOption++;
      else currentMainOption--;
      if (currentMainOption >= mainMenuCount) currentMainOption = 0;
      if (currentMainOption < 0) currentMainOption = mainMenuCount - 1;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      playBuzz(831, 80);
    } else {
      viewingStatus = false; // reset if scrolling
      if (dtVal != newClk) currentSubOption++;
      else currentSubOption--;
      if (currentSubOption >= subMenuCount) currentSubOption = 0;
      if (currentSubOption < 0) currentSubOption = subMenuCount - 1;
      updateMenu(currentSubOption, newSubMenu, subMenuCount);
      playBuzz(659, 80);
    }
  }
  lastClk = newClk;

  bool enterState = digitalRead(ENTER_PIN);
  bool backState  = digitalRead(BACK_PIN);

  // --- ENTER BUTTON HANDLING ---
  if (enterState == HIGH && lastEnterState == LOW) {
    if (!inSubMenu) {
      inSubMenu = true;
      viewingStatus = false;
      currentSubOption = 0;
      getDevices(currentMainOption);
      if (subMenuCount > 0) updateMenu(currentSubOption, newSubMenu, subMenuCount);
      playBuzz(523, 100);
    } else {
        if (!viewingStatus) {
          // First press shows status
          viewingStatus = true;
          String room = mainMenuDynamic[currentMainOption];
          int dash = room.indexOf('-');
          if (dash != -1) room = room.substring(0, dash);
          String devTopic = room + "/" + newSubMenu[currentSubOption];
          bool state = deviceStates[devTopic];

          // --- LCD update ---
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Device:");
          lcd.print(newSubMenu[currentSubOption]);
          lcd.setCursor(0, 1);
          lcd.print("Status: ");
          lcd.print(state ? "ON " : "OFF");

          // --- Braille update (NEW) ---
         showBrailleStatus(state, "Is ");

          Serial.println("Viewing status of: " + devTopic + " = " + (state ? "ON" : "OFF"));
          playBuzz(440, 100);
        }else {
            // Second press toggles
            doAction();
            viewingStatus = false;
            playBuzz(300, 120);
          }
      }
  }

  // --- BACK BUTTON HANDLING ---
  if (backState == HIGH && lastBackState == LOW) {
    if (inSubMenu) {
      inSubMenu = false;
      viewingStatus = false;
      currentSubOption = 0;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      playBuzz(250, 140);
    }
  }

  lastEnterState = enterState;
  lastBackState = backState;

  if (buzzing && millis() >= buzzEndTime) {
    noTone(BUZZ_PIN);
    buzzing = false;
  }
}

// =================== FUNCTIONS ===================
void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected!");
}

void doAction() {
  String roomName = mainMenuDynamic[currentMainOption];
  int dash = roomName.indexOf('-');
  if (dash != -1) roomName = roomName.substring(0, dash);
  String deviceName = newSubMenu[currentSubOption];
  String deviceTopic = roomName + "/" + deviceName;
  String statusTopic = deviceTopic + "_status";

  bool currentState = deviceStates[deviceTopic];
  String action = currentState ? "OFF" : "ON";

  if (client.connected()) {
    client.publish(deviceTopic.c_str(), action.c_str());
  }

  deviceStates[deviceTopic] = !currentState;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Toggled:");
  lcd.setCursor(0, 1);
  lcd.print(deviceName + " -> " + action);

  showBrailleStatus(!currentState, "Turning ");
}

// =================== MQTT CALLBACK ===================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  rawDeviceList = "";
  for (unsigned int i = 0; i < length; i++) rawDeviceList += (char)payload[i];
  Serial.println("MQTT received topic:");
  Serial.println(topic);
  Serial.println("payload: " + rawDeviceList);

  // Handle status updates
  if (String(topic).endsWith("_status")) {
    String device = String(topic).substring(0, String(topic).lastIndexOf("_status"));
    String msg = rawDeviceList;
    bool isOn = (msg == "ON");
    deviceStates[device] = isOn;
    Serial.println("Updated state for " + device + ": " + msg);

    // If viewing same device, refresh
    if (inSubMenu && viewingStatus) {
      String currentRoom = mainMenuDynamic[currentMainOption];
      int dash = currentRoom.indexOf('-');
      if (dash != -1) currentRoom = currentRoom.substring(0, dash);
      String currentDevice = currentRoom + "/" + newSubMenu[currentSubOption];
      if (device == currentDevice) {
        lcd.setCursor(0, 1);
        lcd.print("Status: ");
        lcd.print(isOn ? "ON " : "OFF");
      }
    }
  }

  // Handle menu data
  if (String(topic) == RESP_TOPIC) {
    mainMenuCount = 0;
    int start = 0;
    while (start < rawDeviceList.length() && mainMenuCount < 10) {
      int comma = rawDeviceList.indexOf(',', start);
      String item = (comma == -1) ? rawDeviceList.substring(start) : rawDeviceList.substring(start, comma);
      item.trim();
      if (item.length() > 0) {
        mainMenuDynamic[mainMenuCount++] = item;
      }
      if (comma == -1) break;
      start = comma + 1;
    }

    menuReady = true;

    // Subscribe to all status topics
    for (int i = 0; i < mainMenuCount; i++) {
      String entry = mainMenuDynamic[i];
      int dashPos = entry.indexOf('-');
      if (dashPos != -1) {
        String room = entry.substring(0, dashPos);
        String devicesStr = entry.substring(dashPos + 1);
        int start = 0;
        while (start < devicesStr.length()) {
          int semi = devicesStr.indexOf(';', start);
          String dev = (semi == -1) ? devicesStr.substring(start) : devicesStr.substring(start, semi);
          dev.trim();
          if (dev.length() > 0) {
            String topic = room + "/" + dev + "_status";
            client.subscribe(topic.c_str());
            deviceStates[room + "/" + dev] = false;
            Serial.println("Subscribed globally to: " + topic);
          }
          if (semi == -1) break;
          start = semi + 1;
        }
      }
    }

    if (!inSubMenu) updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
  }
}

void connectMQTT() {
  if (client.connected()) return;
  unsigned long now = millis();
  if (now - lastMqttAttempt < mqttRetryInterval) return;
  lastMqttAttempt = now;

  Serial.print("Connecting to MQTT...");
  if (client.connect("ESP32BrailleClient")) {
    Serial.println("Connected!");
    client.subscribe(RESP_TOPIC);
    client.publish(REQ_TOPIC, "");
  } else {
    Serial.print("Failed, rc=");
    Serial.println(client.state());
    delay(2000);
  }
}

void loopMQTT() {
  if (!client.connected()) connectMQTT();
  client.loop();
}

void getDevices(int idxMain) {
  if (idxMain < 0 || idxMain >= mainMenuCount) {
    subMenuCount = 0;
    return;
  }
  String menuName = mainMenuDynamic[idxMain];
  int dashPos = menuName.indexOf('-');
  if (dashPos == -1) {
    subMenuCount = 0;
    return;
  }

  String devicesStr = menuName.substring(dashPos + 1);
  subMenuCount = 0;
  int start = 0;
  while (start < devicesStr.length() && subMenuCount < 10) {
    int semi = devicesStr.indexOf(';', start);
    String dev = (semi == -1) ? devicesStr.substring(start) : devicesStr.substring(start, semi);
    dev.trim();
    if (dev.length() > 0) newSubMenu[subMenuCount++] = dev;
    if (semi == -1) break;
    start = semi + 1;
  }
}

void updateMenu(int idx, String selectedMenu[], int menuCount) {
  if (menuCount <= 0) return;
  matrix.clear();
  clearBin();

  String displayText = selectedMenu[idx];
  if (!inSubMenu) {
    int dash = displayText.indexOf('-');
    if (dash != -1) displayText = displayText.substring(0, dash);
  }

  convertWord(selectedMenu[idx], binLetter);

  lcd.clear();
  if (!inSubMenu) {
    lcd.setCursor(0, 0);
    lcd.print("Room:");
    lcd.setCursor(0, 1);
    lcd.print(displayText);
  } else {
    lcd.setCursor(0, 0);
    lcd.print("Device:");
    lcd.print(displayText);
    lcd.setCursor(0, 1);
    lcd.print("Press ENTER");
  }
}

void playBuzz(int freq , int duration) {
  tone(BUZZ_PIN, freq);
  delay(duration);
  noTone(BUZZ_PIN);
}


void showWelcomeMessage() {
  clearBin();
  String welcome = "welcome User";
  convertWord(welcome, binLetter);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Welcome");
  lcd.setCursor(0, 1);
  lcd.print("User");
}

void clearBin() {
  for (int i = 0; i < 13; i++) binLetter[i] = "000000";
}

void showBrailleStatus(bool state, String premsg) {
  matrix.clear();
  clearBin();
  if (state) convertWord(premsg+"ON", binLetter);
  else convertWord(premsg+"OFF", binLetter);
}

void convertWord(String word, String binLetter[]) {
  word.toLowerCase();
  for (int i = 0; i < 13; i++) binLetter[i] = "000000";
  
  for (int i = 0; i < word.length() && i < 13; i++) {
    if (word[i] == '-') break;
    if (word[i] == ' ') continue;
    auto it = letters.find(word[i]);
    binLetter[i] = (it != letters.end()) ? it->second : "000000";
  }
  displayBrailleFormat(binLetter, word);
}

void displayBrailleFormat(String cells[], String menuOption) {
  int possibleCells = MAX_DEVICES * 2;
  int cellIdx = 0;
  int maxChars = menuOption.length();
  for (int i = possibleCells; i > 0; i--) {
    matrix.setPoint(1, (i*possibleCells/4)-2-(possibleCells-i), cells[cellIdx][0] - '0');
    matrix.setPoint(3, (i*possibleCells/4)-2-(possibleCells-i), cells[cellIdx][1] - '0');
    matrix.setPoint(5, (i*possibleCells/4)-2-(possibleCells-i), cells[cellIdx][2] - '0');
    matrix.setPoint(1, (i*possibleCells/4)-4-(possibleCells-i), cells[cellIdx][3] - '0');
    matrix.setPoint(3, (i*possibleCells/4)-4-(possibleCells-i), cells[cellIdx][4] - '0');
    matrix.setPoint(5, (i*possibleCells/4)-4-(possibleCells-i), cells[cellIdx][5] - '0');
    cellIdx++;
    if (cellIdx > maxChars) break;
  }
}
