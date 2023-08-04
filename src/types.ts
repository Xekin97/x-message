export type Nullable<T> = null | T;

export type ConnectStatus =
	| "LISTEN"
	| "WAITSEND"
	| "SYNSENT"
	| "SYNRCVD"
	| "ESTAB";

export type StorageType = "Cookies" | "localStorage" | "SessionStorage";
