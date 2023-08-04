# x-message

# 前提

浏览器安全策略仅支持用户对自己管理的网站建立通信，所以通信的前提是所有的跨域或者非跨域的网页需要是用户自己的网站，并在网站中使用 x-message 方可建立临时通信连接。

当然，也无法跨浏览器程序进行连接，所有连接均为本地项目连接，不涉及服务端内容。

# 跨域网页通信工具

支持一对一跨域网页通信，支持广播目标网页

# 创建 1v1 的安全网页链接

通过仿 TCP 三次握手，创建两个网页之间独立的校验 hash，通过校验 hash 实现安全接收和发送。

# Usage

```typescript
// a.com

const hub = new MessageHub({
	target: "ums.com",
	autoConnect: true,
	onStatusChange(status) {
		console.log(status);
	},
	onMessage(e) {
		console.log("-------- A Message");
		console.log({ e });
	},
});

// ums.com

new MessageHub({
	onMessage(msg) {
		alert(JSON.stringify(msg));
	},
}).connect();
```

# Api

## send 发送消息

## get 从目标域获取数据

## set 设置目标域数据

## connect 建立连接

## disconnect 断开连接
