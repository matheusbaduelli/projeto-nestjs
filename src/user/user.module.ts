import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from "@nestjs/common";
import { UserController } from "./user.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { userService } from "./user.service";
import { UserIdCheckMiddleware } from "src/middlewares/user-id-check.middleware";
import { AuthModule } from "./auth/auth.module";

@Module({
    imports:[PrismaModule,forwardRef(()=>AuthModule)],
    controllers:[UserController],
    providers:[userService],
    exports:[userService]
})
export class UserModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(UserIdCheckMiddleware).forRoutes({
            path:'users/:id',
            method: RequestMethod.ALL
        })
    }
}