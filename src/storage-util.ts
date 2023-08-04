import { parseStringJson } from "./utils";

export class StorageUtil {
	private saveKeys: Set<string> = new Set();

	constructor(public onStorage: (e: StorageEvent) => void) {
		window.addEventListener("storage", this.onStorage);
	}

	init(onStorage: (e: StorageEvent) => void) {
		this.reset();
		this.onStorage = onStorage;
		window.addEventListener("storage", this.onStorage);
	}

	getItem(key: string) {
		return localStorage.getItem(key);
	}

	removeItem(key: string) {
		return localStorage.removeItem(key);
	}

	getParsedItem(key: string) {
		const item = this.getItem(key);
		if (!item) return;
		try {
			return parseStringJson(item);
		} catch (e) {
			return item;
		}
	}

	setItem(key: string, value: string) {
		this.saveKeys.add(key);
		return localStorage.setItem(key, value);
	}

	reset() {
		window.removeEventListener("storage", this.onStorage);
		[...this.saveKeys].forEach((key) => {
			localStorage.removeItem(key);
		});
		this.saveKeys.clear();
	}
}
