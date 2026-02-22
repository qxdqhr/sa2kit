import React from 'react';
import { Input, Text, Textarea, View } from '@tarojs/components';

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
  onChange
}) => {
  return (
    <View className="mt-4">
      <Text className="text-xs text-slate-600">{label}</Text>
      <Input
        value={value}
        placeholder={placeholder}
        onInput={(event: { detail: { value: string } }) => onChange(event.detail.value)}
        className={`mt-2 h-10 w-full rounded-xl border px-3 text-sm ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
        disabled={disabled}
        type={type}
      />
      {error && <Text className="mt-1 block text-xs text-rose-500">{error}</Text>}
    </View>
  );
};

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  placeholder,
  disabled,
  error,
  onChange
}) => {
  return (
    <View className="mt-4">
      <Text className="text-xs text-slate-600">{label}</Text>
      <Textarea
        value={value}
        placeholder={placeholder}
        onInput={(event: { detail: { value: string } }) => onChange(event.detail.value)}
        className={`mt-2 min-h-24 w-full rounded-xl border px-3 py-2 text-sm ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
        disabled={disabled}
      />
      {error && <Text className="mt-1 block text-xs text-rose-500">{error}</Text>}
    </View>
  );
};
