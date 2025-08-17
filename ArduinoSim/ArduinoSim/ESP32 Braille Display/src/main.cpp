#include <MD_Parola.h>
#include <SPI.h>
#include <WiFi.h>
#include <map>
#include <string>

// =================== WiFi CONFIG ===================
const char* ssid = "Wokwi-GUEST";
const char* password = "";


// =================== MATRIX DISPLAY CONFIG ===================
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 8
#define CLK_PIN 18
#define DATA_PIN 23
#define CS_PIN 21

MD_MAX72XX matrix = MD_MAX72XX(HARDWARE_TYPE, DATA_PIN, CLK_PIN, CS_PIN, MAX_DEVICES);

// =================== BUTTONS ===================
#define ENTER_PIN 12
#define BACK_PIN 32
#define NEXT_PIN 14
#define PREV_PIN 27

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

String binLetter [13] = {"000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000","000000"};//Sets all leds off
int menuOption = 0;
bool welcomeShown = false;
bool wakeup = false;
bool AllWake = false;
unsigned long lastActiveTime = 0;
const unsigned long activeDuration = 10000; // 60 seconds

// =================== FUNCTION DECLARATIONS ===================
void clearBin();
void convertWord(String word, String binLetter[]);
void displayBrailleFormat(String c1, String c2, String c3, String c4, String c5, String c6,
                          String c7, String c8, String c9, String c10, String c11, String c12, String c13);
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

   
  welcomeShown = true;
  lastActiveTime = millis() - activeDuration;
  matrix.clear();
  matrix.update();
}




void loop() {
 // just safety check
  if (!welcomeShown) return; 
  
  String main[] = {"lights", "doorlocks", "theromstat"};
  String lights[] = {"bedroom#1", "bedroom#2", "kitchen"};
 
  //Read the state of the different pins
  bool nextPressed  = digitalRead(NEXT_PIN) == HIGH;
  bool prevPressed  = digitalRead(PREV_PIN) == HIGH;
  bool enterPressed = digitalRead(ENTER_PIN) == HIGH;
  bool backPressed  = digitalRead(BACK_PIN) == HIGH;
  bool motionDetected = digitalRead(PROX_PIN) == HIGH;
 
   bool activityAll = motionDetected || nextPressed || prevPressed || enterPressed || backPressed;
   bool activityButtons =  nextPressed || prevPressed || enterPressed || backPressed;
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
      matrix.clear();
      matrix.update();
   
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
    Serial.println("Display ON (motion/button active)");

    clearBin();
    convertWord(lights[menuOption], binLetter);
    matrix.update();

    // Handle buttons only if pressed
    if (nextPressed) {
      digitalWrite(BUZZ_PIN, HIGH);
      delay(1000); // debounce
      digitalWrite(BUZZ_PIN, LOW);
      menuOption++;
      if (menuOption > 2) menuOption = 0;
    }

    if (prevPressed) {
      digitalWrite(BUZZ_PIN, HIGH);
      delay(500); // debounce
      digitalWrite(BUZZ_PIN, LOW);
      delay(500); // extra debounce
      menuOption--;
      if (menuOption < 0) menuOption = 2;
    }
  } 
  else {
    
    Serial.println("Display OFF (no motion/button for 60 seconds)");
    matrix.clear();
    matrix.update();
  }

  // read the state of the switch/button:
  String word[15] = {"bathroom","kitchen","bedroom","lights", "doorlocks", "thermostats", "locked", "unlocked"} ;

  //convertWord(word[r], binLetter);

  /*if(digitalRead(NEXT_PIN) == HIGH){
    Serial.println("The state changed HIGH");
    //digitalWrite(BLUE_LED, true);
    r++;}*/

  //if(digitalRead(PREV_PIN) == HIGH){
    //Serial.println("The state changed HIGH");
    //digitalWrite(YELLOW_LED, true);
    //r--;}

  //if(digitalRead(ENTER_PIN) == LOW){
    //Serial.println("The state changed LOW ");
    //digitalWrite(GREEN_LED, true);
    //}

  //delay(10000);
  
  /*String word[15] = {"bathroom","kitchen","bedroom","lights", "doorlocks", "thermostats", "locked", "unlocked"} ;
  //convertWord(word, binLetter);
  //delay(100000);
  int i = 0;

  while(i < sizeof(word)){
    clearBin();
    convertWord(word[i], binLetter);
    i++;
    delay(3000);
  }*/
 

  /*switch (menuOption) {
    case 0:
      convertWord(word[menuOption], binLetter);
      Serial.println(word[menuOption]);
      break;

    case 1:
      digitalWrite(LED_BUILTIN, HIGH);
      Serial.println("Menu 1: LED ON");
      break;

    case 2:
      Serial.println("Menu 2: Blinking LED");
      digitalWrite(LED_BUILTIN, HIGH);
      delay(250);
      digitalWrite(LED_BUILTIN, LOW);
      delay(250);
      break;
  }*/
