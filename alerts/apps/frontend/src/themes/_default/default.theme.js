'use client';

/* * */

import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import '@mantine/notifications/styles.css';

/* * */

import '@/themes/_default/styles/reset.css';
import '@/themes/_default/styles/variables.css';
import '@/themes/_default/styles/wordpress.css';

/* * */

import AccordionOverride from '@/themes/_default/overrides/Accordion.module.css';
import ButtonOverride from '@/themes/_default/overrides/Button.module.css';
import PasswordInputOverride from '@/themes/_default/overrides/PasswordInput.module.css';
import SegmentedControlOverride from '@/themes/_default/overrides/SegmentedControl.module.css';
import SelectOverride from '@/themes/_default/overrides/Select.module.css';
import SkeletonOverride from '@/themes/_default/overrides/Skeleton.module.css';
import TextInputOverride from '@/themes/_default/overrides/TextInput.module.css';
import combineClasses from '@/utils/combineClasses';
import { Accordion, Button, createTheme, PasswordInput, SegmentedControl, Select, Skeleton, TextInput } from '@mantine/core';
import { IconCaretLeftFilled } from '@tabler/icons-react';

/* * */

export default createTheme({
	//

	components: {

		Accordion: Accordion.extend({
			classNames: () => {
				let defaultClasses = {
					chevron: AccordionOverride.chevron,
					content: AccordionOverride.content,
					control: AccordionOverride.control,
					icon: AccordionOverride.icon,
					item: AccordionOverride.item,
					label: AccordionOverride.label,
					root: AccordionOverride.root,
				};
				return defaultClasses;
			},
			defaultProps: {
				chevron: <IconCaretLeftFilled />,
			},
		}),

		Button: Button.extend({
			classNames: (_, props) => {
				let defaultClasses = {
					inner: ButtonOverride.inner,
					label: ButtonOverride.label,
					root: ButtonOverride.root,
					section: ButtonOverride.section,
				};
				if (props.variant === 'pill') {
					defaultClasses = combineClasses(defaultClasses, [ButtonOverride.variantPill]);
				}
				if (props.variant === 'primary') {
					defaultClasses = combineClasses(defaultClasses, [ButtonOverride.variantPrimary]);
				}
				if (props.variant === 'secondary') {
					defaultClasses = combineClasses(defaultClasses, [ButtonOverride.variantSecondary]);
				}
				if (props.variant === 'muted') {
					defaultClasses = combineClasses(defaultClasses, [ButtonOverride.variantMuted]);
				}
				return defaultClasses;
			},
		}),

		PasswordInput: PasswordInput.extend({
			classNames: () => {
				let defaultClasses = {
					input: PasswordInputOverride.input,
					section: PasswordInputOverride.section,
					wrapper: PasswordInputOverride.wrapper,
				};
				return defaultClasses;
			},
		}),

		SegmentedControl: SegmentedControl.extend({
			classNames: (_, props) => {
				let defaultClasses = {
					control: SegmentedControlOverride.control,
					indicator: SegmentedControlOverride.indicator,
					innerLabel: SegmentedControlOverride.innerLabel,
					label: SegmentedControlOverride.label,
					root: SegmentedControlOverride.root,
				};
				if (props.variant === 'white') {
					defaultClasses = combineClasses(defaultClasses, [SegmentedControlOverride.variantWhite]);
				}
				return defaultClasses;
			},
		}),

		Select: Select.extend({
			classNames: () => {
				let defaultClasses = {
					dropdown: SelectOverride.dropdown,
					input: SelectOverride.input,
					option: SelectOverride.option,
					section: SelectOverride.section,
					wrapper: SelectOverride.wrapper,
				};
				return defaultClasses;
			},
		}),

		Skeleton: Skeleton.extend({
			classNames: () => {
				let defaultClasses = {
					root: SkeletonOverride.root,

				};
				return defaultClasses;
			},
		}),

		TextInput: TextInput.extend({
			classNames: (_, props) => {
				let defaultClasses = {
					input: TextInputOverride.input,
					section: TextInputOverride.section,
					wrapper: TextInputOverride.wrapper,
				};
				if (props.size === 'sm') {
					defaultClasses = combineClasses(defaultClasses, [TextInputOverride.sizeSm]);
				}
				if (props.variant === 'white') {
					defaultClasses = combineClasses(defaultClasses, [TextInputOverride.variantWhite]);
				}
				return defaultClasses;
			},
		}),

	},

	fontFamily: 'var(--font-inter)',

	//
});
