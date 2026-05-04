import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Href } from 'expo-router';
import { useApiClient } from '@/lib/api';
import { OnboardingModal } from '@/components/onboarding-modal';

type Step = 'credentials' | 'mfa';

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const api = useApiClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const clerkLoading = fetchStatus === 'fetching';
  const loading = clerkLoading || checkingProfile;

  const syncAndCheckProfile = async () => {
    setCheckingProfile(true);
    try {
      try {
        await api.post('/api/users', { email });
      } catch {}

      try {
        await api.get('/api/users/me/profile');
        router.replace('/(nav)/' as Href);
      } catch {
        setShowOnboarding(true);
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  const finalize = async () => {
    await signIn.finalize({
      navigate: syncAndCheckProfile,
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
        <View style={styles.inner}>
          <Text style={styles.title}>Memoriez</Text>
          <Text style={styles.subtitle}>We sent a verification code to {email}</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#888"
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
            style={[styles.button, styles.buttonOutline, loading && styles.buttonDisabled]}
            onPress={onResendPress}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Resend code</Text>
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

        <OnboardingModal
          visible={showOnboarding}
          onComplete={() => router.replace('/(nav)/' as Href)}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Memoriez</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => router.replace('/(nav)/' as Href)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 36,
    fontFamily: 'PlaywriteNO',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 36,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a3c5e',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 10,
  },
  buttonOutlineText: {
    color: '#4a90d9',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  link: {
    color: '#4a90d9',
    fontSize: 14,
    fontWeight: '600',
  },
});