delay(50);
  
//clearBin(); // Slow down loop to see messages
}

// =================== FUNCTIONS ===================
void playBuzz(int freq , int duration) {
  tone(BUZZ_PIN, freq);     // Play tone at 'freq' Hz
  delay(duration);          // Wait for 'duration' ms
  noTone(BUZZ_PIN);         // Stop the tone
}

void clearBin(){
  for (int i=0; i < 13; i++){// 13 is too hardcoded 
    binLetter[i] = "000000";
  }
}

void showWelcomeMessage() {
  clearBin();
  String welcome = "welcome User";  // welcome message (keep it <= 13 chars)
  convertWord(welcome, binLetter);
  matrix.update();
}

void convertWord(String word, String binLetter[]){//this method converts words into a binary value used to turn certain leds on or off
  
  Serial.println(word);
  for(int i = 0; i < word.length(); i++){
    binLetter[i] = letters[word[i]].c_str(); //convert this specific letter to the set binary in the map
  }

  String cell1 = binLetter[0];
  //Serial.println(cell1);// for testing
  String cell2 = binLetter[1];
  //Serial.println(cell2);
  String cell3 = binLetter[2];
  //Serial.println(cell3);
  String cell4 = binLetter[3];
  //Serial.println(cell4);
  String cell5 = binLetter[4];
  //Serial.println(cell5);
  String cell6 = binLetter[5];
  //Serial.println(cell6);
  String cell7 = binLetter[6];
  //Serial.println(cell7);
  String cell8 = binLetter[7];
  //Serial.println(cell8);
  String cell9 = binLetter[8];
  //Serial.println(cell9);
  String cell10 = binLetter[9];
  //Serial.println(cell10);
  String cell11 = binLetter[10];
  //Serial.println(cell11);
  String cell12 = binLetter[11];
  //Serial.println(cell12);
  String cell13 = binLetter[12];
  //Serial.println(cell13);
  displayBrailleFormat(cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8, cell9, cell10, cell11, cell12, cell13);   
}
void displayBrailleFormat(String cell1, String cell2, String cell3, String cell4, String cell5, String cell6, String cell7, String cell8, String cell9, String cell10, String cell11, String cell12, String cell13) {
//this sucked to hell, DON'T TOUCH!!!! 
  //CELL1
    matrix.setPoint(1, 57, cell1[0]- '0');
    matrix.setPoint(3, 57, cell1[1]- '0');
    matrix.setPoint(5, 57, cell1[2]- '0');

    matrix.setPoint(1, 59, cell1[3]- '0');
    matrix.setPoint(3, 59, cell1[4]- '0');
    matrix.setPoint(5, 59, cell1[5]- '0');

    //CELL2
    matrix.setPoint(1, 62, cell2[0]- '0');
    matrix.setPoint(3, 62, cell2[1]- '0');
    matrix.setPoint(5, 62, cell2[2]- '0');

    matrix.setPoint(1, 48, cell2[3]- '0');
    matrix.setPoint(3, 48, cell2[4]- '0');
    matrix.setPoint(5, 48, cell2[5]- '0');

    //CELL3
    matrix.setPoint(1, 51, cell3[0]- '0');
    matrix.setPoint(3, 51, cell3[1]- '0');
    matrix.setPoint(5, 51, cell3[2]- '0');

    matrix.setPoint(1, 53, cell3[3]- '0');
    matrix.setPoint(3, 53, cell3[4]- '0');
    matrix.setPoint(5, 53, cell3[5]- '0');

    //CELL4
    matrix.setPoint(1, 40, cell4[0]- '0');
    matrix.setPoint(3, 40, cell4[1]- '0');
    matrix.setPoint(5, 40, cell4[2]- '0');

    matrix.setPoint(1, 42, cell4[3]- '0');
    matrix.setPoint(3, 42, cell4[4]- '0');
    matrix.setPoint(5, 42, cell4[5]- '0');

    //CELL5
    matrix.setPoint(1, 45, cell5[0]- '0');
    matrix.setPoint(3, 45, cell5[1]- '0');
    matrix.setPoint(5, 45, cell5[2]- '0');

    matrix.setPoint(1, 47, cell5[3]- '0');
    matrix.setPoint(3, 47, cell5[4]- '0');
    matrix.setPoint(5, 47, cell5[5]- '0');


    //CELL6
    matrix.setPoint(1, 34, cell6[0]- '0');
    matrix.setPoint(3, 34, cell6[1]- '0');
    matrix.setPoint(5, 34, cell6[2]- '0');

    matrix.setPoint(1, 36, cell6[3]- '0');
    matrix.setPoint(3, 36, cell6[4]- '0');
    matrix.setPoint(5, 36, cell6[5]- '0');


    //CELL7
    matrix.setPoint(1, 39, cell7[0]- '0');
    matrix.setPoint(3, 39, cell7[1]- '0');
    matrix.setPoint(5, 39, cell7[2]- '0');

    matrix.setPoint(1, 25, cell7[3]- '0');
    matrix.setPoint(3, 25, cell7[4]- '0');
    matrix.setPoint(5, 25, cell7[5]- '0');

    //CELL8
    matrix.setPoint(1, 28, cell8[0]- '0');
    matrix.setPoint(3, 28, cell8[1]- '0');
    matrix.setPoint(5, 28, cell8[2]- '0');

    matrix.setPoint(1, 30, cell8[3]- '0');
    matrix.setPoint(3, 30, cell8[4]- '0');
    matrix.setPoint(5, 30, cell8[5]- '0');

    //CELL9
    matrix.setPoint(1, 17, cell9[0]- '0');
    matrix.setPoint(3, 17, cell9[1]- '0');
    matrix.setPoint(5, 17, cell9[2]- '0');

    matrix.setPoint(1, 19, cell9[3]- '0');
    matrix.setPoint(3, 19, cell9[4]- '0');
    matrix.setPoint(5, 19, cell9[5]- '0');

    //CELL10
    matrix.setPoint(1, 22, cell10[0]- '0');
    matrix.setPoint(3, 22, cell10[1]- '0');
    matrix.setPoint(5, 22, cell10[2]- '0');

    matrix.setPoint(1, 8, cell10[3]- '0');
    matrix.setPoint(3, 8, cell10[4]- '0');
    matrix.setPoint(5, 8, cell10[5]- '0');

    //CELL11
    matrix.setPoint(1, 11, cell11[0]- '0');
    matrix.setPoint(3, 11, cell11[1]- '0');
    matrix.setPoint(5, 11, cell11[2]- '0');

    matrix.setPoint(1, 13, cell11[3]- '0');
    matrix.setPoint(3, 13, cell11[4]- '0');
    matrix.setPoint(5, 13, cell11[5]- '0');

    //CELL12
    matrix.setPoint(1, 0, cell12[0]- '0');
    matrix.setPoint(3, 0, cell12[1]- '0');
    matrix.setPoint(5, 0, cell12[2]- '0');

    matrix.setPoint(1, 2, cell12[3]- '0');
    matrix.setPoint(3, 2, cell12[4]- '0');
    matrix.setPoint(5, 2, cell12[5]- '0');

    //CELL12
    matrix.setPoint(1, 5, cell12[0]- '0');
    matrix.setPoint(3, 5, cell12[1]- '0');
    matrix.setPoint(5, 5, cell12[2]- '0');

    matrix.setPoint(1, 7, cell12[3]- '0');
    matrix.setPoint(3, 7, cell12[4]- '0');
    matrix.setPoint(5, 7, cell12[5]- '0');
}
