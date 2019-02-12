import {
    Column,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm';

import { Field, ObjectType } from 'graphql-toolkit';

/**
 * The Doctor model is one of the simple models in the example. It is the one side of its one-to-many relationship with
 * the Appointment model.
 */
@ObjectType()
@Entity()
export class Doctor {
    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column()
    name: string;
}
