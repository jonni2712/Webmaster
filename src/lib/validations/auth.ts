import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Indirizzo email non valido'),
    password: z
      .string()
      .min(8, 'La password deve contenere almeno 8 caratteri')
      .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
      .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
      .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, 'Il nome deve contenere almeno 2 caratteri')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Indirizzo email non valido'),
  password: z.string().min(1, 'Password richiesta'),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Indirizzo email non valido'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La password deve contenere almeno 8 caratteri')
      .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
      .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
      .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
