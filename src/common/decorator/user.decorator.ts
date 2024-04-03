import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { Users } from "../entities/users.entity";

export const UserInfo = createParamDecorator((data: keyof Users | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const user = req.user as Users
    
    if(!user){
        throw new InternalServerErrorException('Request에 user 프로퍼티가 존재하지 않습니다!');
    }

    if(data){
        return user[data]
    }
    
    return user;
});  