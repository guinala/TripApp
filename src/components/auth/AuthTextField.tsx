import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AuthTextFieldProps = TextInputProps & {
  label: string;
  rightSlot?: ReactNode;
};

export default function AuthTextField({ label, rightSlot, style, ...rest }: AuthTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMetadata}
          style={[styles.input, style]}
          {...rest}
        />
        {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.label,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: '#ece2d4',
    borderRadius: radius.md,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.input,
    color: colors.textPrimary,
  },
  right: { paddingLeft: 12 },
});
