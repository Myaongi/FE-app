import { Client } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = 'ws://54.180.54.51:8080/ws-chat';

let client: Client | null = null;

type ConnectionStatusListener = (isConnected: boolean, error?: any) => void;
const connectionListeners: Set<ConnectionStatusListener> = new Set();

export const addConnectionListener = (listener: ConnectionStatusListener) => {
  connectionListeners.add(listener);
};

export const removeConnectionListener = (listener: ConnectionStatusListener) => {
  connectionListeners.delete(listener);
};

const notifyConnectionStatus = (isConnected: boolean, error?: any) => {
  connectionListeners.forEach(listener => listener(isConnected, error));
};

export const getStompClient = (): Client => {
  if (client === null || !client.active) {
    client = new Client({
      brokerURL: WEBSOCKET_URL,
      
      webSocketFactory: () => {
        return new SockJS(WEBSOCKET_URL.replace('ws', 'http'));
      },

      beforeConnect: async function() {
        console.log('[STOMP] Attempting to connect...');
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          console.log('[STOMP] Access token found. Length:', accessToken.length);
          this.connectHeaders = {
            Authorization: `Bearer ${accessToken}`,
          };
        } else {
          console.error('[STOMP] No access token found for WebSocket connection');
        }
      },

      // ⭐⭐⭐ 핵심 수정 사항: 2단계 인증 로직 추가 ⭐⭐⭐
      onConnect: async () => { // async 키워드를 추가합니다.
        console.log('[STOMP] Client connected successfully!');
        notifyConnectionStatus(true);
        
        // --- 추가된 2단계 인증 메시지 전송 로직 ---
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          // client 객체가 존재하고, accessToken이 있을 경우에만 실행
          if (client && accessToken) {
            const authMsg = {
              type: "AUTH",
              token: accessToken
            };
            client.publish({
              destination: "/pub/chat",
              body: JSON.stringify(authMsg)
            });
            console.log('[STOMP] Sent application-level AUTH message successfully.');
          } else {
            console.error('[STOMP] Could not send AUTH message: Client is not available or no access token.');
          }
        } catch (error) {
            console.error('[STOMP] Error sending AUTH message:', error);
        }
        // --- 2단계 인증 로직 끝 ---
      },
      // ⭐⭐⭐ 수정 끝 ⭐⭐⭐

      onStompError: (frame) => {
        console.error('[STOMP] Broker reported error:', frame.headers['message']);
        console.error('[STOMP] Additional details:', frame.body);
        notifyConnectionStatus(false, new Error(frame.headers['message'] || 'STOMP Error'));
      },

      onWebSocketError: (event) => {
        console.error('[STOMP] WebSocket error:', event);
        notifyConnectionStatus(false, event);
      },

      onDisconnect: () => {
        console.log('[STOMP] Client disconnected.');
        notifyConnectionStatus(false);
      },
      
      debug: (str) => {
        console.log(new Date(), str);
      },

      reconnectDelay: 5000,
    });
  }
  return client;
};

export const deactivateClient = () => {
  if (client && client.active) {
    client.deactivate();
    console.log('STOMP client deactivated');
  }
};