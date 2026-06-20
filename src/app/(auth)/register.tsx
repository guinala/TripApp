import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Introduce tu nombre';
    if (!EMAIL_RE.test(email.trim())) return 'Email no válido';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirm) return 'Las contraseñas no coinciden';
    return null;
  };

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      // Con confirmación de email desactivada, el gate te mete directo en (app).
      // Con ella activada, no hay sesión aún:
      setInfo('Te hemos enviado un correo para confirmar tu cuenta.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor={colors.secondary300}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.secondary300}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.secondary300}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={colors.secondary300}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Link href="/login" style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </View>
    </SafeAreaView>
  );
}

// Pega aquí el mismo `const styles = StyleSheet.create({ ... })` de login.tsx
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.s7, gap: spacing.s4 },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textSm,
    color: colors.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.body,
    color: colors.secondary300,
    textAlign: 'center',
    marginBottom: spacing.s4,
  },
  input: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.input,
    color: colors.secondary,
  },
  error: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.danger },
  info: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.success },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.s5,
    alignItems: 'center',
    marginTop: spacing.s2,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.sansBold, fontSize: fontSize.input, color: colors.white },
  link: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.s3,
  },
});
