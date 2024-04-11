import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const jwtCookie = request.cookies['jwt']; // 쿠키에서 jwt 추출

    if (!jwtCookie) {
      return false; // JWT가 없는 경우 인증 실패
    }

    // JWT가 있는 경우, JWT를 검증하고 결과에 따라 인증 성공 또는 실패 반환
    try {
      const payload = this.jwtService.verify(jwtCookie);
      request.user = payload; // 요청 객체에 사용자 정보 추가
      return true; // JWT 검증 성공, 인증 허용
    } catch (error) {
      return false; // JWT 검증 실패, 인증 거부
    }
  }
}
