import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import java.util.Properties;

public class MqttLogger {
    public static void main(String[] args) throws Exception {
        // Load .env (simplified, assumes file is in the same directory)
        Properties prop = new Properties();
        prop.load(MqttLogger.class.getResourceAsStream("/.env"));
        String broker = prop.getProperty("MQTT_BROKER").replace("ws://", "tcp://").replace("/mqtt", "");
        String clientId = prop.getProperty("MQTT_CLIENT_ID");

        MqttClient client = new MqttClient(broker, clientId);
        MqttConnectOptions options = new MqttConnectOptions();
        options.setCleanSession(true);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                System.out.println("Connection lost: " + cause.getMessage());
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                String payload = new String(message.getPayload());
                System.out.println("Logged: " + new java.util.Date() + " - " + topic + ": " + payload);
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {}
        });

        client.connect(options);
        client.subscribe("#"); // Subscribe to all topics
        System.out.println("Connected to " + broker + " as " + clientId);
    }
}