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
const char* mqttServer = "0.tcp.eu.ngrok.io";
const int mqttPort = 14668;

WiFiClient espClient;
PubSubClient client(espClient);

const char* REQ_TOPIC = "deviceList";
const char* RESP_TOPIC = "deviceList/response";

bool menuReady = false;
String mainMenuDynamic[10]; // max 10 items
// int mainMenuCount = 0;

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
bool wakeup = false;
bool AllWake = false;
unsigned long lastActiveTime = 0;
const unsigned long activeDuration = 10000; // 60 seconds and yes

String mainMenu[] = {"bedroom-lights1,lights2", "bathroom-gyser", "kitchen-thermostats"};
bool shownGoodbyeMsg = false;
bool inSubMenu = false;
const int MAX_ROOMS = 10;
String newSubMenu[MAX_ROOMS];  // MAX amount of devices
int subMenuCount = 0;   // how many devices are in newSubMenu
int mainMenuCount = sizeof(mainMenuDynamic) / sizeof(mainMenuDynamic[0]); // safe main menu count
int lastClk = HIGH;


// =================== FUNCTION DECLARATIONS ===================
void clearBin();
void convertWord(String word, String binLetter[]);
// void displayBrailleFormat(String c1, String c2, String c3, String c4, String c5, String c6,
//                           String c7, String c8, String c9, String c10, String c11, String c12, String c13);
void showWelcomeMessage();
void playBuzz(int freq = 1000, int duration = 200);
void updateMenu(int idx, String selectedMenu[], int menuCount);
void getDevices(int idxMain);
void displayBrailleFormat(String cells[], String menuOption);
int countCharOccurrences(const String& inputString, char targetChar);
int findRoomIndex(String roomName);
void addRoom(String roomName);
void delRoom(String roomName);
void addDevice(String roomName, String deviceName);
void delDevice(String roomName, String deviceName);
void setupWiFi();
void connectMQTT();
void loopMQTT();


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

  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n Connected!");
  Serial.print(" IP Address: ");
  Serial.println(WiFi.localIP());

  Wire.begin(16, 17); // SDA = 16, SCL = 17
  lcd.init();         // Initialize LCD
  lcd.backlight();    // Turn on backlight
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");

  mqttSetup();
  mqttConnect();

  welcomeShown = true;
  lastActiveTime = millis() - activeDuration;
  setupWiFi();
  connectMQTT();
  matrix.clear();
  matrix.update();
}


