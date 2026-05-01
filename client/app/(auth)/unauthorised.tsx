import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/*
  Not currently in used, app only have 2 states signed in or not signed in,
  if not signed in, user is always directed to sign in page, so this page is never shown.
  This page could be used in the future if we want to have some pages that are accessible 
  without signing in, but still want to show a message to the user that they need to sign
  in to access certain features.
*/

export default function UnauthorisedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>You need to be signed in to view this page.</Text>
      <Link href="/(auth)/sign-in" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1a3c5e',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
