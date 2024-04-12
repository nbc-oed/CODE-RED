export const RedisKeys = {
  disasterStream: (area: string) => `disasterStream:${area}`,
  userLocationsStream: (area: string) => `user-locationsStream:${area}`,
  disasterData: (id: string) => `disasterData#${id}`,
  userLocationCache: (userId: number) => `user:${userId}:location`,
  userAreaCache: (userId: number) => `user:${userId}:area`,
  userNotificationsCache: (userId: number) => `user-notifications:${userId}`,
  lastTimestamp: (streamKey: string) => `${streamKey}:lastTimestamp`,
};
