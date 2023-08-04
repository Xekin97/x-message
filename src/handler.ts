import {
	MSG_ERROR_PREFIX,
	MSG_GET_PREFIX,
	MSG_REPLY_PREFIX,
	MSG_SET_PREFIX,
} from "./constants";
import { isBoardCastMessage, isMessage, Message, Poster } from "./poster";
import { Receiver } from "./receiver";
import { Sender } from "./sender";
import { ConnectStatus, Nullable } from "./types";

export class Handler {
	private connectStatus: ConnectStatus = "LISTEN";

	sender: Nullable<Sender> = null;
	receiver: Nullable<Receiver> = null;
	poster: Nullable<Poster> = null;

	get isConnected() {
		return this.connectStatus === "ESTAB";
	}

	get ready() {
		return Boolean(this.sender && this.poster && this.receiver);
	}

	get msgReady() {
		return this.ready && this.isConnected;
	}

	get send() {
		if (this.msgReady) return this.poster!.message;
		throw MSG_ERROR_PREFIX + "Unready to send message.";
	}

	constructor(
		public config?: {
			onMessage?: (data: Message) => void;
			onStatusChange?: (status: ConnectStatus) => void;
			messageFilter?: (msg: Message) => boolean;
		}
	) {}

	init() {
		this.sender = new HandlerSender();
		this.receiver = new HandlerReceiver();
		this.poster = new Poster(this.sender);

		this.receiver.addDispatcher(this.connectDispatch.bind(this));
		this.receiver.addDispatcher(this.replyDispatch.bind(this));
		this.receiver.addDispatcher(this.setDispatch.bind(this));
		this.receiver.addDispatcher(this.commonDispatch.bind(this));

		this.poster.message(true);
	}

	replyDispatch(msg: Message) {
		if (!this.msgReady || !this.poster?.isMessageValid(msg)) return;
		// [TODO]: Support other save type such as: Cookies, SesstionStorage
		if (msg.meta.startsWith(MSG_GET_PREFIX)) {
			const storage = this.receiver!.storage;
			const key = msg.data;
			const msgId = msg.messageId;
			const value = storage.getParsedItem(key);
			this.send(value, MSG_REPLY_PREFIX + msgId);
		}
	}

	setDispatch(msg: Message) {
		if (!this.msgReady || !this.poster?.isMessageValid(msg)) return;
		if (msg.meta.startsWith(MSG_SET_PREFIX)) {
			this.config?.onMessage?.(msg);
			const { key, value } = msg.data;
			const storage = this.receiver!.storage;
			value ? storage.setItem(key, value) : storage.removeItem(key);
		}
	}

	connectDispatch(msg: Message) {
		const data = msg.data;
		if (!isMessage(msg) || !this.ready) return;
		if (
			msg.meta === "firstHandShake" &&
			data.SYNbit === 1 &&
			this.connectStatus === "LISTEN"
		) {
			this.sender!.targetUrl = data.source;
			this.poster!.tcpLike_secondHandShake(data);
			this.changeStatus("SYNRCVD");
		} else if (
			msg.meta === "thirdHandShake" &&
			data.ACKbit === 1 &&
			this.connectStatus === "SYNRCVD"
		) {
			this.changeStatus("ESTAB");
		}
	}

	commonDispatch(msg: Message) {
		if (!this.msgReady || !this.poster?.isMessageValid(msg)) return;
		if (!msg.meta || isBoardCastMessage(msg)) {
			if (this.config?.messageFilter?.(msg) ?? true) {
				this.config?.onMessage?.(msg);
			}
		}
	}

	changeStatus(status: ConnectStatus) {
		this.connectStatus = status;
		this.config?.onStatusChange?.(status);
	}

	reset() {
		this.sender?.reset();
		this.sender = null;
		this.receiver?.reset();
		this.receiver = null;
		this.changeStatus("LISTEN");
	}
}

export class HandlerSender extends Sender {
	public targetWindow: Nullable<Window>;

	constructor() {
		super();
		this.targetWindow = window.top;
		this.targetUrl = document.referrer;
	}
}

export class HandlerReceiver extends Receiver {
	constructor() {
		super();
	}
}
