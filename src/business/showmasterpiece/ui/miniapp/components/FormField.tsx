import React from 'react';
import { Input, Text, Textarea, View } from '@tarojs/components';
import { sm, smCn } from '../../shared/theme';

interface BaseFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  type?: 'text' | 'number';
}

interface FormInputProps extends BaseFieldProps {
  onChange: (value: string) => void;
}

interface FormTextareaProps extends BaseFieldProps {
  onChange: (value: string) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  placeholder,
  disabled,
  error,
  type = 'text',
  onChange,
}) => {
  return (
    <View className="mt-4">
      <Text className={sm.label}>{label}</Text>
      <Input
        value={value}
        placeholder={placeholder}
        onInput={(event: { detail: { value: string } }) => onChange(event.detail.value)}
        className={smCn(sm.input, error && sm.inputError)}
        disabled={disabled}
        type={type}
      />
      {error && <Text className={sm.fieldError}>{error}</Text>}
    </View>
  );
};

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  placeholder,
  disabled,
  error,
  onChange,
}) => {
  return (
    <View className="mt-4">
      <Text className={sm.label}>{label}</Text>
      <Textarea
        value={value}
        placeholder={placeholder}
        onInput={(event: { detail: { value: string } }) => onChange(event.detail.value)}
        className={smCn(sm.textarea, error && sm.inputError)}
        disabled={disabled}
      />
      {error && <Text className={sm.fieldError}>{error}</Text>}
    </View>
  );
};
