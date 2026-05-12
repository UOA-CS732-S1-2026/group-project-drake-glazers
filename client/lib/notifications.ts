import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, ToastAndroid } from 'react-native';

type ApiClient = {
  post: (path: string, body: unknown) => Promise<unknown>;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const debugPush = (message: string) => {
  if (process.env.EXPO_PUBLIC_DEBUG_PUSH !== 'true') return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  console.log(`push: ${message}`);
};

const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const getExpoPushToken = async (): Promise<string> => {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;

  debugPush(projectId ? `projectId ok (${projectId.slice(0, 8)}...)` : 'missing EAS projectId');

  if (!projectId) {
    throw new Error('Missing EAS projectId in app config');
  }

  const response = await Notifications.getExpoPushTokenAsync({ projectId });

  return response.data;
};

export const registerForPushNotificationsAsync = async (api: ApiClient) => {
  debugPush('register start');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  debugPush(`permission ${finalStatus}`);

  if (finalStatus !== 'granted') {
    debugPush('permission denied');
    return;
  }

  let token = '';
  try {
    token = await getExpoPushToken();
  } catch (error) {
    debugPush(`token error ${formatErrorMessage(error).slice(0, 140)}`);
    throw error;
  }

  debugPush(`token ${token.slice(0, 10)}...`);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    await api.post('/api/device-tokens', {
      token,
      platform: Platform.OS,
      timeZone,
    });
    debugPush('device token saved');
  } catch (error) {
    debugPush(`save error ${formatErrorMessage(error).slice(0, 140)}`);
    throw error;
  }
};
