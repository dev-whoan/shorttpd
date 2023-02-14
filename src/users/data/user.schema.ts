import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('username', ['username'], { unique: true })
@Entity({
  name: 'USER',
}) // USER : 테이블 명
export class UserEntity {
  @PrimaryGeneratedColumn()
  @IsNumber()
  @IsNotEmpty()
  seq: number;

  @IsString()
  @IsNotEmpty()
  @Column('text', {
    unique: true,
    nullable: false,
  })
  username: string;

  @Exclude()
  @IsString()
  @IsNotEmpty()
  @Column('text', {
    nullable: false,
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Column('text', {
    nullable: false,
    default: JSON.stringify({
      allowed: '*',
    }),
  })
  permission: string;
}
