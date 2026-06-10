import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Función de validación que puede retornar un booleano o un mensaje de error
 */
interface ValidationFunction<T> {
  (value: any, formValues?: T): boolean | string;
}

/**
 * Objeto con múltiples funciones de validación
 */
interface Validate<T> {
  [key: string]: ValidationFunction<T>;
}

/**
 * Reglas de validación para un campo
 */
type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  validate?: Validate<T>;
  errorMessage?: string;
};

/**
 * Reglas de validación para todos los campos del formulario
 */
type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>;
};

/**
 * Estado de campos tocados
 */
type TouchedFields<T> = {
  [K in keyof T]: boolean;
};

/**
 * Estado de validez de cada campo
 */
type FieldValidState<T> = {
  [K in keyof T]: boolean;
};

/**
 * Resultado del hook useForm
 */
interface UseFormReturn<T> {
  form: T;
  errors: Partial<Record<keyof T, string>>;
  touched: TouchedFields<T>;
  isFormValid: boolean;
  hasFormChanged: boolean;
  fieldValidState: FieldValidState<T>;
  onChange: (value: any, field: keyof T) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  isFieldValid: (field: keyof T) => boolean;
  resetForm: () => void;
  updateOriginalValues: (newValues: T) => void;
  validateAllFields: () => boolean;
  getRequiredFields: () => (keyof T)[];
  setFormValue: (values: Partial<T>) => void;
 getModifiedFields: () => Partial<T>;
}

/**
 * Hook personalizado para manejo de formularios con validación
 * 
 * @template T - Tipo del objeto de formulario
 * @param {T} initialState - Estado inicial del formulario
 * @param {ValidationRules<T>} validationRules - Reglas de validación opcionales
 * @returns {UseFormReturn<T>} Objeto con estado y métodos del formulario
 * 
 * @example
 * ```tsx
 * const { form, errors, onChange, isFormValid } = useForm(
 *   { email: '', password: '' },
 *   {
 *     email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
 *     password: { required: true, minLength: 8 }
 *   }
 * );
 * ```
 */
