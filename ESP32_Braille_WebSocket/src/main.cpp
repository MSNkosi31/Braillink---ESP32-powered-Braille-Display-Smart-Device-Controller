#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#define POT_PIN 34


// LCD at address 0x27, 16x2 chars
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Braille LED pins (6 dots)
const int braillePins[6] = {13, 12, 14, 27, 26, 25};

// Braille patterns for letters A-Z
const byte brailleAlphabet[26] = {
  0b000001, // A
  0b000011, // B
  0b001001, // C
  0b011001, // D
  0b010001, // E
  0b001011, // F
  0b011011, // G
  0b010011, // H
  0b001010, // I
  0b011010, // J
  0b000101, // K
  0b000111, // L
  0b001101, // M
  0b011101, // N
  0b010101, // O
  0b001111, // P
  0b011111, // Q
  0b010111, // R
  0b001110, // S
  0b011110, // T
  0b100101, // U
  0b100111, // V
  0b111010, // W
  0b101101, // X
  0b111101, // Y
  0b110101  // Z
};

enum Menu {
  Bathroom = 1,
  Kitchen = 2,
  Bedroom = 3
};

String inputword = "";
bool inputComplete = false;

String selectedWord = "";
String newWord = "";
bool usePotentiometer = false;

void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();

  for (int i = 0; i < 6; i++) {
    pinMode(braillePins[i], OUTPUT);
    digitalWrite(braillePins[i], LOW);
  }

  lcd.setCursor(0, 0);
  lcd.print("Enter a word:");
  Serial.println("Type a word and press Enter:");
}

void loop() {
  // A. Check for Serial Input
  while (Serial.available()) {
    char c = Serial.read();
    if (!isAlpha(c)) {
      inputComplete = true;
      usePotentiometer = false;
    } else {
      inputword += c;
    }
  }

  delay(100);

  // B. If user types a word
  if (inputComplete) {
    inputword.trim();
    inputword.toUpperCase();
    selectedWord = inputword;

    Serial.print("You entered: ");
    Serial.println(selectedWord);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Word:");
    lcd.setCursor(0, 1);
    lcd.print(selectedWord);

    showWord(selectedWord);

    // Reset for next input
    inputword = "";
    inputComplete = false;

    // Show the Prompt again
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Enter word or Turn Dial");
    Serial.println("\nType another new word or turn dial:");
  }

  // C. If user chooses to use the dial
  if (!inputComplete && Serial.available() == 0) {
    int potValue = analogRead(POT_PIN);
    int menuIndex;

    if (potValue < 1200)
      menuIndex = 1;
    else if (potValue < 2800)
      menuIndex = 2;
    else
      menuIndex = 3;

    Menu choice = static_cast<Menu>(menuIndex);

    newWord = "";  // Use global variable (this is the fix)

    switch (choice) {
      case Bathroom:
        newWord = "BATHROOM";
        break;
      case Kitchen:
        newWord = "KITCHEN";
        break;
      case Bedroom:
        newWord = "BEDROOM";
        break;
      default:
        newWord = "UNKNOWN";
        break;
    }
  }

  if (newWord != selectedWord) {
    selectedWord = newWord;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Word:");
    lcd.setCursor(0, 1);
    lcd.print(selectedWord);

    showWord(selectedWord);

    Serial.print("Dial selected: ");
    Serial.println(selectedWord);
    usePotentiometer = true;
  }
}

void showWord(String inputword) {
  for (int i = 0; i < inputword.length(); i++) {
    char letter = inputword.charAt(i);

    if (letter >= 'A' && letter <= 'Z') {
      byte pattern = brailleAlphabet[letter - 'A'];

      for (int j = 0; j < 6; j++) {
        digitalWrite(braillePins[j], (pattern >> j) & 1);
      }

      Serial.print("Showing Braille for: ");
      Serial.println(letter);
      delay(1500);
    }
  }

  for (int j = 0; j < 6; j++) {
    digitalWrite(braillePins[j], LOW);
  }
  delay(1000);
}
