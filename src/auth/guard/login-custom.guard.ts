import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class loginJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 사용자가 인증되지 않은 경우
    if (err || !user) {
      const httpContext = context.switchToHttp();
      const response = httpContext.getResponse();
      return response.redirect('/auth/sign-in');
    }
    return user;
  }
}
