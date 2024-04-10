import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  getChatPage(): string {
    return `<h1>WebSocket Chat Example</h1>
            <p>Open the client-side HTML page to establish WebSocket connection.</p>`;
  }
}