const useForm = <T extends Record<string, any>>(
  initialState: T,
  validationRules?: ValidationRules<T>
): UseFormReturn<T> => {
  // ==================== Estados ====================
  const [form, setForm] = useState<T>(initialState);
  const [originalValues, setOriginalValues] = useState<T>(initialState);
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>(() =>
    Object.keys(initialState).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as TouchedFields<T>)
  );
  const [fieldValidState, setFieldValidState] = useState<FieldValidState<T>>(() =>
    Object.keys(initialState).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as FieldValidState<T>)
  );
  const [isFormValid, setIsFormValid] = useState(false);

  // ==================== Funciones Memoizadas ====================

  /**
   * Obtiene la lista de campos requeridos
   */
  const getRequiredFields = useCallback((): (keyof T)[] => {
    if (!validationRules) return [];
    return Object.entries(validationRules)
      .filter(([_, rules]) => rules?.required)
      .map(([field]) => field as keyof T);
  }, [validationRules]);

  /**
   * Valida un campo individual
   */
  const validateField = useCallback(
    (value: any, field: keyof T, formValues: T = form): string | null => {
      const rules = validationRules?.[field];
      if (!rules) return null;

      // Campo requerido
      if (rules.required && (value === null || value === undefined || value === '')) {
        return rules.errorMessage || 'Este campo es requerido';
      }

      // Si no es requerido y está vacío, es válido
      if (!rules.required && (value === null || value === undefined || value === '')) {
        return null;
      }

      // Longitud mínima
      if (rules.minLength !== undefined && String(value).length < rules.minLength) {
        return rules.errorMessage || `Mínimo ${rules.minLength} caracteres`;
      }

      // Longitud máxima
      if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
        return rules.errorMessage || `Máximo ${rules.maxLength} caracteres`;
      }

      // Patrón regex
      if (rules.pattern && !rules.pattern.test(String(value))) {
        return rules.errorMessage || 'Formato inválido';
      }

      // Validación personalizada
      if (rules.custom && !rules.custom(value)) {
        return rules.errorMessage || 'Validación personalizada fallida';
      }

      // Validaciones múltiples
      if (rules.validate) {
        for (const [key, validateFn] of Object.entries(rules.validate)) {
          const result = validateFn(value, formValues);
          if (typeof result === 'string') {
            return result;
          } else if (result === false) {
            return rules.errorMessage || `Validación fallida: ${key}`;
          }
        }
      }

      return null;
    },
    [validationRules, form]
  );

  /**
   * Verifica si un campo es válido
   */
  const isFieldValid = useCallback(
    (field: keyof T): boolean => {
      const value = form[field];
      const error = validateField(value, field);
      const isValid = !error && value !== undefined && value !== null && value !== '';

      setFieldValidState((prev) => ({
        ...prev,
        [field]: isValid,
      }));

      return isValid;
    },
    [form, validateField]
  );

  /**
   * Valida todos los campos requeridos
   */
  const validateRequiredFields = useCallback((): boolean => {
    const requiredFields = getRequiredFields();

    if (requiredFields.length === 0) return true;

    return requiredFields.every((field) => {
      const value = form[field];
      const error = validateField(value, field);
      return value !== undefined && value !== null && value !== '' && !error;
    });
  }, [form, getRequiredFields, validateField]);

  /**
   * Maneja el cambio de valor de un campo
   */
  const onChange = useCallback(
    (value: any, field: keyof T) => {
      setForm((prev) => {
        const newForm = { ...prev, [field]: value };

        // Verificar si el formulario ha cambiado
        const hasChanged = JSON.stringify(newForm) !== JSON.stringify(originalValues);
        setHasFormChanged(hasChanged);

        // Validar el campo con el nuevo estado
        if (validationRules?.[field]) {
          const error = validateField(value, field, newForm);
          setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: error || undefined,
          }));
        }

        return newForm;
      });

      // Marcar el campo como tocado
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));
    },
    [originalValues, validationRules, validateField]
  );


  /**
   * Establece múltiples valores del formulario
   */
  const setFormValue = useCallback(
    (values: Partial<T>) => {
      setForm((prev) => {
        const newForm = { ...prev, ...values };
        const hasChanged = JSON.stringify(newForm) !== JSON.stringify(originalValues);
        setHasFormChanged(hasChanged);

        // Validar todos los campos actualizados
        if (validationRules) {
          const newErrors: Partial<Record<keyof T, string>> = {};
          Object.keys(values).forEach((key) => {
            const field = key as keyof T;
            if (validationRules[field]) {
              const error = validateField(values[field], field, newForm);
              if (error) newErrors[field] = error;
            }
          });
          setErrors((prev) => ({ ...prev, ...newErrors }));
        }

        return newForm;
      });
    },
    [originalValues, validationRules, validateField]
  );

  /**
   * Marca un campo como tocado
   */
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched((prev) => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  /**
   * Resetea el formulario a los valores originales
   */
  const resetForm = useCallback(() => {
    setForm(originalValues);
    setHasFormChanged(false);
    setErrors({});
    setTouched(
      Object.keys(originalValues).reduce((acc, key) => {
        acc[key as keyof T] = false;
        return acc;
      }, {} as TouchedFields<T>)
    );
  }, [originalValues]);

  /**
   * Actualiza los valores originales del formulario
   */
  const updateOriginalValues = useCallback((newValues: T) => {
    setOriginalValues(newValues);
    setForm(newValues);
    setHasFormChanged(false);
    setErrors({});
    setTouched(
      Object.keys(newValues).reduce((acc, key) => {
        acc[key as keyof T] = false;
        return acc;
      }, {} as TouchedFields<T>)
    );
  }, []);

  /**
   * Valida todos los campos y marca todos como tocados
   */
  const validateAllFields = useCallback((): boolean => {
    const allTouched: TouchedFields<T> = Object.keys(form).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as TouchedFields<T>);

    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(form).forEach((key) => {
      const field = key as keyof T;
      if (validationRules?.[field]) {
        const error = validateField(form[field], field);
        if (error) newErrors[field] = error;
      }
    });

    setTouched(allTouched);
    setErrors(newErrors);

    return validateRequiredFields();
  }, [form, validationRules, validateField, validateRequiredFields]);

  // ==================== Efectos ====================
  

  /**
   * Actualiza el estado de validez del formulario cuando cambia
   */
  useEffect(() => {
    const isValid = validateRequiredFields();
    setIsFormValid(isValid);
  }, [form, validateRequiredFields]);



  const getModifiedFields = useCallback((): Partial<T> => {
    const modifiedFields: Partial<T> = {};

    Object.keys(form).forEach((key) => {
      const field = key as keyof T;
      const currentValue = form[field];
      const originalValue = originalValues[field];

      // Comparar valores (considera diferentes tipos de datos)
      const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(originalValue);

      if (hasChanged) {
        modifiedFields[field] = currentValue;
      }
    });

    return modifiedFields;
  }, [form, originalValues]);
  // ==================== Return ====================

  return {
    form,
    errors,
    touched,
    isFormValid,
    hasFormChanged,
    fieldValidState,
    onChange,
    setFieldTouched,
    isFieldValid,
    resetForm,
    updateOriginalValues,
    validateAllFields,
    getRequiredFields,
    setFormValue,
    getModifiedFields
  };
};

