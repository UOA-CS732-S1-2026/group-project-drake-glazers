import { useSignIn } from '@clerk/expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApiClient } from '@/lib/api';

type Step = 'credentials' | 'mfa';

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const api = useApiClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState('');

  const clerkLoading = fetchStatus === 'fetching';
  const loading = clerkLoading;

  const syncUser = async () => {
    try {
      await api.post('/api/users', { email });
    } catch {}
  };

  const finalize = async () => {
    await signIn.finalize({
      navigate: syncUser,
    });
  };

  const onSignInPress = async () => {
    setError('');
    try {
      const { error: credError } = await signIn.password({ emailAddress: email, password });
      if (credError) {
        setError(credError.longMessage ?? credError.message ?? 'Sign in failed.');
        return;
      }
    } catch (e: any) {
      setError(e?.longMessage ?? e?.message ?? 'Sign in failed.');
      return;
    }

    if (signIn.status === 'complete') {
      await finalize();
    } else if (signIn.status === 'needs_second_factor') {
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) {
        setError(sendError.longMessage ?? sendError.message ?? 'Failed to send code.');
        return;
      }
      setStep('mfa');
    } else {
      console.error('Unexpected sign-in status:', signIn.status);
      setError('Sign in could not be completed. Please try again.');
    }
  };

  const onVerifyPress = async () => {
    setError('');
    const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) {
      setError(
        verifyError.longMessage ?? verifyError.message ?? 'Incorrect code. Please try again.'
      );
      return;
    }
    if (signIn.status === 'complete') {
      await finalize();
    } else {
      setError('Verification failed. Please try again.');
    }
  };

  const onResendPress = async () => {
    setError('');
    const { error: sendError } = await signIn.mfa.sendEmailCode();
    if (sendError) {
      setError(sendError.longMessage ?? sendError.message ?? 'Failed to resend code.');
    }
  };

  if (step === 'mfa') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/Memoriez-Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              Relive your journey through the spots that matter most.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={styles.hint}>We sent a verification code to {email}</Text>

            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#BBBBBB"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, (loading || !code) && styles.buttonDisabled]}
              onPress={onVerifyPress}
              disabled={loading || !code}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineButton, loading && styles.buttonDisabled]}
              onPress={onResendPress}
              disabled={loading}
            >
              <Text style={styles.outlineButtonText}>Resend code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setStep('credentials');
                setCode('');
                setError('');
              }}
              style={styles.footer}
            >
              <Text style={styles.link}>← Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/Memoriez-Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>
            Relive your journey through the spots that matter most.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#BBBBBB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#BBBBBB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Join the community</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = '#B92B27';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF0EE',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 280,
    maxWidth: '100%',
    height: 102,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
    marginTop: 14,
    marginHorizontal: 24,
  },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 2,
    marginHorizontal: 24,
  },
  error: {
    color: '#D9534F',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  outlineButtonText: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  link: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
});
