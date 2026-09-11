/**
 * Creates a recursive async proxy for a singleton class that delays method and property access until the instance is initialized.
 * Supports nested property chains like `await proxy.core.agencies.findById(id)` by recursively wrapping each property access
 * in a new proxy, resolving the full path only when the chain is invoked (called as a function or awaited).
 *
 * @param cls - A class with a static `getInstance` method that returns a promise resolving to the class instance.
 * @returns A proxy object that intercepts property access and method calls, ensuring the instance is initialized before resolving.
 */
export function asyncSingletonProxy<T extends object>(cls: { getInstance: () => Promise<T> }): T {
	function createProxy(pathSegments: (string | symbol)[]) {
		const resolver = (...args: unknown[]) => {
			return (async () => {
				const instance = await cls.getInstance();
				let value: unknown = instance;
				let receiver: unknown = undefined;
				for (const seg of pathSegments) {
					receiver = value;
					value = Reflect.get(value as object, seg, value);
				}
				if (typeof value === 'function') {
					return value.apply(receiver ?? instance, args);
				}
				return value;
			})();
		};

		return new Proxy(resolver, {
			get(_target, prop) {
				if (prop === 'then') return undefined;
				return createProxy([...pathSegments, prop]);
			},
		});
	}

	return createProxy([]) as unknown as T;
}
