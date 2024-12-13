/* * */

/**
 * Use to show children only when desktop theme is active. Hidden otherwise.
 * @param {ReactNode} children The content to display in desktop theme.
 * @returns {JSX.Element} The rendered BreakpointDesktop component.
 */

export function BreakpointDesktop({ children }) {
	return (
		<breakpoint-desktop>
			{children}
		</breakpoint-desktop>
	);
}

/**
 * Use to show children only when mobile theme is active. Hidden otherwise.
 * @param {ReactNode} children The content to display in mobile theme.
 * @returns {JSX.Element} The rendered BreakpointMobile component.
 */

export function BreakpointMobile({ children }) {
	return (
		<breakpoint-mobile>
			{children}
		</breakpoint-mobile>
	);
}

/**
 * BreakpointSwitch component to automatically toggle children components between mobile and desktop themes.
 * @param {ReactNode} mobile The content to display in mobile theme.
 * @param {ReactNode} desktop The content to display in desktop theme.
 * @returns {JSX.Element} The rendered BreakpointSwitch component.
 */

export function BreakpointSwitch({ desktop, mobile }) {
	return (
		<>
			<BreakpointDesktop>
				{desktop}
			</BreakpointDesktop>
			<BreakpointMobile>
				{mobile}
			</BreakpointMobile>
		</>
	);
}
