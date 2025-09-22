 
  
  
## How to run
You should have Node.js installed in your workstation 


Rename the .env.local to .env  
``` mv .env.local .env ```  

Edit the .env and set the MQTT broker URL that you are using  
```
NAME=DONSKYTECH
DASHBOARD_TITLE=MQTT DASHBOARD
MQTT_BROKER=ws://127.0.01:9001/mqtt
MQTT_TOPIC=sensorReadings
```  

Install the dependencies and run the project
``` npm install && npm run dev ```
