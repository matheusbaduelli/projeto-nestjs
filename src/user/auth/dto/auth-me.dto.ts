import { IsJWT, IsString, MinLength } from "class-validator";

export class AuthMeDTO{
    @IsJWT()
    token:string;
}