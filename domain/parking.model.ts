import {User} from "firebase/auth";

export interface ParkingModel {
    title: string,
    description: string,
    coordinates: {
        latitude: number,
        longitude: number
    }
    capacity: number;
    vehicles: number;
    authorId: string;
    createdAt: Date;
}