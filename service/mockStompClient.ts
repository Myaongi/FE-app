import { IMessage } from '@stomp/stompjs';

// websocket.md에 명시된 서버 -> 클라이언트 메시지 형식을 따릅니다.
export interface MockMessage {
  chatroomId: number;
  messageId: number;
  senderId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

// 가짜 STOMP 클라이언트
export class MockStompClient {
  private connected = false;
  private onConnectCallback: (() => void) | null = null;
  private subscriptionCallback: ((message: IMessage) => void) | null = null;
  private connectTimeout: NodeJS.Timeout | null = null;
  private messageCounter = 0;

  // Client.activate()를 흉내 냅니다.
  public activate(): void {
    console.log('[MockStompClient] Activating...');
    this.connectTimeout = setTimeout(() => {
      this.connected = true;
      console.log('[MockStompClient] ✅ Connected.');
      if (this.onConnectCallback) {
        this.onConnectCallback();
      }
    }, 500); // 0.5초 후 연결 성공
  }

  // Client.deactivate()를 흉내 냅니다.
  public deactivate(): void {
    console.log('[MockStompClient] Deactivating...');
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
    }
    this.connected = false;
    console.log('[MockStompClient] 🔌 Disconnected.');
  }

  // Client.subscribe()를 흉내 냅니다.
  public subscribe(destination: string, callback: (message: IMessage) => void): void {
    console.log(`[MockStompClient] ➡️ Subscribed to ${destination}`);
    this.subscriptionCallback = callback;

    // 구독 후 1초 뒤에 환영 메시지를 보냅니다.
    setTimeout(() => {
      this.simulateIncomingMessage({
        senderId: 999, // 시스템 메시지 ID
        content: '채팅방에 입장했습니다. 🐶',
      });
    }, 1000);
  }

  // Client.publish()를 흉내 냅니다.
  public publish(options: { destination: string; body: string }): void {
    if (!this.connected) {
      console.error('[MockStompClient] ❌ Cannot publish: not connected.');
      return;
    }

    console.log(`[MockStompClient] ➡️ Publishing to ${options.destination}`);
    const outgoingMessage = JSON.parse(options.body);

    // 내가 보낸 메시지를 즉시 에코 (서버에서 받은 것처럼)
    this.simulateIncomingMessage({
      senderId: 1, // 가정: 현재 로그인한 사용자의 ID가 1이라고 가정
      content: outgoingMessage.content,
    });

    // 2초 후에 상대방이 답장하는 것을 시뮬레이션
    setTimeout(() => {
      this.simulateIncomingMessage({
        senderId: 2, // 가정: 상대방 ID가 2라고 가정
        content: `'${outgoingMessage.content}' 라고 하셨네요. 저는 봇입니다. 🤖`,
      });
    }, 2000);
  }

  // 서버로부터 메시지를 받는 상황을 시뮬레이션하는 내부 함수
  private simulateIncomingMessage(msg: { senderId: number; content: string }) {
    if (!this.subscriptionCallback) return;

    this.messageCounter++;
    const mockMessage: MockMessage = {
      chatroomId: 1, // 고정된 채팅방 ID
      messageId: new Date().getTime(), // 유니크한 ID 생성
      senderId: msg.senderId,
      content: msg.content,
      createdAt: new Date().toISOString(),
      read: true,
    };

    // IMessage 형식에 맞게 body를 JSON 문자열로 변환
    const iMessage: IMessage = {
      body: JSON.stringify(mockMessage),
      ack: () => {},
      nack: () => {},
      headers: {},
      command: 'MESSAGE',
      binaryBody: new Uint8Array(),
      isBinaryBody: false,
    };

    console.log('[MockStompClient] 📩 Simulating incoming message:', mockMessage);
    this.subscriptionCallback(iMessage);
  }

  // onConnect 콜백을 설정하는 public 메서드
  public set onConnect(callback: () => void) {
    this.onConnectCallback = callback;
  }
}