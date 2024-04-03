import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuthService } from "../auth.service";
import { string } from "joi";
import { UsersService } from "src/users/users.service";

export class BearerTokenGuard implements CanActivate{
    constructor (private readonly authService: AuthService,
        private readonly usersService:UsersService){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const rawToken = req.headers['authorization'];

        if(!rawToken){
            throw new UnauthorizedException('토큰이 존재하지 않습니다.');
        }

        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const result = await this.authService.verifyToken(await token);

        const user = await this.usersService.getUserByEmail(result.email);

        req.user = user;
        req.token = token;
        req.tokenType = result.type;

        return true;
    }
    }

    @Injectable()
    export class AccessTokenGuard extends BearerTokenGuard{
        async canActivate(context: ExecutionContext): Promise<boolean> {
            await super.canActivate(context);

            const req = context.switchToHttp().getRequest();

            if(req.tokenType !== 'access'){
                throw new UnauthorizedException('AccessToken 이 아닙니다.')
            }

            return true;
        }
    }

    @Injectable()
    export class RefreshTokenGuard extends BearerTokenGuard{
        async canActivate(context: ExecutionContext): Promise<boolean> {
            await super.canActivate(context);

            const req = context.switchToHttp().getRequest();

            if(req.tokenType !== 'refresh'){
                throw new UnauthorizedException('AccessToken 이 아닙니다.')
            }

            return true;
        }
    }