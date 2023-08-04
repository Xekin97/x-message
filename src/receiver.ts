import {
	MSG_EVENT_NAME,
	PERSIST_MSG_KEY,
	RECEIVER_ID_PREFIX,
} from "./constants";
import { isBoardCastMessage, isMessage, Message } from "./poster";
import { StorageUtil } from "./storage-util";
import { Nullable } from "./types";
import { CallbackQueue, parseStringJson, uuid } from "./utils";

type Dispatcher = <T = any>(msg: Message<T>) => void;

export class Receiver {
	public receiverId = uuid(RECEIVER_ID_PREFIX);

	protected queue = new CallbackQueue();

	protected dispatchers: Set<Dispatcher> = new Set();

	protected messageEvent: Nullable<(e: MessageEvent) => void> = null;

	public storage: StorageUtil = new StorageUtil(
		this.handleBoardcastEvent.bind(this)
	);

	constructor() {
		this.messageEvent = this.handleMessageEvent.bind(this);
		window.addEventListener(MSG_EVENT_NAME, this.messageEvent);
	}

	handleBoardcastEvent(e: StorageEvent) {
		try {
			console.log("boardcast", { e });
			if (e.key !== PERSIST_MSG_KEY) return;
			if (e.newValue) {
				const data = parseStringJson(e.newValue) as Message;
				if (isBoardCastMessage(data)) {
					this.dispatchMessage(data);
				}
			}
		} catch (e) {
			console.log(e);
			return;
		}
	}

	handleMessageEvent(e: MessageEvent) {
		try {
			const data = parseStringJson(e.data);
			if (isBoardCastMessage(data)) {
				// boardcast 消息交给 storageEvent 事件处理
				localStorage.setItem(PERSIST_MSG_KEY, e.data);
				return;
			}
			this.dispatchMessage(data);
		} catch (e) {
			// 丢弃
			return;
		}
	}

	onReceive(func: () => void) {
		this.queue.push(func);
	}

	ready() {
		this.queue.release();
	}

	addDispatcher(dispatcher: Dispatcher) {
		this.dispatchers.add(dispatcher);
	}

	removeDispatcher(dispatcher: Dispatcher) {
		this.dispatchers.delete(dispatcher);
	}

	dispatchMessage(data: any) {
		if (!isMessage(data)) return;
		this.dispatchers.forEach((func) => {
			func(data);
		});
	}

	reset() {
		this.storage?.reset();
		this.queue.reset();
		this.dispatchers.clear();
		this.messageEvent &&
			window.removeEventListener(MSG_EVENT_NAME, this.messageEvent);
		this.messageEvent = null;
	}
}
