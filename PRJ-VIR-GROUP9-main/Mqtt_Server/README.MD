# 🚀 MQTT Docker Server Setup (Mosquitto)

This guide helps you run the custom Mosquitto MQTT broker built for our project using Docker. It includes everything needed to start the broker, test connections, and collaborate on the same MQTT topics.

---

## 🐳 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Internet access (to pull the Docker image)
- Optional: Mosquitto clients installed (for testing)

---

## 🧲 1. Pull the Docker Image

Run this in your terminal:

```bash
docker pull yourusername/mosquitto-custom:latest

## 2. RUN THE MQTT BROKER
#start the container locally 
docker run -d --name mosquitto-custom -p 1883:1883 yourusername/mosquitto-custom:latest


==========OPEN YOUR CMD TERMINAL AND RUN THIS COMMAND==========
ipconfig
LOOK FOR IPv4 Address
=======YOU WILL SEE YOU IP ADDRESS === E.G 192.168.1.45.

## 3. TEST YOUR CONNECTION (LOCAL TERMINAL)
#SUBCRIBE TO A TOPIC OPEN A NEW TERMINIAL TAB I WOULD ADVISE YOU TO OPEN 3
mosquitto_sub -h 127.0.0.1(REPLACE WITH YOU PC LOCAL IP ADDRESS) -t test/topic 

#pUBLISH TO SAME TOPIC (OPEN A NEW CMD TERMINAL)
mosquitto_pub -h 127.0.0.1(REPLACE WITH YOU PC LOCAL IP ADDRESS) -t test/topic -m "lIGHTS IN" 
