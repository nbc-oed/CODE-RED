export type RedisStreamField = [string, string];
export type RedisStreamMessage = [string, RedisStreamField[]];
export type RedisStreamResult = [string, RedisStreamMessage[]];

export interface DisasterMessage {
  user_id: number;
  region: string;
  content: string;
  send_datetime: Date;
}

export interface NotificationMessage {
  user_id: number;
  content: string;
  send_datetime: Date;
}
