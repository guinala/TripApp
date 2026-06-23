import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { onboarding } from '@/constants/theme';

const BG = require('../../assets/images/welcome-bg.jpg');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={BG} resizeMode="cover" style={styles.bg}>
      <LinearGradient
        colors={[onboarding.overlayTop, onboarding.overlayBottom]}
        locations={[0, 0.894]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.logo}>TripMate</Text>

          <View style={styles.hero}>
            <Text style={styles.title}>
              Tu próximo{'\n'}viaje empieza{'\n'}
              <Text style={styles.titleAccent}>hoy</Text>
            </Text>
            <Text style={styles.subtitle}>
              Planifica itinerarios, controla tu presupuesto y guarda los recuerdos en un solo lugar
            </Text>
          </View>

          {/* Empuja los botones a la zona baja */}
          <View style={styles.spacer} />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.85}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.startText}>Empezar</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/login')}>
              <Text style={styles.loginText}>Ya tengo una cuenta · Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 25, paddingVertical: 50 },
  logo: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 40,
    color: '#FFFFFF',
  },
  hero: { marginTop: 122, gap: 10 },
  title: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 52,
    lineHeight: 56,
    color: '#FFFFFF',
  },
  titleAccent: { color: onboarding.gold },
  subtitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: onboarding.muted,
  },
  spacer: { flex: 1 },
  buttons: { alignItems: 'center', gap: 15, paddingVertical: 30 },
  startButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  startText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: onboarding.cta,
  },
  loginText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: onboarding.muted,
  },
});
