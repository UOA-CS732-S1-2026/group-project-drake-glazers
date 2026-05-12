import { useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
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
import type { Href } from 'expo-router';
import { useApiClient } from '@/lib/api';
import { OnboardingModal } from '@/components/onboarding-modal';

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const api = useApiClient();

  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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

  const onSignUpPress = async () => {
    setError('');

    const { error: signUpError } = await signUp.password({ emailAddress: email, password });

    if (signUpError) {
      setError(signUpError.longMessage ?? signUpError.message ?? 'Sign up failed.');
      return;
    }

    if (signUp.status === 'missing_requirements') {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(sendError.longMessage ?? sendError.message ?? 'Failed to send verification code.');
        return;
      }
      setStep('verify');
    } else if (signUp.status === 'complete') {
      await signUp.finalize({ navigate: syncAndCheckProfile });
    }
  };

  const onVerifyPress = async () => {
    setError('');

    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });

    if (verifyError) {
      setError(verifyError.longMessage ?? verifyError.message ?? 'Invalid code.');
      return;
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({ navigate: syncAndCheckProfile });
    } else {
      setError('Verification could not be completed. Please try again.');
    }
  };

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
            {step === 'details'
              ? 'Capture the moments that define your journey.'
              : 'One last step to join the community.'}
          </Text>
        </View>

        <View style={styles.card}>
          {step === 'details' ? (
            <>
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
                autoComplete="new-password"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.hint}>We sent a verification code to {email}</Text>

              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#BBBBBB"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                autoFocus
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onVerifyPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => {
                  setStep('details');
                  setError('');
                }}
              >
                <Text style={styles.outlineButtonText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => router.replace('/(nav)/' as Href)}
      />
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
  hint: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 16,
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