void loop() {

  // Only proceed if menu has been received
  //if (!menuReady) return; // wait until menu is ready from MQTT

  loopMQTT();      // <-- add this at the top to process MQTT messages

  if (!menuReady) {
    // TEMP: show default menu while waiting for MQTT
    mainMenuCount = sizeof(mainMenu) / sizeof(mainMenu[0]);
    for (int i = 0; i < mainMenuCount; i++) {
      mainMenuDynamic[i] = mainMenu[i];
    }
    menuReady = true;
  }

  // just safety check
  if (!welcomeShown) return; 

  // Example: update menu to first item when menu is ready
  static bool menuDisplayed = false;
  if (!menuDisplayed) {
    updateMenu(0, mainMenuDynamic, mainMenuCount);
    menuDisplayed = true;
  }
 
  // Rotary dial states
  bool nextTruned = false;
  bool prevTurned = false;

  // Read Rotary Input
  int newClk = digitalRead(ENCODER_CLK);
  if (newClk != lastClk) {
    // There was a change on the CLK pin
    lastClk = newClk;
    int dtValue = digitalRead(ENCODER_DT);
    if (newClk == LOW && dtValue == HIGH) {
      nextTruned = true;
    }
    if (newClk == LOW && dtValue == LOW) {
      prevTurned = true;
    }
  }

  //Read the state of the different pins
  bool enterPressed = digitalRead(ENTER_PIN) == HIGH;
  bool backPressed = digitalRead(BACK_PIN) == HIGH;
  bool motionDetected = digitalRead(PROX_PIN) == HIGH;
 
  bool activityAll = motionDetected || nextTruned || prevTurned || enterPressed || backPressed;
  bool activityButtons = nextTruned || prevTurned || enterPressed || backPressed;
  bool isActive = (millis() - lastActiveTime) < activeDuration;
   
  if (!isActive && activityAll) {
    wakeup = true;
    AllWake = activityAll; // true if button caused wake
  }

  // If waking from OFF
  if (wakeup)
  {
    if (AllWake)
    {
      showWelcomeMessage();
      delay(2000); 
      updateMenu(0, mainMenuDynamic, mainMenuCount);
    }
    lastActiveTime = millis();
    wakeup = false;
    lastActiveTime = millis();
    wakeup = false;
    AllWake = false;
    return;
  }

  // Check if we are within active duration window
  if (isActive)
  {
    if (activityAll)
    {
      lastActiveTime = millis(); // keep alive
    }
    //Serial.println("Display ON (motion/button active)");
    // Handle buttons only if pressed

    if (nextTruned) {
      nextTruned = false;
      playBuzz(831, 100); // 831 = G#5 pitch
      if (inSubMenu) {
        currentSubOption++;
        updateMenu(currentSubOption, newSubMenu, subMenuCount);
      } else {
        currentMainOption++;
        updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      }
    }

    if (prevTurned) {
      prevTurned = false;
      playBuzz(659, 100); // 659 = E5 pitch
      if (inSubMenu) {
        currentSubOption++;
        updateMenu(currentSubOption, newSubMenu, subMenuCount);
      } else {
        currentMainOption--;
        updateMenu(currentMainOption, mainMenuDynamic, mainMenuCount);
      }
    }

    if (enterPressed) {
      if (!inSubMenu) {
        playBuzz(523, 100); // 523 = C5 pitch
        inSubMenu = true;
        currentSubOption = 0;
        getDevices(currentMainOption);
        updateMenu(currentSubOption, newSubMenu, subMenuCount);
      } else if (inSubMenu) { 
        // Do action / send messages
      }
    }

    if (backPressed && inSubMenu) {
      playBuzz(523, 100); // 523 = C5 pitch
      inSubMenu = false;
      currentSubOption = 0;
      updateMenu(currentMainOption, mainMenu, mainMenuCount);
    }

  } 
  else {
    
    if (!shownGoodbyeMsg) {
      //Serial.println("Display OFF (no motion/button for 60 seconds)");
      matrix.clear();
      matrix.update();
    
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Goodbye");
      lcd.setCursor(0,1);
      lcd.print("User");

      shownGoodbyeMsg = true;
    }

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
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  if (String(topic) == RESP_TOPIC) {
    // parse received CSV-like menu, e.g., "bedroom-lights1,lights2,bathroom-gyser"
    mainMenuCount = 0;
    int start = 0;
    while (true) {
      int comma = msg.indexOf(',', start);
      String item;
      if (comma == -1) {
        item = msg.substring(start);
      } else {
        item = msg.substring(start, comma);
      }
      mainMenuDynamic[mainMenuCount++] = item;

      if (comma == -1) break;
      start = comma + 1;
    }
    menuReady = true;
  }
}

void connectMQTT() {
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);

  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32BrailleClient")) {
      Serial.println("Connected!");
      client.subscribe(RESP_TOPIC); // subscribe to response
      client.publish(REQ_TOPIC, ""); // send empty request
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

void loopMQTT() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
}



