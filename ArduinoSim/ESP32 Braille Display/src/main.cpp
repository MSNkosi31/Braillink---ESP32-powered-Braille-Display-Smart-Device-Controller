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
const char* mqttServer = "5.tcp.eu.ngrok.io"; //make sure it's the correct server address and that it's not expired.
const int mqttPort = 12163; //make sure it's the correct port address and that it's not expired.

WiFiClient espClient;
PubSubClient client(espClient);

const char* REQ_TOPIC = "deviceList";
const char* RESP_TOPIC = "deviceList/response";
const char* CONTROL_TOPIC = "device/control"; // topic to publish payload control messages. 


// =================== MATRIX DISPLAY CONFIG ===================
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 8
#define CLK_PIN 18
#define DATA_PIN 23
#define CS_PIN 21

MD_MAX72XX matrix = MD_MAX72XX(MD_MAX72XX::PAROLA_HW, CS_PIN, MAX_DEVICES); // DATA_PIN, CLK_PIN,

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
  {'a', "100000"},
  {'b', "110000"},
  {'c', "100100"},
  {'d', "100110"},
  {'e', "100010"},
  {'f', "110100"},
  {'g', "110110"},
  {'h', "110010"},
  {'i', "010100"},
  {'j', "010110"},
  {'k', "101000"},
  {'l', "111000"},
  {'m', "101100"},
  {'n', "101110"},
  {'o', "101010"},
  {'p', "111100"},
  {'q', "111110"},
  {'r', "111010"},
  {'s', "011100"},
  {'t', "011110"},
  {'u', "101001"},
  {'v', "111001"},
  {'w', "010111"},
  {'x', "101101"},
  {'y', "111101"},
  {'z', "101011"},
  {'#', "001111"},
  {'0', "010110"},
  {'1', "100000"},
  {'2', "110000"},
  {'3', "100100"},
  {'4', "100110"},
  {'5', "100010"},
  {'6', "110100"},
  {'8', "110010"},
  {'9', "010100"}};
  // =================== GLOBAL VARIABLES ===================
  
  String binLetter [13] = {"000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000"};//Sets all leds off
  // int menuOption = 0;
  int currentMainOption = 0;
  int currentSubOption = 0;
  bool welcomeShown = false;
  bool inSubMenu = false;
  String mainMenuDynamic[10]; // max 10 items
  int mainMenuCount = 0;
  const int MAX_ROOMS = 10;
  String newSubMenu[MAX_ROOMS];  // MAX amount of devices
  int subMenuCount = 0;   // how many devices are in newSubMenu
  bool wakeup = false;
  bool AllWake = false;
  
  int lastClk = HIGH;
  unsigned long lastActiveTime = 0;
  const unsigned long activeDuration = 10000; // 60 seconds and yes
  bool shownGoodbyeMsg = false;
  String rawDeviceList = "";   // raw payload from MQTT
  bool menuReady = false;

  // MQTT reconnect timing (non-blocking-ish)
  unsigned long lastMqttAttempt = 0;
  const unsigned long mqttRetryInterval = 5000; // ms


// =================== FUNCTION DECLARATIONS ===================
void setupWiFi(); // Connects to WiFi using the configured SSID and password
void connectMQTT(); // Connects to MQTT server and subscribes/publishes topics
void loopMQTT(); // Processes MQTT messages in the loop
void mqttCallback(char* topic, byte* payload, unsigned int length); // incoming MQTT handler

void updateMenu(int idx, String selectedMenu[], int menuCount); // Updates the menu selection, wraps index, updates LED matrix and LCD
void getDevices(int idxMain); // Extracts devices from a room entry in mainMenuDynamic into newSubMenu array
void convertWord(String word, String binLetter[]); // Converts a word into binary strings corresponding to Braille cells
void displayBrailleFormat(String cells[], String menuOption); // Displays Braille cells on the LED matrix using the cells array
void clearBin(); // Clears the binLetter array (all LEDs off)
void showWelcomeMessage(); // Displays a welcome message on matrix and LCD
void playBuzz(int freq = 1000, int duration = 200); // Plays a buzzer tone with specified frequency and duration
int countCharOccurrences(const String& inputString, char targetChar); // Counts how many times a character appears in a string


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

  Wire.begin(16, 17); // SDA = 16, SCL = 17
  lcd.init();         // Initialize LCD
  lcd.backlight();    // Turn on backlight
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


