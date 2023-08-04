import { HANDLER_MANAGER, MASTER_MANAGER } from "./constants";
import { Handler } from "./handler";
import { Master } from "./master";
import { Message } from "./poster";
import { ConnectStatus, Nullable, StorageType } from "./types";
import { isUrl } from "./utils";

export interface ManagerConfig {
	target?: string;
	autoConnect?: boolean;
	onStatusChange?: (statu: ConnectStatus) => void;
	onSend?: (data: Message) => void;
	onMessage?: (data: Message) => void;
	filterMessage?: (
		source: string,
		senderId: string,
		message: Message
	) => boolean;
	debug?: boolean;
}

function isMasterManager(controller: any): controller is Master {
	return controller instanceof Master;
}

export class Manager {
	controller: Nullable<Master | Handler> = null;

	get connected() {
		return this.controller?.isConnected;
	}

	get managerType() {
		return window.top === window.self ? MASTER_MANAGER : HANDLER_MANAGER;
	}

	constructor(public config: ManagerConfig = {}) {
		switch (this.managerType) {
			case HANDLER_MANAGER:
				this.controller = new Handler({
					onMessage: config.onMessage,
					onStatusChange: config.onStatusChange,
				});
				break;
			case MASTER_MANAGER:
				const target = config.target;
				if (!isUrl(target)) return;
				this.controller = new Master({
					targetUrl: target,
					onSend: config.onSend,
					onStatusChange: config.onStatusChange,
				});
				break;
			default:
		}
		if (config.autoConnect) {
			this.connect();
		}
	}

	send(data: any) {
		return this.controller?.send?.(data);
	}

	get<T>(key: string, getType: StorageType = "localStorage") {
		if (isMasterManager(this.controller)) {
			return this.controller.get<T>(key, getType);
		}
	}

	set(key: string, value: any, setType: StorageType = "localStorage") {
		if (isMasterManager(this.controller)) {
			return this.controller.set(key, value, setType);
		}
	}

	connect() {
		if (this.connected) return this;
		this.controller?.init();
		return this;
	}

	disconnect() {
		this.controller?.reset();
		return this;
	}
}
