import { Injectable } from '@nestjs/common';
import { LocationDto } from 'src/mayday/dto/location.dto';

@Injectable()
export class ChatService {
  // 사용자의 위치 정보를 기반으로 가장 가까운 룸의 ID를 반환하는 로직

  findClosestRegion(userLocation: LocationDto) {
    const regions = [
      {
        roomId: '1',
        name: '도심권',
        bounds: { lat: 37.5729, lon: 126.9794 },
      }, // 종로구
      {
        roomId: '1',
        name: '도심권',
        bounds: { lat: 37.5641, lon: 126.997 },
      }, // 중구
      {
        roomId: '1',
        name: '도심권',
        bounds: { lat: 37.5311, lon: 126.9814 },
      }, // 용산구

      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.5509, lon: 127.0407 },
      }, // 성동구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.5388, lon: 127.0827 },
      }, // 광진구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.5744, lon: 127.0395 },
      }, // 동대문구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.6065, lon: 127.0927 },
      }, // 중랑구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.6109, lon: 127.0273 },
      }, // 성북구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.6396, lon: 127.0257 },
      }, // 강북구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.6688, lon: 127.0471 },
      }, // 도봉구
      {
        roomId: '2',
        name: '동북권',
        bounds: { lat: 37.655, lon: 127.0778 },
      }, // 노원구

      {
        roomId: '3',
        name: '서북권',
        bounds: { lat: 37.6027, lon: 126.9288 },
      }, // 은평구
      {
        roomId: '3',
        name: '서북권',
        bounds: { lat: 37.5794, lon: 126.9368 },
      }, // 서대문구
      {
        roomId: '3',
        name: '서북권',
        bounds: { lat: 37.5662, lon: 126.9018 },
      }, // 마포구

      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.5271, lon: 126.8561 },
      }, // 양천구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.5509, lon: 126.8497 },
      }, // 강서구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.4954, lon: 126.8581 },
      }, // 구로구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.4574, lon: 126.8956 },
      }, // 금천구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.5265, lon: 126.8962 },
      }, // 영등포구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.4979, lon: 126.9828 },
      }, // 동작구
      {
        roomId: '4',
        name: '서남권',
        bounds: { lat: 37.4654, lon: 126.9436 },
      }, // 관악구

      {
        roomId: '5',
        name: '동남권',
        bounds: { lat: 37.4761, lon: 127.0376 },
      }, // 서초구
      {
        roomId: '5',
        name: '동남권',
        bounds: { lat: 37.5184, lon: 127.0473 },
      }, // 강남구
      {
        roomId: '5',
        name: '동남권',
        bounds: { lat: 37.5048, lon: 127.1147 },
      }, // 송파구
      {
        roomId: '5',
        name: '동남권',
        bounds: { lat: 37.5499, lon: 127.1465 },
      }, // 강동구
    ];

    let closestRegion = null;
    let closestDistance = Infinity;

    regions.forEach((region) => {
      const { bounds } = region;
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        bounds.lat,
        bounds.lon,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestRegion = region;
      }
    });

    return closestRegion;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }
}