void loop() {
  // Maintain MQTT connection and process messages
  loopMQTT();

  // If we haven't received a menu yet, do not proceed with full UI.
  if (!menuReady) {
    // Optionally show a default / loading message:
    lcd.setCursor(0, 0);
    lcd.print("Waiting for menu ");
    delay(200); // small delay to avoid tight loop
    return;
  }

  // Make sure mainMenuCount sane
  if (mainMenuCount <= 0) return;

  // Show menu first time
  static bool menuDisplayed = false;
  if (!menuDisplayed) {
    currentMainOption = 0;
    updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    menuDisplayed = true;
  }

  // Rotary/encoder handling
  bool nextTurned = false, prevTurned = false;
  int newClk = digitalRead(ENCODER_CLK);
  if (newClk != lastClk) {
    lastClk = newClk;
    int dtValue = digitalRead(ENCODER_DT);
    // Simple quadrature handling: detect direction on falling edge of CLK
    if (newClk == LOW) {
      if (dtValue == HIGH) nextTurned = true;
      else prevTurned = true;
    }
  }

  bool enterPressed = digitalRead(ENTER_PIN) == HIGH;
  bool backPressed  = digitalRead(BACK_PIN) == HIGH;
  bool motionDetected = digitalRead(PROX_PIN) == HIGH;

  bool activityAll = motionDetected || nextTurned || prevTurned || enterPressed || backPressed;
  bool isActive = (millis() - lastActiveTime) < activeDuration;
  if (!isActive && activityAll) {
    // wake up
    showWelcome:
    ;
    if (!welcomeShown) {
      showWelcomeMessage();
      welcomeShown = true;
      delay(300);
    }
    lastActiveTime = millis();
  }

  if (isActive && activityAll) lastActiveTime = millis();

  // navigation + selection
  if (nextTurned) {
    playBuzz(831, 80);
    if (inSubMenu) {
      currentSubOption++;
      if (currentSubOption >= subMenuCount) currentSubOption = 0;
      updateMenu(currentSubOption, newSubMenu, subMenuCount);
    } else {
      currentMainOption++;
      if (currentMainOption >= mainMenuCount) currentMainOption = 0;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    }
  }

  if (prevTurned) {
    playBuzz(659, 80);
    if (inSubMenu) {
      currentSubOption--;
      if (currentSubOption < 0) currentSubOption = subMenuCount - 1;
      updateMenu(currentSubOption, newSubMenu, subMenuCount);
    } else {
      currentMainOption--;
      if (currentMainOption < 0) currentMainOption = mainMenuCount - 1;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
    }
  }

  if (enterPressed) {
    // Debounce-ish: simple delay to not re-trigger too fast
    delay(120);
    if (!inSubMenu) {
      // enter room -> open devices list
      playBuzz(523, 100);
      inSubMenu = true;
      currentSubOption = 0;
      getDevices(currentMainOption); // populate newSubMenu / subMenuCount
      if (subMenuCount == 0) {
        // nothing inside room - fallback (stay in main)
        inSubMenu = false;
        playBuzz(300, 120);
      } else {
        updateMenu(currentSubOption, newSubMenu, subMenuCount);
      }
    } else {
      // enter device -> DO ACTION: print + publish control message
      String selectedRoom = mainMenuDynamic[currentMainOption];
      // room stored as "room-dev1;dev2" so extract room name before '-'
      int dash = selectedRoom.indexOf('-');
      String roomName = (dash == -1) ? selectedRoom : selectedRoom.substring(0, dash);
      String deviceName = (currentSubOption >= 0 && currentSubOption < subMenuCount) ? newSubMenu[currentSubOption] : String("");

      Serial.println("Selected device: " + deviceName + " in room: " + roomName);

      // Build payload example: {"room":"kitchen","device":"Oven","action":"toggle"}
      // For simplicity we send a simple CSV style payload; change to JSON if backend expects JSON.
      String payload = roomName + "," + deviceName + ",toggle";
      if (client.connected()) {
        client.publish(CONTROL_TOPIC, payload.c_str());
        playBuzz(880, 120);
      } else {
        Serial.println("MQTT not connected - cannot publish");
        playBuzz(250, 140);
      }
    }
  }

  if (backPressed) {
    // go back from sub-menu to main menu
    if (inSubMenu) {
      playBuzz(523, 80);
      inSubMenu = false;
      currentSubOption = 0;
      updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      delay(120); // simple debounce
    } else {
      // optionally: do nothing or implement exiting UI
    }
  }

  // small loop delay
  delay(10);
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

// =================== MQTT CALLBACK ===================
// Handles incoming MQTT messages and populates mainMenuDynamic
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  rawDeviceList = "";
  for (unsigned int i = 0; i < length; i++) rawDeviceList += (char)payload[i];
  Serial.println("MQTT received topic:");
  Serial.println(topic);
  Serial.println("payload: " + rawDeviceList);

  if (String(topic) == RESP_TOPIC) {
    // parse rooms separated by commas
    mainMenuCount = 0;
    int start = 0;
    while (start < rawDeviceList.length() && mainMenuCount < 10) {
      int comma = rawDeviceList.indexOf(',', start);
      String item;
      if (comma == -1) item = rawDeviceList.substring(start);
      else item = rawDeviceList.substring(start, comma);

      item.trim();
      if (item.length() > 0) {
        mainMenuDynamic[mainMenuCount++] = item;
      }

      if (comma == -1) break;
      start = comma + 1;
    }

    // reset indexes and show first menu item
    currentMainOption = 0;
    inSubMenu = false;
    menuReady = true;
    updateMenu(0, mainMenuDynamic, mainMenuCount);
  }
}

