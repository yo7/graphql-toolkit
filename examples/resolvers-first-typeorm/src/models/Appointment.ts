import {
    Column,
    Entity,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn
} from 'typeorm';

import { Doctor } from './Doctor';
import { Patient } from './Patient';
import { Field, ObjectType } from 'graphql-toolkit';

/**
 * The Appointment model is a "junction model". It represents the many-to-many relationship between Doctor and Patient.
 * In this app, there is data related to this relationship (the date of the appointment), so this data gets added to
 * this model as a Column.
 * 
 * This model is the many side of the one-to-many relationships it has with the Doctor and Patient models.
 */
@ObjectType()
@Entity()
export class Appointment {
    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    date: Date;

    @Field(type => Doctor)
    @ManyToOne(
        type => Doctor,
        doctor => doctor.appointments,
        {
            nullable: false, // Can't use as part of composite primary key without this.
            lazy: true
        }
    )
    doctor: Promise<Doctor>;

    @Field(type => Patient)
    @ManyToOne(
        type => Patient,
        patient => patient.appointments,
        {
            nullable: false,
            lazy: true
        }
    )
    patient: Promise<Patient>;
}
