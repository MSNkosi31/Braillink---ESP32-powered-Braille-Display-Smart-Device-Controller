#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

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

int currentLetterIndex = 0;  // To keep track of which letter to display

void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();

  for (int i = 0; i < 6; i++) {
    pinMode(braillePins[i], OUTPUT);
    digitalWrite(braillePins[i], LOW);
  }

  lcd.print("Starting loop..."); //starting loop
  delay(1000);
}

void loop() {
  // Get the current letter and its Braille pattern
  char letter = 'A' + currentLetterIndex;
  byte pattern = brailleAlphabet[currentLetterIndex];

  // Display on LEDs
  for (int i = 0; i < 6; i++) {
    digitalWrite(braillePins[i], (pattern >> i) & 1);
  }

  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Braille:");
  lcd.setCursor(0, 1);
  lcd.print(letter);

  Serial.print("Showing letter: ");
  Serial.println(letter);

  // Move to the next letter
  currentLetterIndex++;
  if (currentLetterIndex >= 26) {
    currentLetterIndex = 0;  // Loop back to A
  }

  delay(2000);  // Wait 2 seconds before next letter
}
