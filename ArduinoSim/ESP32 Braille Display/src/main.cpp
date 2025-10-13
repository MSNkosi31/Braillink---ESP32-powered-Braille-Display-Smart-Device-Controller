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
const char* mqttServer = "5.tcp.ngrok.io";
const int mqttPort = 27483;

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
  {'a', "100000"}, {'b', "110000"}, {'c', "100100"}, {'d', "100110"},
  {'e', "100010"}, {'f', "110100"}, {'g', "110110"}, {'h', "110010"},
  {'i', "010100"}, {'j', "010110"}, {'k', "101000"}, {'l', "111000"},
  {'m', "101100"}, {'n', "101110"}, {'o', "101010"}, {'p', "111100"},
  {'q', "111110"}, {'r', "111010"}, {'s', "011100"}, {'t', "011110"},
  {'u', "101001"}, {'v', "111001"}, {'w', "010111"}, {'x', "101101"},
  {'y', "111101"}, {'z', "101011"}, {'#', "001111"}, {'0', "010110"},
  {'1', "100000"}, {'2', "110000"}, {'3', "100100"}, {'4', "100110"},
  {'5', "100010"}, {'6', "110100"}, {'8', "110010"}, {'9', "010100"}
};

// =================== GLOBAL VARIABLES ===================
String binLetter [13] = {"000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000"};
int currentMainOption = 0;
int currentSubOption = 0;
bool welcomeShown = false;
bool inSubMenu = false;
String mainMenuDynamic[10];
int mainMenuCount = 0;
String newSubMenu[10];
int subMenuCount = 0;
String rawDeviceList = "";
bool menuReady = false;

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

bool isSleeping = false;  // 🟢 ADDED Sleep mode tracking


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

  setupWiFi();
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);
  connectMQTT();

  welcomeShown = true;
  lastActiveTime = millis() - activeDuration;
  clearBin();
  for (int i=0;i<10;i++) newSubMenu[i] = "";

  // 🟢 CHANGED: start in sleep mode
  isSleeping = true;
  lcd.noBacklight();
  lcd.clear();
  matrix.clear();
  Serial.println("🟣 System started in sleep mode, waiting for menu...");
}


