#include <Arduino.h>

// put function declarations here:
int myFunction(int, int);
//cell 1
int l11 = 2;
int l12 = 3;
int l13 = 4;
int l14 = 5;
int l15 = 6;
int l16 = 7;
//cell 2
//int l21 = 4;
//int l22 = 4;
//int l23 = 4;
//int l24 = 4;
//int l25 = 4;
//int l26 = 4;

void Write() {
  //cell 1
  digitalWrite(l11, 1);  
  digitalWrite(l12, 1);
  digitalWrite(l13, 1);  
  digitalWrite(l14, 1);
  digitalWrite(l15, 1);  
  digitalWrite(l16, 1);
}

void Clear(){
  digitalWrite(l11, 0);  
  digitalWrite(l12, 0);
  digitalWrite(l13, 0);  
  digitalWrite(l14, 0);
  digitalWrite(l15, 0);  
  digitalWrite(l16, 0);
}
void setup() {
//cell 1
pinMode(l11, OUTPUT);
pinMode(l12, OUTPUT);
pinMode(l13, OUTPUT);
pinMode(l14, OUTPUT);
pinMode(l15, OUTPUT);
pinMode(l16, OUTPUT);
//cell 2
//pinMode(l21, OUTPUT);
//pinMode(l22, OUTPUT);
//pinMode(l23, OUTPUT);
//pinMode(l24, OUTPUT);
//pinMode(l25, OUTPUT);
//pinMode(l26, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:  
  Write();
  delay(2000);
  Clear();
  delay(2000);
}
