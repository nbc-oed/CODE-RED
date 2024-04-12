import { Injectable } from '@nestjs/common';
import { DisasterMessage } from 'src/common/types/disaster-message.interface';

@Injectable()
export class DisasterMessageParserService {
  parseDisasterMessage(fields: [string, string][]): DisasterMessage {
    let messageData: Record<string, string> = {};
    fields.forEach(([key, value]) => {
      messageData[key] = value;
    });

    const parsedData = JSON.parse(messageData['message']);
    return {
      user_id: parseInt(parsedData.user_id),
      region: parsedData.large_category.join(', '),
      content: parsedData.message,
      send_datetime: new Date(parsedData.send_datetime),
    };
  }
}