void loop() {
  loopMQTT();

  // 🟢 CHANGED: wait for menu to load before waking up
 if (isSleeping && menuReady) {
    isSleeping = false;
    lcd.backlight();
    showWelcomeMessage();   // 🔹 Display "WELCOME USER" on LCD and matrix
    Serial.println("🟢 System woke up - welcome message shown");
    delay(1500);            // show welcome for 1.5 seconds
    lcd.clear();
    // then show menu
    if (!inSubMenu) updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    else updateMenu(currentSubOption, newSubMenu, subMenuCount);
}

 if (isSleeping) return;  // Stay asleep until menu is ready

  int prox = digitalRead(PROX_PIN);
  if (prox == HIGH) lastActiveTime = millis();

  int newClk = digitalRead(ENCODER_CLK);
  int dtVal   = digitalRead(ENCODER_DT);
  unsigned long now = millis();

  if (newClk != lastClk && newClk == LOW && now - lastEncoderTime > encoderDebounce) {
    lastEncoderTime = now;
    lastActiveTime = now;

    if (!inSubMenu) {
      if (dtVal != newClk) currentMainOption++;
      else currentMainOption--;
      if (currentMainOption >= mainMenuCount) currentMainOption = 0;
      if (currentMainOption < 0) currentMainOption = mainMenuCount - 1;
      Serial.println("Main menu moved to: " + mainMenuDynamic[currentMainOption]);
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      playBuzz(831, 80);
    } else {
      if (dtVal != newClk) currentSubOption++;
      else currentSubOption--;
      if (currentSubOption >= subMenuCount) currentSubOption = 0;
      if (currentSubOption < 0) currentSubOption = subMenuCount - 1;
      Serial.println("Sub menu moved to: " + newSubMenu[currentSubOption]);
      updateMenu(currentSubOption, newSubMenu, subMenuCount);
      playBuzz(659, 80);
    }
  }
  lastClk = newClk;

  bool enterState = digitalRead(ENTER_PIN);
  bool backState  = digitalRead(BACK_PIN);

  if (enterState == HIGH && lastEnterState == LOW) {
    lastActiveTime = millis();
    if (!inSubMenu) {
      inSubMenu = true;
      currentSubOption = 0;
      getDevices(currentMainOption);
      if (subMenuCount > 0) updateMenu(currentSubOption, newSubMenu, subMenuCount);
      playBuzz(523, 100);
      Serial.println("Entered room: " + mainMenuDynamic[currentMainOption]);
    } else {
      String roomName = mainMenuDynamic[currentMainOption];
      int dash = roomName.indexOf('-');
      if (dash != -1) roomName = roomName.substring(0, dash);
      String deviceName = newSubMenu[currentSubOption];
      Serial.println("Device action: " + deviceName + " in " + roomName);
      if (client.connected()) client.publish(CONTROL_TOPIC, (roomName + "," + deviceName + ",toggle").c_str());
      playBuzz(300, 120);
    }
  }

  if (backState == HIGH && lastBackState == LOW) {
    lastActiveTime = millis();
    if (inSubMenu) {
      inSubMenu = false;
      currentSubOption = 0;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      playBuzz(250, 140);
      Serial.println("Returned to main menu: " + mainMenuDynamic[currentMainOption]);
    }
  }

  lastEnterState = enterState;
  lastBackState = backState;

  if (buzzing && millis() >= buzzEndTime) {
    noTone(BUZZ_PIN);
    buzzing = false;
  }

  unsigned long nowTime = millis();
  if (!isSleeping && (nowTime - lastActiveTime > activeDuration)) {
    isSleeping = true;
    lcd.noBacklight();
    lcd.clear();
    matrix.clear();
    Serial.println("🟣 System entered sleep mode");
  }

  if (isSleeping && (nowTime - lastActiveTime <= activeDuration)) {
    isSleeping = false;
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Waking up...");
    delay(500);
    lcd.clear();
    if (!inSubMenu) updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    else updateMenu(currentSubOption, newSubMenu, subMenuCount);
    Serial.println("🟢 System woke up");
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

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  rawDeviceList = "";
  for (unsigned int i = 0; i < length; i++) rawDeviceList += (char)payload[i];
  Serial.println("MQTT received topic:");
  Serial.println(topic);
  Serial.println("payload: " + rawDeviceList);

  if (String(topic) == RESP_TOPIC) {
    mainMenuCount = 0;
    int start = 0;
    while (start < rawDeviceList.length() && mainMenuCount < 10) {
      int comma = rawDeviceList.indexOf(',', start);
      String item = (comma == -1) ? rawDeviceList.substring(start) : rawDeviceList.substring(start, comma);
      item.trim();
      if (item.length() > 0) mainMenuDynamic[mainMenuCount++] = item;
      if (comma == -1) break;
      start = comma + 1;
    }

    menuReady = true;

    if (!inSubMenu) updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    else {
      getDevices(currentMainOption);
      if (subMenuCount > 0) updateMenu(currentSubOption, newSubMenu, subMenuCount);
    }
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
    Serial.print(client.state());
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
    String dev;
    if (semi == -1) dev = devicesStr.substring(start);
    else dev = devicesStr.substring(start, semi);

    dev.trim();
    if (dev.length() > 0) newSubMenu[subMenuCount++] = dev;
    if (semi == -1) break;
    start = semi + 1;
  }

  for (int i = subMenuCount; i < 10; i++) newSubMenu[i] = "";
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
  lcd.setCursor(0, 0);
  lcd.print("Selected:");
  lcd.setCursor(0, 1);
  lcd.print(displayText);
}

void playBuzz(int freq , int duration) {
  tone(BUZZ_PIN, freq);
  delay(duration);
  noTone(BUZZ_PIN);
}

void clearBin() {
  for (int i = 0; i < 13; i++) binLetter[i] = "000000";
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

void convertWord(String word, String binLetter[]){
  for (int i = 0; i < 13; i++) binLetter[i] = "000000";

  for(int i = 0; i < word.length() && i < 13; i++){
    if (word[i] == '-') break;
    if (word[i] == ' ') continue;

    auto it = letters.find(word[i]);
    if (it != letters.end()) binLetter[i] = it->second;
    else binLetter[i] = "000000";
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
