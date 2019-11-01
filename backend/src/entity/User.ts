import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min
} from 'class-validator'
import { UsersRank } from '~/src/matching'

export enum Gender {
  UNKNOWN = 'unknown',
  MALE = 'male',
  FEMALE = 'female'
}

export interface IUser {
  id?: string
  name: string
  gender: Gender
  age: number
  partnerId?: string | null
  partnerGender: Gender
  partnerMinAge: number
  partnerMaxAge: number
  answers: number[]
}

@Entity()
export default class User implements IUser {
  constructor(user: IUser) {
    if (user != null) {
      this.name = user.name
      this.gender = user.gender
      this.age = user.age
      this.partnerGender = user.partnerGender
      this.partnerMinAge = user.partnerMinAge
      this.partnerMaxAge = user.partnerMaxAge
      this.answers = user.answers
    }
  }

  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  readonly id!: string

  @Column()
  @IsString()
  @Length(1, 30)
  name: string = ''

  @Column('enum', { enum: Gender, default: Gender.UNKNOWN })
  @IsEnum(Gender)
  gender: Gender = Gender.UNKNOWN

  @Column()
  @IsInt()
  @Min(0)
  @Max(100)
  age: number = 0

  @Column('varchar', { nullable: true, default: null })
  @IsOptional()
  @IsUUID()
  partnerId: string | null = null

  @Column('enum', { enum: Gender, default: Gender.UNKNOWN })
  @IsEnum(Gender)
  partnerGender: Gender = Gender.UNKNOWN

  @Column()
  @IsInt()
  @Min(0)
  @Max(100)
  partnerMinAge: number = 0

  @Column()
  @IsInt()
  @Min(0)
  @Max(100)
  partnerMaxAge: number = 100

  @Column('real', { nullable: true, default: null })
  @IsOptional()
  @IsNumber()
  partnerDistance: number | null = null

  @Column('real', { nullable: true, default: null })
  @IsOptional()
  @IsNumber()
  partnerScore: number | null = null

  @Column('simple-json', { nullable: true, default: null })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetRanks: UsersRank[] | null = null

  @Column('simple-json')
  @IsArray()
  @IsIn([1, 2, 3, 4, 5], { each: true })
  answers: number[] = []

  @CreateDateColumn()
  @IsOptional()
  @IsDate()
  readonly createdAt?: Date

  @UpdateDateColumn()
  @IsOptional()
  @IsDate()
  readonly updatedAt?: Date
}
