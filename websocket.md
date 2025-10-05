URI : ws://54.180.54.51:8080/ws-chat
## ✅ 프론트(iOS)가 해야 할 일

1. 로그인 API 연동해서 accessToken 확보.
2. WebSocket 연결 시 JWT 자동으로 헤더에 넣어주기.
3. 채팅방 입장 시 해당 roomId 구독.
4. 메시지 보낼 때 `/pub/chat`으로 JSON 전송.
5. 서버에서 오는 메시지를 파싱해서 채팅 UI에 그리기.

일단 내가 html 로 연습해본건 여기 적어둘게

[https://www.notion.so/1-1-26ce7d1e7a038055bdfdc6f81e152011?pvs=25](https://www.notion.so/1-1-26ce7d1e7a038055bdfdc6f81e152011?pvs=21)

---

### 1. WebSocket 연결 (Connect)

- **URL**
    
    ```java
    ws://<서버주소>/ws-chat
    ```
    
    (배포 환경에서는 `ws://도메인/ws-chat`)
    
- **Headers**
    
    ```
    Authorization: Bearer <AccessToken>
    ```
    
    → 프론트는 로그인 후 발급받은 AccessToken을 넣어야 함.
    
    | 구분 | 내용 |
    | --- | --- |
    | **설명** | WebSocket 연결 후 반드시 AUTH 메시지를 먼저 보내 인증해야 함 |
    
    ### AUTH 메시지 (연결 직후 자동 전송)
    
- **자동 AUTH**
    
    연결 후 `onConnect` 시 다음 메시지를 서버에 보내야 세션이 인증됨:
    
    ```json
    {
      "type": "AUTH",
      "token": "<AccessToken>"
    }
    ```
    

---

### 2. 구독 (Subscribe)

- **Endpoint**
    
    ```
    /sub/chatroom/{chatroomId}
    
    ```
    
- **설명**
    
    특정 채팅방에 들어가면, 해당 채팅방 ID에 맞는 토픽을 구독해야 메시지를 받을 수 있음.
    
- **서버 → 클라이언트 응답 예시 (메시지 도착 시)**
    
    ```json
    {
      "chatroomId": 1,
      "messageId": 123,
      "senderId": 5,
      "content": "안녕 난 원희야~",
      "createdAt": "2025-09-18T09:30:12",
      "read": false}
    
    ```
    

---

### 3. 메시지 발송 (Publish)

- **Endpoint**
    
    ```java
    /pub/chat
    ```
    
- **Request Body**
    
    ```json
    {
      "type": "MESSAGE",
      "chatroomId": 1,
      "content": "안녕 난 원희야~"
    }
    
    ```
    
    - `type`: `"MESSAGE"` 고정
    - `chatroomId`: 현재 대화방 ID
    - `content`: 보낼 메시지
- **서버 처리**
    - 메시지를 DB에 저장
    - Redis Pub/Sub으로 같은 방 구독자에게 전파
    - (프론트는 별도의 response를 기다릴 필요 없이 `/sub/chatroom/{id}` 구독에서 바로 수신)

---

### 4. 메시지 수신 (서버 → 클라이언트)

- **예시**
    
    ```json
    {
      "chatroomId": 1,
      "messageId": 123,
      "senderId": 5,
      "content": "안녕 난 원희야~",
      "createdAt": "2025-09-18T09:30:12",
      "read": false}
    
    ```
    
- 설명:
    - `messageId`: 메시지 PK
    - `senderId`, `senderName`: 발신자 정보
    - `content`: 메시지 본문
    - `createdAt`: 메시지 보낸 시각
    - `readFlag`: 읽음 여부 (초기값 false)

---

- 메시지 → DB 저장 (`ChatMessageServiceImpl`)
- 동시에 Redis Pub → `RedisSubscriber`에서 받아서 `/sub/chatroom/{id}` 브로드캐스트
- 클라이언트는 해당 방만 구독하면 바로 실시간으로 받음 ✅
- **인증도 이미 있음**
    - `WebSocketConfig`에서 `Authorization: Bearer <토큰>` 처리.
    - 즉, 프론트에서 WebSocket 연결할 때 헤더/쿼리스트링에 토큰만 자동으로 넣어주면 됨.
    - 굳이 AUTH 메시지 따로 안 써도 됨.
- **프론트 처리만 하면 됨**
    - 로그인 성공 → 프론트(localStorage, cookie 등)에 토큰 저장.
    - WebSocket 연결 시 자동으로 토큰 첨부.
    - “채팅방 입장” 시 `/sub/chatroom/{id}` 구독하고 `/pub/chat`으로 메시지 전송.
    - 사용자는 그냥 채팅창에서 메시지 치면 끝 → 백엔드가 알아서 DB 저장 + 상대방에게 실시간 전송.

웹소켓 이용해서 실시간으로 1:1 채팅하는거 프론트쪽에서도 찾아봐야할듯.

---

## 📡 연동 흐름 (iOS)

1. **로그인 완료 → accessToken 확보**
    - 로그인 API 호출 후 서버에서 JWT 발급.
    - iOS에서 `UserDefaults` 나 `Keychain` 등에 저장.
2. **WebSocket 연결 시 토큰 포함해서 연결**
    - 백엔드 `WebSocketConfig`는 `Authorization: Bearer <토큰>`을 핸드셰이크에서 읽어.
    - iOS는 WebSocket 헤더에 이 토큰을 붙여서 연결하면 돼.
3. **채팅방 입장 시**
    - `chatroomId`에 맞는 토픽(`/sub/chatroom/{id}`)을 구독.
    - 메시지를 입력하면 `/pub/chat`으로 전송.
4. **실시간 메시지 수신**
    - 서버에서 Redis → `/sub/chatroom/{id}`로 브로드캐스트 → iOS가 받음 → 채팅 UI에 표시.

---

## 🛠 iOS 코드 예시 (Swift, Starscream 사용)

```swift
import Starscream

class ChatWebSocket: WebSocketDelegate {
    var socket: WebSocket!
    var isConnected = false
    let server = URL(string: "ws://localhost:8080/ws-chat")! // 실제 서버 주소

    func connect(accessToken: String) {
        var request = URLRequest(url: server)
        // JWT 토큰을 헤더에 추가
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        socket = WebSocket(request: request)
        socket.delegate = self
        socket.connect()
    }

    func websocketDidConnect(socket: WebSocketClient) {
        print("Connected")
        isConnected = true
        // 구독 예시 (STOMP라면 SUBSCRIBE 프레임을 직접 보내야 함)
        let subscribeMsg = """
        SUBSCRIBE
        id:sub-0
        destination:/sub/chatroom/1

        \u{00}
        """
        socket.write(string: subscribeMsg)
    }

    func websocketDidDisconnect(socket: WebSocketClient, error: Error?) {
        print("Disconnected: \(error?.localizedDescription ?? "")")
        isConnected = false
    }

    func websocketDidReceiveMessage(socket: WebSocketClient, text: String) {
        print("Received text: \(text)")
        // 서버에서 오는 메시지를 Chat UI에 뿌려주면 됨
    }

    func websocketDidReceiveData(socket: WebSocketClient, data: Data) {
        print("Received data: \(data.count)")
    }

    func sendMessage(chatroomId: Int, content: String) {
        // 메시지 전송 (STOMP SEND 프레임)
        let sendMsg = """
        SEND
        destination:/pub/chat
        content-type:application/json

        {"type":"MESSAGE","chatroomId":\(chatroomId),"content":"\(content)"}
        \u{00}
        """
        socket.write(string: sendMsg)
    }
}

```

---

## 📌 설명

- `Authorization` 헤더에 토큰 붙여서 연결 → 서버에서 자동 인증.
- 연결이 되면 **STOMP 프로토콜** 프레임을 직접 작성해서 SUBSCRIBE, SEND.
    - `/sub/chatroom/{id}` → 구독 (상대방 메시지 받기)
    - `/pub/chat` → 메시지 발송