// Try to connect to MQTT broker. Non-blocking caller should call this periodically.
void connectMQTT() {
    if (client.connected()) return;

    unsigned long now = millis();
    if (now - lastMqttAttempt < mqttRetryInterval) return; // too soon to retry
    lastMqttAttempt = now;

    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32BrailleClient")) {
        Serial.println("Connected!");
        client.subscribe(RESP_TOPIC);
        // request list (empty payload) - server is expected to respond on RESP_TOPIC
        client.publish(REQ_TOPIC, "");
    } 
    else {
        Serial.print("Failed, rc=");
        Serial.print(client.state());
        delay(2000);
    }
}

void loopMQTT() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
}

// =================== GET DEVICES ===================
// Fill newSubMenu[] with devices for a given room index.
// The mainMenuDynamic entry is expected like "room-dev1;dev2;dev3".
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
    if (dev.length() > 0) {
      newSubMenu[subMenuCount++] = dev;
    }

    if (semi == -1) break;
    start = semi + 1;
  }

  for (int i = subMenuCount; i < 10; i++) newSubMenu[i] = "";
}

// =================== UPDATE MENU ===================
void updateMenu(int idx, String selectedMenu[], int menuCount) {
  if (menuCount <= 0) return;
  
  // wrap index
  if (idx >= menuCount) idx = 0;
  if (idx < 0) idx = menuCount - 1;

  if (inSubMenu) {
    currentSubOption = idx;
  } else {
    currentMainOption = idx;
  }

  matrix.clear();
  clearBin();

  // Convert label for braille. If this is a room string like "room-dev1;dev2" we display only the room part for braille.
  String displayText = selectedMenu[idx];
  if (!inSubMenu) {
    int dash = displayText.indexOf('-');
    if (dash != -1) displayText = displayText.substring(0, dash);
  }
  
  convertWord(selectedMenu[idx], binLetter);

  String lcdDisplayWord = selectedMenu[idx];
  int dashPos = lcdDisplayWord.indexOf('-');
  if (dashPos != -1) {
    lcdDisplayWord = lcdDisplayWord.substring(0, dashPos);  // show only the room
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Selected:");
  lcd.setCursor(0, 1);
  lcd.print(lcdDisplayWord);
}



void playBuzz(int freq , int duration) {
  tone(BUZZ_PIN, freq);     // Play tone at 'freq' Hz
  delay(duration);          // Wait for 'duration' ms
  noTone(BUZZ_PIN);         // Stop the tone
}

void clearBin()
{
  for (int i = 0; i < 13; i++)
  { // 13 is too hardcoded
    binLetter[i] = "000000";
  }
}

void showWelcomeMessage()
{
  clearBin();
  String welcome = "welcome User"; // welcome message (keep it <= 13 chars)
  convertWord(welcome, binLetter);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Welcome");
  lcd.setCursor(0, 1);
  lcd.print("User");
}


void convertWord(String word, String binLetter[]){//this method converts words into a binary value used to turn certain leds on or off

   // initialize buffer with zeros
  for (int i = 0; i < 13; i++) binLetter[i] = "000000";

  for(int i = 0; i < word.length() && i < 13; i++){
    if (word[i] == '-') break;
    if (word[i] == ' ') continue;

    auto it = letters.find(word[i]);
    if (it != letters.end()) {
        binLetter[i] = it->second;
    } else {
        binLetter[i] = "000000"; // unknown char
    }
  }

  displayBrailleFormat(binLetter, word);

}

void displayBrailleFormat(String cells[], String menuOption) {
  
  //CELLS
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

    if (cellIdx > maxChars) {
      break;
    }
  }

}