import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UtilsService {
  getUUID(): string {
    return uuidv4();
  }

  getPastTime(time: Date): string {
    const now = new Date();
    const minDiff = Math.floor((now.getTime() - time.getTime()) / 1000 / 60);
    if (minDiff < 60) {
      return `${minDiff}분 전`;
    } else {
      const hourDiff = Math.floor(minDiff / 60);
      if (hourDiff < 24) {
        return `${hourDiff}시간 전`;
      } else {
        const dayDiff = Math.floor(hourDiff / 24);
        return `${dayDiff}일 전`;
      }
    }
  }
}
