#include <MD_MAX72xx.h>
#include <SPI.h>
#include <WiFi.h>
#include <map>
#include <string>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
// =================== WiFi CONFIG ===================
const char* ssid = "Wokwi-GUEST";
const char* password = "";


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
std::map<char,String> letters = {
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
  {'9', "010100"}
};
// =================== GLOBAL VARIABLES ===================

String binLetter[13] = {"000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000"};//Sets all leds off
int currentMainOption = 0;
int currentSubOption = 0;
bool welcomeShown = false;
bool wakeup = false;
bool AllWake = false;
unsigned long lastActiveTime = 0;
const unsigned long activeDuration = 10000; // 60 seconds
String mainMenu[] = {"bedroom-lights1,lights2", "bathroom-gyser", "kitchen-thermostats"};
bool shownGoodbyeMsg = false;
bool inSubMenu = false;
const int MAX_ROOMS = 10;
String newSubMenu[MAX_ROOMS];  // MAX amount of devices
int subMenuCount = 0;   // how many devices are in newSubMenu
int mainMenuCount = sizeof(mainMenu) / sizeof(mainMenu[0]); // safe main menu count
int lastClk = HIGH;

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

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n Connected!");
  Serial.print(" IP Address: ");
  Serial.println(WiFi.localIP());

  Wire.begin(16, 17);   // SDA = 16, SCL = 17
  lcd.init();           // Initialize LCD
  lcd.backlight();      // Turn on backlight
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");

  welcomeShown = true;
  lastActiveTime = millis() - activeDuration;
  matrix.clear();
  matrix.update();
}

void loop() {
  // just safety check
  if (!welcomeShown) return; 
 
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
  bool backPressed  = digitalRead(BACK_PIN) == HIGH;
  bool motionDetected = digitalRead(PROX_PIN) == HIGH;
 
  bool activityAll = motionDetected || nextTruned || prevTurned || enterPressed || backPressed;
  bool activityButtons = nextTruned || prevTurned || enterPressed || backPressed;
  bool isActive = (millis() - lastActiveTime) < activeDuration;
   
  if (!isActive && activityAll) {
    wakeup = true;
    AllWake = activityAll;  // true if button caused wake
  }

  // If waking from OFF
  if (wakeup) {
    if (AllWake) {
      showWelcomeMessage();
      delay(2000);
      updateMenu(0, mainMenu, mainMenuCount);
    }
    lastActiveTime = millis();
    wakeup = false;
    AllWake = false;
    return;
  }

  // Check if we are within active duration window
  if (isActive) {
    if (activityAll) {
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
        updateMenu(currentMainOption, mainMenu, mainMenuCount);
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
        updateMenu(currentMainOption, mainMenu, mainMenuCount);
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

void clearBin(){
  for (int i = 0; i < 13; i++){// 13 is too hardcoded 
    binLetter[i] = "000000";
  }
}

void showWelcomeMessage() {
  clearBin();
  String welcome = "welcome User";  // welcome message (keep it <= 13 chars)
  convertWord(welcome, binLetter);

  matrix.update();
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Welcome");
  lcd.setCursor(0,1);
  lcd.print("User");
}

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
  String menuName = mainMenu[idxMain];

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
