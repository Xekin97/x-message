import { BOARDCAST_KEY, MSG_DATA_PREFIX } from "./constants";
import { Sender } from "./sender";
import { crypto, jsonStringify, uuid } from "./utils";

export interface FirstHandShakeData {
	SYNbit: number;
	Seqx: string;
}
export interface SecondHandShakeData {
	SYNbit: number;
	Seqy: string;
	ACKbit: number;
	ACKnum: string;
}
export interface ThirdHandShakeData {
	ACKbit: number;
	ACKnum: string;
}

export interface Message<Data = any> {
	senderId: string;
	source: string;
	target: string;
	messageId: string;
	meta: string;
	time: string;
	data: Data;
}

export type ConnectMeta =
	| "firstHandShake"
	| "secondHandShake"
	| "thirdHandShake";

function createMessage(
	senderId: string,
	data: any,
	targetUrl: string,
	meta: string
): Message {
	return {
		senderId,
		source: location.origin,
		target: targetUrl,
		messageId: uuid(MSG_DATA_PREFIX),
		time: String(Date.now()),
		meta,
		data,
	};
}

export function isMessage(msg: any): msg is Message {
	if (msg.target && msg.target !== location.origin) return false;
	return msg.messageId && msg.source && msg.senderId;
}

export function isBoardCastMessage(msg: Message) {
	return isMessage(msg) && msg.meta === BOARDCAST_KEY;
}

export class Poster {
	private token: string = "";

	get ready() {
		return this.token && this.sender.targetWindow && this.sender.targetUrl;
	}

	constructor(public sender: Sender, public onSend?: (data: any) => void) {}

	tcpLike_firstHandShake() {
		const SYNbit = 1;
		const Seqx = this.sender.senderId;

		return this.message({ SYNbit, Seqx }, "firstHandShake", false);
	}

	tcpLike_secondHandShake(data: FirstHandShakeData) {
		const { SYNbit, Seqx } = data;

		const ACKbit = 1;
		const ACKnum = crypto(Seqx);
		const Seqy = this.sender.senderId;

		this.token = ACKnum;

		return this.message(
			{ SYNbit, Seqy, ACKbit, ACKnum },
			"secondHandShake",
			false
		);
	}

	tcpLike_thirdHandShake(data: SecondHandShakeData) {
		const { Seqy, ACKbit } = data;

		const ACKnum = crypto(Seqy);

		this.token = ACKnum;

		return this.message({ ACKbit, ACKnum }, "thirdHandShake", false);
	}

	isMessageValid(msg: Message) {
		return crypto(msg.senderId) === this.token;
	}

	isMessage = isMessage;

	message(data: any, meta?: any, triggleEvent: boolean = true) {
		const { targetWindow, targetUrl } = this.sender;
		if (!targetWindow) return;

		const value = createMessage(this.sender.senderId, data, targetUrl, meta);
		targetWindow.postMessage(jsonStringify(value), "*");
		triggleEvent && this.onSend?.(value);
		return value;
	}
}