export default useForm;
/* 
************************************************ EXAMPLES USES MODE ************************************************

type ValidationRule = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    validate?: Validate;
    errorMessage?: string;
};

type ValidationRules<T> = {
    [K in keyof T]?: ValidationRule;
};


BASIC USE

interface FormData {
  email: string;
  password: string;
}

const MyForm = () => {
  const initialState: FormData = {
    email: '',
    password: ''
  };

  const validationRules: ValidationRules<FormData> = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: 'Email inválido'
    },
    password: {
      required: true,
      minLength: 6
    }
  };

  const {
    form,
    errors,
    touched,
    isFormValid,
    onChange,
    validateAllFields
  } = useForm<FormData>(initialState, validationRules);

  const handleSubmit = () => {
    if (validateAllFields()) {
      // Procesar formulario
    }
  };



  CONST EXAMPLEcOMPONENT  = () => {
  const { form, onChange, errors, isFieldValid, setFieldTouched, touched, validateAllFields, isFormValid, resetForm, hasFormChanged, setFormValue, updateOriginalValues } = useForm<FormCreateStore>({
        name: '',
        nit: '',
    }, validationRulesCreateStore);  
};

# Documentación Detallada de Métodos useForm en React Native

## Propiedades y Métodos

### 1. form
**Descripción**: Objeto que contiene los valores actuales del formulario.
**Uso**:
```typescript
const MyComponent = () => {
  const { form } = useForm<FormData>(initialState);
  
  return (
    <TextInput
      value={form.email}
      placeholder="Email"
    />
  );
};
```

### 2. onChange
**Descripción**: Función para actualizar el valor de un campo específico.
**Uso**:
```typescript
const MyComponent = () => {
  const { onChange } = useForm<FormData>(initialState);
  
  return (
    <TextInput
      onChangeText={(text) => onChange(text, 'email')}
      placeholder="Email"
    />
  );
};
```

### 3. errors
**Descripción**: Objeto que contiene los mensajes de error para cada campo.
**Uso**:
```typescript
const MyComponent = () => {
  const { errors } = useForm<FormData>(initialState);
  
  return (
    <View>
      <TextInput />
      {errors.email && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}
    </View>
  );
};
```

### 4. isFieldValid
**Descripción**: Función que verifica si un campo específico es válido.
**Uso**:
```typescript
const MyComponent = () => {
  const { isFieldValid } = useForm<FormData>(initialState);
  
  const checkEmailValidity = () => {
    const isValid = isFieldValid('email');
    if (isValid) {
      // Proceder con la lógica
    }
  };
};
```

### 5. setFieldTouched
**Descripción**: Marca un campo como "tocado" (interactuado por el usuario).
**Uso**:
```typescript
const MyComponent = () => {
  const { setFieldTouched } = useForm<FormData>(initialState);
  
  return (
    <TextInput
      onFocus={() => setFieldTouched('email', true)}
      onBlur={() => setFieldTouched('email', true)}
    />
  );
};
```

### 6. touched
**Descripción**: Objeto que indica qué campos han sido interactuados.
**Uso**:
```typescript
const MyComponent = () => {
  const { touched, errors } = useForm<FormData>(initialState);
  
  return (
    <View>
      <TextInput />
      {touched.email && errors.email && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}
    </View>
  );
};
```

### 7. validateAllFields
**Descripción**: Función que valida todos los campos del formulario.
**Uso**:
```typescript
const MyComponent = () => {
  const { validateAllFields } = useForm<FormData>(initialState);
  
  const handleSubmit = () => {
    if (validateAllFields()) {
      // Proceder con el envío
    }
  };
  
  return (
    <Button
      title="Enviar"
      onPress={handleSubmit}
    />
  );
};
```

### 8. isFormValid
**Descripción**: Booleano que indica si todo el formulario es válido.
**Uso**:
```typescript
const MyComponent = () => {
  const { isFormValid } = useForm<FormData>(initialState);
  
  return (
    <Button
      title="Enviar"
      disabled={!isFormValid}
      onPress={handleSubmit}
    />
  );
};
```

### 9. resetForm
**Descripción**: Función que reinicia el formulario a su estado inicial.
**Uso**:
```typescript
const MyComponent = () => {
  const { resetForm } = useForm<FormData>(initialState);
  
  const handleCancel = () => {
    resetForm();
    // Lógica adicional
  };
  
  return (
    <Button
      title="Cancelar"
      onPress={handleCancel}
    />
  );
};
```

### 10. hasFormChanged
**Descripción**: Booleano que indica si el formulario ha sido modificado.
**Uso**:
```typescript
const MyComponent = () => {
  const { hasFormChanged } = useForm<FormData>(initialState);
  
  useEffect(() => {
    if (hasFormChanged) {
      // Mostrar advertencia de cambios sin guardar
      Alert.alert('Hay cambios sin guardar');
    }
  }, [hasFormChanged]);
};
```

### 11. setFormValue
**Descripción**: Función para actualizar múltiples campos simultáneamente.
**Uso**:
```typescript
const MyComponent = () => {
  const { setFormValue } = useForm<FormData>(initialState);
  
  const loadUserData = async () => {
    const userData = await fetchUserData();
    setFormValue({
      email: userData.email,
      name: userData.name,
      phone: userData.phone
    });
  };
};
```

### 12. updateOriginalValues
**Descripción**: Actualiza los valores originales del formulario y reinicia el estado de cambios.
**Uso**:
```typescript
const MyComponent = () => {
  const { updateOriginalValues } = useForm<FormData>(initialState);
  
  const handleSuccessfulSubmit = (response) => {
    // Actualizar valores originales después de guardar
    updateOriginalValues({
      ...response.data
    });
  };
};
```

## Ejemplo Completo de Implementación

```typescript
interface FormData {
  email: string;
  password: string;
  name: string;
}

const LoginScreen = () => {
  const initialState: FormData = {
    email: '',
    password: '',
    name: ''
  };

  const validationRules: ValidationRules<FormData> = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      required: true,
      minLength: 6
    },
    name: {
      required: true
    }
  };

  const {
    form,
    errors,
    touched,
    isFormValid,
    onChange,
    setFieldTouched,
    validateAllFields,
    resetForm
  } = useForm<FormData>(initialState, validationRules);

  const handleSubmit = () => {
    if (validateAllFields()) {
      // Lógica de envío
      console.log('Form data:', form);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={form.email}
        onChangeText={(text) => onChange(text, 'email')}
        onBlur={() => setFieldTouched('email')}
        placeholder="Email"
      />
      {touched.email && errors.email && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}

      <TextInput
        value={form.password}
        onChangeText={(text) => onChange(text, 'password')}
        onBlur={() => setFieldTouched('password')}
        secureTextEntry
        placeholder="Password"
      />
      {touched.password && errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <Button
        title="Submit"
        onPress={handleSubmit}
        disabled={!isFormValid}
      />

      <Button
        title="Reset"
        onPress={resetForm}
      />
    </View>
  );
};



*/