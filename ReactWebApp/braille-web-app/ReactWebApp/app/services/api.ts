
const API_URL = 'https://braillink-api.ngrok.app';

export const getDevices = async () => {
  const response = await fetch(`${API_URL}/devices`);
  if (!response.ok) {
    throw new Error('Failed to fetch devices');
  }
  return response.json();
};

export const getLogs = async () => {
  const response = await fetch(`${API_URL}/logs`);
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return response.json();
};

export const toggleDevice = async (deviceId: number, status: boolean) => {
    const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: !status }),
    });
    if (!response.ok) {
        throw new Error('Failed to toggle device');
    }
    return response.json();
}
