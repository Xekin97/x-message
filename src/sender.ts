import { SENDER_ID_PREFIX } from "./constants";
import { Nullable } from "./types";
import { CallbackQueue, uuid } from "./utils";

export class Sender {
	public senderId = uuid(SENDER_ID_PREFIX);

	public targetWindow: Nullable<Window> = null;

	public targetUrl: string = "";

	protected queue = new CallbackQueue();

	constructor() {}

	ready() {
		this.queue.release();
	}

	onReady(func: () => void) {
		this.queue.push(func);
	}

	reset() {
		this.targetWindow = null;
		this.targetUrl = "";
		this.queue.reset();
	}
}
