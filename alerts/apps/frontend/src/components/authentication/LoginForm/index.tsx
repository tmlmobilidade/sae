'use client';

/* * */

import { TMLogo } from '@/components/common/AppLogos';
import Button from '@/components/common/Button';
import { Surface } from '@/components/layout/Surface';
import toast from '@/utils/toast';
import { PasswordInput, SimpleGrid, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { LoginDto, LoginDtoSchema } from '@tmlmobilidade/services/types';
import { useState } from 'react';

import { login } from '../actions/authentication';
import styles from './styles.module.css';

/* * */

export default function LoginForm() {
	//

	//
	// A. Setup variables
	const [isLoading, setIsLoading] = useState(false);

	//
	// B. Setup form

	const form = useForm<LoginDto>({
		clearInputErrorOnChange: true,
		mode: 'uncontrolled',
		validate: zodResolver(LoginDtoSchema),
	});

	//
	// C. Handle actions

	const handleSignIn = async () => {
		setIsLoading(true);
		try {
			await login(form.getValues());
			toast.success({
				message: 'Login successful',
			});
		}
		catch (error) {
			toast.error({
				message: error.message,
			});
		}
		finally {
			setIsLoading(false);
		}
	};

	//
	// D. Render components

	return (
		<Surface padding="lg">
			<div className={styles.logoWrapper}>
				<TMLogo />
			</div>
			<form onSubmit={form.onSubmit(handleSignIn)}>
				<SimpleGrid>
					<TextInput aria-label="email" placeholder="email@tmlmobilidate.com" {...form.getInputProps('email')} disabled={isLoading} />
					<PasswordInput aria-label="password" placeholder="Password" {...form.getInputProps('password')} disabled={isLoading} key={form.key('password')} />
					<Button label="Entrar" loading={isLoading} type="submit" variant="primary" />
				</SimpleGrid>
			</form>
		</Surface>
	);

	//
}
