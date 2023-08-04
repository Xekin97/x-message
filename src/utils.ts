import { Nullable } from "./types";

export function isUrl(url: any): url is string {
	try {
		new URL(url);
		return true;
	} catch (e) {
		return false;
	}
}

export function crypto(str: string) {
	return "Get it baby," + str;
}

export function unCrypto(str: string) {
	return str.replace("Get it baby,", "");
}

export function uuid(prefix = "uid-") {
	return prefix + ~~(Math.random() * Math.pow(10, 16));
}

export function createIframe(
	target: string,
	hidden = false,
	timeout = 15000
): Promise<Nullable<HTMLIFrameElement>> {
	const iframe = document.createElement("iframe");
	if (hidden) {
		iframe.style.cssText =
			"position: fixed;top:1px;left:1px;width:1px;height:1px;z-index:-1;visibility:hidden";
	}
	return new Promise((resolve) => {
		let resolved = false;
		iframe.src = target;
		document.body.appendChild(iframe);
		setTimeout(() => {
			if (resolved) return;
			resolve(null);
			resolved = true;
		}, timeout);
		iframe.onload = () => {
			if (resolved) return;
			resolve(iframe);
			resolved = true;
		};
	});
}

export function polling<T>(
	getter: () => T,
	onGet: (result?: T) => void,
	maxTimes = 10,
	delay = 1000
) {
	if (maxTimes < 0) {
		onGet();
	}
	let times = maxTimes;
	setTimeout(() => {
		const result = getter();
		if (typeof result === "undefined") {
			polling(getter, onGet, times - 1, delay);
		} else {
			onGet(result);
		}
	}, delay);
}

export function asyncPolling<T>(
	getter: () => T,
	maxTimes = 10,
	delay = 1000
): Promise<T | void> {
	return new Promise((resolve) => {
		polling(
			getter,
			(result) => {
				resolve(result);
			},
			maxTimes,
			delay
		);
	});
}

export class CallbackQueue<T extends Function = () => void> {
	released = false;

	queue: T[] = [];

	push(func: T) {
		if (this.released) {
			func();
		} else {
			this.queue.push(func);
		}
	}

	release() {
		this.released = true;
		this.queue.forEach((func) => {
			func();
		});
	}

	pause() {
		this.released = false;
	}

	reset() {
		this.queue = [];
		this.released = false;
	}
}

export function jsonStringify(data: any) {
	return JSON.stringify(data);
}

export function parseStringJson(jsonStr: string) {
	return JSON.parse(jsonStr);
}

export function debugMsg(msg: any) {
	document.body.innerHTML = JSON.stringify(msg);
}
