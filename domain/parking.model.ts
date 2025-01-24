import {LatLng} from "react-native-maps/lib/sharedTypes";


export interface ParkingModel {
    id?: string
    title: string,
    description: string,
    coordinates: LatLng
    capacity: number;
    vehicles: number;
    authorId: string;
    createdAt: Date;
}

export interface NearbyParkingLot extends ParkingModel {
    distance: number;
}