void updateMenu(int idx, String selectedMenu[], int menuCount) {
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
  convertWord(selectedMenu[idx], binLetter);
  matrix.update();

  String lcdDisplayWord = selectedMenu[idx];
  if (lcdDisplayWord.indexOf('-') != -1) {
    lcdDisplayWord = lcdDisplayWord.substring(0, lcdDisplayWord.indexOf('-'));
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

  matrix.update();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Welcome");
  lcd.setCursor(0, 1);
  lcd.print("User");
}

// void convertWord(String word, String binLetter[]){//this method converts words into a binary value used to turn certain leds on or off
  
//   Serial.println(word);
//   for(int i = 0; i < word.length(); i++){
//     binLetter[i] = letters[word[i]].c_str(); //convert this specific letter to the set binary in the map
//   }

//   String cell1 = binLetter[0];
//   //Serial.println(cell1);// for testing
//   String cell2 = binLetter[1];
//   //Serial.println(cell2);
//   String cell3 = binLetter[2];
//   //Serial.println(cell3);
//   String cell4 = binLetter[3];
//   //Serial.println(cell4);
//   String cell5 = binLetter[4];
//   //Serial.println(cell5);
//   String cell6 = binLetter[5];
//   //Serial.println(cell6);
//   String cell7 = binLetter[6];
//   //Serial.println(cell7);
//   String cell8 = binLetter[7];
//   //Serial.println(cell8);
//   String cell9 = binLetter[8];
//   //Serial.println(cell9);
//   String cell10 = binLetter[9];
//   //Serial.println(cell10);
//   String cell11 = binLetter[10];
//   //Serial.println(cell11);
//   String cell12 = binLetter[11];
//   //Serial.println(cell12);
//   String cell13 = binLetter[12];
//   //Serial.println(cell13);
//   displayBrailleFormat(cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8, cell9, cell10, cell11, cell12, cell13);   
// }


// void displayBrailleFormat(String cell1, String cell2, String cell3, String cell4, String cell5, String cell6, String cell7, String cell8, String cell9, String cell10, String cell11, String cell12, String cell13) {

//   //this sucked to hell, DON'T TOUCH!!!! 
//   //CELL1
//     matrix.setPoint(1, 57, cell1[0]- '0');
//     matrix.setPoint(3, 57, cell1[1]- '0');
//     matrix.setPoint(5, 57, cell1[2]- '0');

//     matrix.setPoint(1, 59, cell1[3]- '0');
//     matrix.setPoint(3, 59, cell1[4]- '0');
//     matrix.setPoint(5, 59, cell1[5]- '0');

//     //CELL2
//     matrix.setPoint(1, 62, cell2[0]- '0');
//     matrix.setPoint(3, 62, cell2[1]- '0');
//     matrix.setPoint(5, 62, cell2[2]- '0');

//     matrix.setPoint(1, 48, cell2[3]- '0');
//     matrix.setPoint(3, 48, cell2[4]- '0');
//     matrix.setPoint(5, 48, cell2[5]- '0');

//     //CELL3
//     matrix.setPoint(1, 51, cell3[0]- '0');
//     matrix.setPoint(3, 51, cell3[1]- '0');
//     matrix.setPoint(5, 51, cell3[2]- '0');

//     matrix.setPoint(1, 53, cell3[3]- '0');
//     matrix.setPoint(3, 53, cell3[4]- '0');
//     matrix.setPoint(5, 53, cell3[5]- '0');

//     //CELL4
//     matrix.setPoint(1, 40, cell4[0]- '0');
//     matrix.setPoint(3, 40, cell4[1]- '0');
//     matrix.setPoint(5, 40, cell4[2]- '0');

//     matrix.setPoint(1, 42, cell4[3]- '0');
//     matrix.setPoint(3, 42, cell4[4]- '0');
//     matrix.setPoint(5, 42, cell4[5]- '0');

//     //CELL5
//     matrix.setPoint(1, 45, cell5[0]- '0');
//     matrix.setPoint(3, 45, cell5[1]- '0');
//     matrix.setPoint(5, 45, cell5[2]- '0');

//     matrix.setPoint(1, 47, cell5[3]- '0');
//     matrix.setPoint(3, 47, cell5[4]- '0');
//     matrix.setPoint(5, 47, cell5[5]- '0');


//     //CELL6
//     matrix.setPoint(1, 34, cell6[0]- '0');
//     matrix.setPoint(3, 34, cell6[1]- '0');
//     matrix.setPoint(5, 34, cell6[2]- '0');

//     matrix.setPoint(1, 36, cell6[3]- '0');
//     matrix.setPoint(3, 36, cell6[4]- '0');
//     matrix.setPoint(5, 36, cell6[5]- '0');


//     //CELL7
//     matrix.setPoint(1, 39, cell7[0]- '0');
//     matrix.setPoint(3, 39, cell7[1]- '0');
//     matrix.setPoint(5, 39, cell7[2]- '0');

//     matrix.setPoint(1, 25, cell7[3]- '0');
//     matrix.setPoint(3, 25, cell7[4]- '0');
//     matrix.setPoint(5, 25, cell7[5]- '0');

//     //CELL8
//     matrix.setPoint(1, 28, cell8[0]- '0');
//     matrix.setPoint(3, 28, cell8[1]- '0');
//     matrix.setPoint(5, 28, cell8[2]- '0');

//     matrix.setPoint(1, 30, cell8[3]- '0');
//     matrix.setPoint(3, 30, cell8[4]- '0');
//     matrix.setPoint(5, 30, cell8[5]- '0');

//     //CELL9
//     matrix.setPoint(1, 17, cell9[0]- '0');
//     matrix.setPoint(3, 17, cell9[1]- '0');
//     matrix.setPoint(5, 17, cell9[2]- '0');

//     matrix.setPoint(1, 19, cell9[3]- '0');
//     matrix.setPoint(3, 19, cell9[4]- '0');
//     matrix.setPoint(5, 19, cell9[5]- '0');

//     //CELL10
//     matrix.setPoint(1, 22, cell10[0]- '0');
//     matrix.setPoint(3, 22, cell10[1]- '0');
//     matrix.setPoint(5, 22, cell10[2]- '0');

//     matrix.setPoint(1, 8, cell10[3]- '0');
//     matrix.setPoint(3, 8, cell10[4]- '0');
//     matrix.setPoint(5, 8, cell10[5]- '0');

//     //CELL11
//     matrix.setPoint(1, 11, cell11[0]- '0');
//     matrix.setPoint(3, 11, cell11[1]- '0');
//     matrix.setPoint(5, 11, cell11[2]- '0');

//     matrix.setPoint(1, 13, cell11[3]- '0');
//     matrix.setPoint(3, 13, cell11[4]- '0');
//     matrix.setPoint(5, 13, cell11[5]- '0');

//     //CELL12
//     matrix.setPoint(1, 0, cell12[0]- '0');
//     matrix.setPoint(3, 0, cell12[1]- '0');
//     matrix.setPoint(5, 0, cell12[2]- '0');

//     matrix.setPoint(1, 2, cell12[3]- '0');
//     matrix.setPoint(3, 2, cell12[4]- '0');
//     matrix.setPoint(5, 2, cell12[5]- '0');

//     //CELL13
//     matrix.setPoint(1, 5, cell13[0]- '0');
//     matrix.setPoint(3, 5, cell13[1]- '0');
//     matrix.setPoint(5, 5, cell13[2]- '0');

//     matrix.setPoint(1, 7, cell13[3]- '0');
//     matrix.setPoint(3, 7, cell13[4]- '0');
//     matrix.setPoint(5, 7, cell13[5]- '0');
// }


void convertWord(String word, String binLetter[]){//this method converts words into a binary value used to turn certain leds on or off

  //Serial.println(word);
  for(int i = 0; i < word.length(); i++){
    // Validation
    if (word[i] == '-') break;
    if (word[i] == ' ') continue;

    binLetter[i] = letters[word[i]].c_str(); //convert this specific letter to the set binary in the map
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

int countCharOccurrences(const String& inputString, char targetChar) {
  int count = 0;
  for (int i = 0; i < inputString.length(); i++) {
    if (inputString.charAt(i) == targetChar) {
      count++;
    }
  }
  return count;
}

void getDevices(int idxMain) {
  String menuName = mainMenuDynamic[idxMain];

  if (menuName.indexOf('-') == -1) {
    subMenuCount = 0;
    return;
  }

  int looptimes = countCharOccurrences(menuName, ',') + 1;
  int idxD1 = menuName.indexOf('-') + 1;
  int idxD2;

  for (int i = 0; i < looptimes; i++) {
    idxD2 = menuName.indexOf(',', idxD1);
    if (idxD2 == -1) {
      idxD2 = menuName.length();
    }

    newSubMenu[i] = menuName.substring(idxD1, idxD2);
    idxD1 = idxD2 + 1;
  }

  subMenuCount = looptimes;

  // clear leftovers
  for (int i = looptimes; i < 10; i++) {
    newSubMenu[i] = "";
  }
}

// returns -1 if not found
int findRoomIndex(String roomName) {
  for (int i = 0; i < mainMenuCount; i++) {
    if (mainMenuDynamic[i].startsWith(roomName + "-") || mainMenuDynamic[i] == roomName) {
      return i;
    }
  }
  return -1;
}

void addRoom(String roomName) {
  if (mainMenuCount >= MAX_ROOMS) {
    Serial.println("Cannot add more rooms");
    return;
  }
  mainMenuDynamic[mainMenuCount++] = roomName; // no devices yet
  Serial.println("Room added: " + roomName);
}

void delRoom(String roomName) {
  int idx = findRoomIndex(roomName);
  if (idx == -1) return;

  // shift everything left
  for (int i = idx; i < mainMenuCount - 1; i++) {
    mainMenuDynamic[i] = mainMenuDynamic[i + 1];
  }
  mainMenuCount--;
  Serial.println("Room deleted: " + roomName);
}

void addDevice(String roomName, String deviceName) {
  int idx = findRoomIndex(roomName);
  if (idx == -1) return;

  if (mainMenuDynamic[idx].indexOf('-') == -1) {
    // first device
    mainMenuDynamic[idx] += "-" + deviceName;
  } else {
    // append with comma
    mainMenuDynamic[idx] += "," + deviceName;
  }
  Serial.println("Added device " + deviceName + " to " + roomName);
}

void delDevice(String roomName, String deviceName) {
  int idx = findRoomIndex(roomName);
  if (idx == -1) return;

  String menuName = mainMenuDynamic[idx];
  int dashPos = menuName.indexOf('-');
  if (dashPos == -1) return; // no devices to delete

  String devices = menuName.substring(dashPos + 1);
  // split devices by comma
  String updated = roomName;
  int start = 0;
  while (true) {
    int commaPos = devices.indexOf(',', start);
    String dev = (commaPos == -1) ? devices.substring(start) : devices.substring(start, commaPos);

    if (dev != deviceName && dev.length() > 0) {
      if (updated.indexOf('-') == -1)
        updated += "-" + dev;
      else
        updated += "," + dev;
    }

    if (commaPos == -1) break;
    start = commaPos + 1;
  }

  mainMenuDynamic[idx] = updated;
  Serial.println("Deleted device " + deviceName + " from " + roomName);
}
