
import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

const useMqtt = () => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const brokerUrl = 'tcp://5.tcp.ngrok.io:27483';
    const mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setClient(mqttClient);
      clientRef.current = mqttClient;
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT connection error:', err);
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  const publish = (topic: string, message: string) => {
    if (client) {
      client.publish(topic, message, (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
        }
      });
    }
  };

  return { publish };
};

export default useMqtt;
