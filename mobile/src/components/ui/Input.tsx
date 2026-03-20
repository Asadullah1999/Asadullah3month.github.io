import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export function Input({ label, error, leftIcon, rightIcon, onRightIconPress, isPassword, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={styles.leftIcon} />
        )}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
          placeholderTextColor={colors.textDim}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inputWithLeft: { paddingLeft: 8 },
  leftIcon: { paddingLeft: 14 },
  rightIcon: { paddingRight: 14 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
