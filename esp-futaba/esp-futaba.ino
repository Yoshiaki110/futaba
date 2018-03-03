#include <ESP8266WiFi.h>
#include <WiFiClient.h> 
#include <ESP8266WebServer.h>
#include <FS.h>
#include <SoftwareSerial.h>
#include "setting.h"

String host = HOST;
int port = PORT;
int id = ID;

byte trqOn[] = {0x01, 0x00, 0x24, 0x01, 0x01, 0x01};    //トルクON
byte trqOff[] = {0x01, 0x00, 0x24, 0x01, 0x01, 0x00};   //トルクOFF
byte getPos[]={0x01, 0x0F, 0x2A, 0x02, 0x00};

SoftwareSerial SERVO(5, 4, false, 256);
int current_angle = 180;  // 現在の位置(0-180)
int dist_angle = 180;     // 最終目的確度(0-180)
WiFiClient client;

void cmd(unsigned char *cmd, int cnt) {
  unsigned char CheckSum = 0; // チェックサム計算用変数
  // チェックサム計算
  for(int i = 0; i < cnt; i++) {
    CheckSum = CheckSum ^ cmd[i];
  }
//  Serial.print("# Cmd [FA AF ");
  SERVO.write(0xFA);
  SERVO.write(0xAF);
  for(int i = 0; i< cnt; i++) {
    SERVO.write(cmd[i]);
//    Serial.print(cmd[i], HEX);
//    Serial.print(" ");
  }
  SERVO.write(CheckSum);
//  Serial.print(CheckSum, HEX);
//  Serial.println("]");
}

void move_cmd(unsigned char id, int angle, int time) {
  unsigned char TxData[10];   //送信データバッファ [10byte]
  TxData[0] = id;             // ID
  TxData[1] = 0x00;           // Flags
  TxData[2] = 0x1E;           // Address
  TxData[3] = 0x04;           // Length
  TxData[4] = 0x01;           // Count
  // Angle
  TxData[5] = (unsigned char)0x00FF & angle;        // Low byte
  TxData[6] = (unsigned char)0x00FF & (angle >> 8); //Hi byte
  // Angle
  TxData[7] = (unsigned char)0x00FF & time;        // Low byte
  TxData[8] = (unsigned char)0x00FF & (time >> 8); //Hi byte
  cmd(TxData, 9);
}

void setup() {
  Serial.begin(115200);
  SERVO.begin(115200);

  String ssid = SSID;
  String pass = PASS;
  Serial.println("SSID: " + ssid);
  Serial.println("PASS: " + pass);
  WiFi.begin(ssid.c_str(), pass.c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  cmd(trqOff, 6);      // トルクOFF
}

void move() {
  int diff = dist_angle - current_angle;  // 差をだす
  int now = diff > 3 ? 3 : diff;          // 今回動かす量(最大3)
  now = diff < -3 ? -3 : diff;            // 今回動かす量(最少-3)
  Serial.print("$ Move ");
  Serial.print(dist_angle);
  Serial.print(" - ");
  Serial.print(current_angle);
  Serial.print(" = ");
  Serial.print(diff);
  Serial.print(" : ");
  Serial.println(now);
  current_angle += now;
  int angle = (current_angle - 90) * 10;  // 1-180 => -90-90
  cmd(trqOn, 6);        // トルクON
  move_cmd(1, angle, 1);
  delay(50);
  cmd(trqOff, 6);      // トルクOFF
}

int getAngle() {
  cmd(getPos, 5);
  int ava = SERVO.available();
//  Serial.print("# servo available:");
//  Serial.println(ava);
  if (ava) {
    int i = 0;
    unsigned char c1 = 0;
    unsigned char c2 = 0;
    Serial.print("# <");
    do {
      unsigned char c = SERVO.read();
      Serial.print(" ");
      Serial.print(c, HEX);
      if (i == 7) {
        c1 = c;          
      } else if (i == 8) {
        c2 = c;
      }
      ++i;
    } while (SERVO.available());
    Serial.println(">");
    if (ava == 10) {
      short data = c1 + (c2 << 8);
      int angle = data / 10 + 90;  // -90-90 => 1-180
      Serial.print("  ");
      Serial.print(c1, HEX);
      Serial.print(" ");
      Serial.print(c2, HEX);
      Serial.print("  ");
      Serial.print(data, HEX);
      Serial.print("  ");
      Serial.print(data);
      Serial.print(" ");
      Serial.println(angle);
      return angle;
    }
  }
  return -1;
}

// スマホから受信
void receive() {
  if (!client.connected()) {
    Serial.println("> not connected");
    if (!client.connect(host, port)) {
      Serial.println("> connection failed:" + host + ":" + port);
    } else {
      Serial.println("> connection success:" + host + ":" + port);
    }
  }
//  Serial.print("> sock available:");
//  Serial.println(client.available());
  if (client.available() >= 3) {
    int c1 = client.read();
    int c2 = client.read();
    int c3 = client.read();
    Serial.print("> ");
    Serial.print(c1);
    Serial.print(" ");
    Serial.print(c2);
    Serial.print(" ");
    Serial.println(c3);
    if (c1 == 0xff && c2 == id) {
      dist_angle = c3;
    }
  }
}

long moveTime = 0;
bool moved = false;

void loop() {
  long now = millis();
  receive();    // スマホから受信
  if (moveTime == 0 || now - moveTime > 200) {  // 最初か200ms毎にチェック
    //Serial.println("*** move");
    if (dist_angle != current_angle) {
      move();     // サーボ 移動
    }
    moveTime = now;
    moved = true;
  }
  if (moveTime != 0 && now - moveTime > 150 && moved) {  // サーボ の移動が終わったら
    //Serial.println("*** getAngle");
    int a = getAngle();     // 現在の本当のサーボの位置を取得する（0-180）
    if (a > 0) {
      // 
    }
    moved = false;
  }
  delay(10);
}

