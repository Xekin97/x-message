import {
	BOARDCAST_KEY,
	GET_MSG_TIME_OUT,
	MSG_ERROR_PREFIX,
	MSG_EVENT_NAME,
	MSG_GET_PREFIX,
	MSG_REPLY_PREFIX,
	MSG_SET_PREFIX,
} from "./constants";
import { Message, Poster } from "./poster";
import { Receiver } from "./receiver";
import { Sender } from "./sender";
import { ConnectStatus, Nullable, StorageType } from "./types";
import { createIframe, crypto } from "./utils";

export class Master {
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
		public config: {
			targetUrl: string;
			onSend?: (data: any) => void;
			onStatusChange?: (statu: ConnectStatus) => void;
			onMessage?: (msg: Message) => boolean;
		}
	) {}

	get<T>(key: string, getType: StorageType) {
		if (key.length < 1) return;
		const sendMsg = this.send(key, MSG_GET_PREFIX + getType);
		if (!sendMsg) throw MSG_ERROR_PREFIX + "Failed to send message.";
		const receiver = this.receiver!;

		let got = 1 as any;
		return new Promise<T>((resolve, reject) => {
			setTimeout(() => {
				if (got) reject(MSG_ERROR_PREFIX + "Get data time out.");
			}, GET_MSG_TIME_OUT);

			function getterDispatch(msg: Message) {
				const [, msgId] = msg.meta.split(MSG_REPLY_PREFIX);
				if (msgId === sendMsg?.messageId) {
					got = null;
					resolve(msg.data);
					receiver.removeDispatcher(getterDispatch);
				}
			}

			receiver.addDispatcher(getterDispatch);
		});
	}

	set(key: string, value: any, setType: StorageType) {
		return this.send({ key, value }, MSG_SET_PREFIX + setType);
	}

	delete(key: string, setType: StorageType) {
		return this.set(key, "", setType);
	}

	boardcast(data: any) {
		return this.send(data, BOARDCAST_KEY);
	}

	init() {
		const { targetUrl } = this.config;
		this.sender = new MasterSender(targetUrl);
		this.receiver = new MasterReceiver();
		this.poster = new Poster(this.sender);
		const receiver = this.receiver;
		const poster = this.poster;

		this.changeConnectStatus("WAITSEND");

		this.sender.onReady(() => {
			poster.tcpLike_firstHandShake();
			this.changeConnectStatus("SYNSENT");
		});

		receiver.addDispatcher(this.connectDispatch.bind(this));
	}

	connectDispatch(msg: Message) {
		if (!this.ready || msg.meta !== "secondHandShake") return;
		const data = msg.data;
		if (
			data.SYNbit === 1 &&
			data.ACKbit === 1 &&
			data.ACKnum === crypto(this.sender!.senderId)
		) {
			this.poster!.tcpLike_thirdHandShake(data);
			this.changeConnectStatus("ESTAB");
			this.receiver!.removeDispatcher(this.connectDispatch);
		}
	}

	changeConnectStatus(status: ConnectStatus) {
		this.connectStatus = status;
		this.config.onStatusChange?.(status);
	}

	reset() {
		this.sender?.reset();
		this.sender = null;
		this.receiver?.reset();
		this.receiver = null;
		this.changeConnectStatus("LISTEN");
	}
}

export class MasterSender extends Sender {
	public iframe: Nullable<HTMLIFrameElement> = null;

	constructor(public targetUrl: string) {
		super();
		Promise.all([
			this.checkReady(),
			createIframe(targetUrl).then((iframe) => {
				if (iframe) {
					this.iframe = iframe;
					this.targetWindow = iframe?.contentWindow;
				} else {
					throw MSG_ERROR_PREFIX + "Failed to create iframe.";
				}
				return iframe;
			}),
		]).then(() => {
			this.ready();
		});
	}

	checkReady() {
		return new Promise((resolve) => {
			function check(e: MessageEvent) {
				try {
					const data = JSON.parse(e.data);
					if (data.target.startsWith(location.origin) && data.data) {
						resolve(true);
						window.removeEventListener(MSG_EVENT_NAME, check);
					}
				} catch (e) {}
			}
			window.addEventListener(MSG_EVENT_NAME, check);
		});
	}

	reset() {
		this.queue.reset();
		this.targetUrl = "";
		this.targetWindow = null;
		this.iframe?.remove();
		this.iframe = null;
	}
}

export class MasterReceiver extends Receiver {
	constructor() {
		super();
	}
}
