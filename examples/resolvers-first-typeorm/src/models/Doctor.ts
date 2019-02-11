import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm';

import { Appointment } from './Appointment';
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

    @Field(type => [Appointment])
    @OneToMany(
        type => Appointment,
        appointment => appointment.doctor,
        { lazy: true }
    )
    appointments: Appointment[];
}
