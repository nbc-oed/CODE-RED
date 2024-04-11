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
