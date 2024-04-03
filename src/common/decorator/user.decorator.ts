// import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
// import { Users } from "../entities/users.entity";

// export const UserInfo = createParamDecorator((data: keyof Users | undefined, context: ExecutionContext) => {
//     const req = context.switchToHttp().getRequest();

//     const user = req.user as Users

//     if(!user){
//         throw new InternalServerErrorException('Request에 user 프로퍼티가 존재하지 않습니다!');
//     }

//     if(data){
//         return user[data]
//     }
    
//     return user;
// });  

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const UserInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest(); //jwt 에서 토큰 잡아서?
    console.log(request.user)
    return request.user ? request.user : null;
  },
);