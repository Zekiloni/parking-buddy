import {Button, Text, StyleSheet, View, Modal, TextInput, FlatList} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {ref, push, onValue, update} from 'firebase/database';
import {User} from "firebase/auth";
import * as Location from 'expo-location';
import MapView, {LongPressEvent, Marker, PROVIDER_DEFAULT} from "react-native-maps";
import {database} from "@/firebase.config";
import {ParkingModel} from "@/domain/parking.model";
import {LocationSubscription} from "expo-location";
import firebase from "firebase/compat";
import Unsubscribe = firebase.Unsubscribe;
import {LatLng} from "react-native-maps/lib/sharedTypes";


export default function MainView(props: { user: User }) {
    const mapRef = useRef<MapView>(null);

    const [location, setLocation] = useState<LatLng | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [parkingLots, setParkingLots] = useState<ParkingModel[]>([]);
    const [createParkingModalVisible, setCreateParkingModalVisible] = useState(false);
    const [parkingLogInfoModalVisible, setParkingLotInfoModalVisible] = useState(false);
    const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingModel | null>(null);
    const [findParkingModalVisible, setFindParkingModalVisible] = useState(false);
    const [nearbyParkingLots, setNearbyParkingLots] = useState<ParkingModel[]>([]);
    const [parkingLocation, setParkingLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
    }>({latitude: null, longitude: null});
    const [parkingTitle, setParkingTitle] = useState('');
    const [parkingDescription, setParkingDescription] = useState('');
    const [parkingCapacity, setParkingCapacity] = useState('');
    let locationSubscription: LocationSubscription | null = null;
    let parkingLotsUnsubscribe: Unsubscribe | null = null;

    async function createLocationSubscription() {
        return await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 1
            },
            (newLocation) => {
                setLocation({
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                });
            }
        );
    }

    async function askForLocationPermission() {
        try {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied.');
                return;
            }

            locationSubscription = await createLocationSubscription();
        } catch (err) {
            setError(err.message);
        }
    }

    function subscribeToParkingLots() {
        const parkingRef = ref(database, 'parkingLots/');

        parkingLotsUnsubscribe = onValue(parkingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log(data)
                const parkingLotsArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                }));
                setParkingLots(parkingLotsArray);
            }
        });
    }

    useEffect(() => {
        askForLocationPermission()
            .then(subscribeToParkingLots);

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }

            if (parkingLotsUnsubscribe) {
                parkingLotsUnsubscribe();
            }
        };
    }, []);

    if (location === null) {
        return (
            <View style={styles.error}>
                <Text>Fetching location...</Text>
                {error && <Text>{error}</Text>}
            </View>
        );
    }

    function findParking() {
        const availableParkingLots = parkingLots
            .filter(parking => parking.capacity > parking.vehicles)
            .map(parking => ({
                ...parking,
                distance: calculateDistance(location!, parking.coordinates),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);

        setNearbyParkingLots(availableParkingLots);

        setFindParkingModalVisible(true);
    }

    function showCreateParkingModal(e: LongPressEvent) {
        setParkingLocation({
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude
        });
        setCreateParkingModalVisible(true);
    }

    function resetCreateParkingForm() {
        setCreateParkingModalVisible(false);
        setParkingTitle('');
        setParkingCapacity('0');
        setParkingLocation({latitude: null, longitude: null});
        setParkingDescription('');
    }

    function createParking() {
        if (!parkingTitle)
            return;
        const parkingRef = ref(database, 'parkingLots');

        const parking: ParkingModel = {
            title: parkingTitle,
            description: parkingDescription,
            coordinates: {
                latitude: parkingLocation.latitude!,
                longitude: parkingLocation.longitude!
            },
            capacity: parseInt(parkingCapacity),
            vehicles: 0,
            authorId: props.user.uid,
            createdAt: new Date(),
        }

        push(parkingRef, parking)
            .then(() => {
                resetCreateParkingForm();
                setParkingLots([...parkingLots, parking]);
            })
            .catch((error) => {
                console.error('Error creating parking:', error);
            });
    }

    function navigateMeTo(parking: ParkingModel) {
        console.log('navigated to,', parking);
    }

    function reserveSpot(selectedParkingLot: ParkingModel) {
        if (selectedParkingLot.vehicles < selectedParkingLot.capacity) {
            selectedParkingLot.vehicles += 1;
            updateParkingLot(selectedParkingLot);
        } else {
            console.log("No available spots to reserve!");
        }
    }

    function releaseSpot(selectedParkingLot: ParkingModel) {
        if (selectedParkingLot.vehicles > 0) {
            selectedParkingLot.vehicles -= 1;
            updateParkingLot(selectedParkingLot);
        } else {
            console.log("No vehicles to release!");
        }
    }

    function updateParkingLot(parking: ParkingModel) {
        const parkingRef = ref(database, `parkingLots/${parking.id}`);

        update(parkingRef, parking)
            .then(() => console.log("Spot released successfully in Firebase."))
            .catch((error) => console.error("Error releasing spot:", error));
    }


    const calculateDistance = (target: LatLng, destination: LatLng) => {
        const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

        const earthRadiusKm = 6371; // Radius of the Earth in kilometers

        const dLat = toRadians(destination.latitude - target.latitude);
        const dLon = toRadians(destination.longitude - target.longitude);

        const lat1 = toRadians(target.latitude);
        const lat2 = toRadians(destination.latitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadiusKm * c;
    }

    const renderParkingLotItem = ({ item }) => (
        <View style={styles.parkingLot}>
            <Text>{item.title}</Text>
            <Text>{item.capacity - item.vehicles} slobodnih mesta</Text>
            <Text>{item.distance.toFixed(2)}km</Text>
        </View>
    );

    return (

        <View style={styles.container}>
            <MapView
                style={styles.map}
                onMapReady={() => console.log('Map is ready')}
                provider={PROVIDER_DEFAULT}
                onError={(e) => console.error('Map error:', e.nativeEvent.error)}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onLongPress={(e) => showCreateParkingModal(e)}
            >
                    <Marker
                        coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        title="Nalazite se ovde!"
                    />

                {parkingLots.map((parking) => (
                    <Marker
                        key={parking.id}
                        pinColor="#1865bb"
                        coordinate={{
                            latitude: parking.coordinates.latitude,
                            longitude: parking.coordinates.longitude,
                        }}
                        title={parking.title}
                        onPress={() => {
                            setSelectedParkingLot(parking);
                            setParkingLotInfoModalVisible(true);
                        }}
                    >
                    </Marker>
                ))}
            </MapView>
            <Modal
                animationType="fade"
                transparent={true}
                visible={createParkingModalVisible}
                onRequestClose={() => setCreateParkingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kreiranje parkinga</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ime"
                            value={parkingTitle}
                            onChangeText={setParkingTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Opis"
                            value={parkingDescription}
                            onChangeText={setParkingDescription}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Kapacitet"
                            value={parkingCapacity}
                            onChangeText={setParkingCapacity}
                        />

                        <Button title="Kreiraj" onPress={createParking}/>
                        <Button title="Otkaži" onPress={() => setCreateParkingModalVisible(false)}/>
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={parkingLogInfoModalVisible}
                onRequestClose={() => setParkingLotInfoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text>Ime: {selectedParkingLot?.title}</Text>
                        <Text>Opis: {selectedParkingLot?.description || 'Nema'}</Text>
                        <Text>Dostupnih mesta: {selectedParkingLot?.capacity - selectedParkingLot?.vehicles}</Text>

                        <Button title="Navigiraj" onPress={() => navigateMeTo(selectedParkingLot!)}/>
                        {selectedParkingLot && selectedParkingLot.authorId === props.user.uid && (
                            <View style={styles.parkingOptions}>
                                <Button title="Zauzmi mesto" onPress={() => reserveSpot(selectedParkingLot!)}/>
                                <Button title="Oslobodi mesto" onPress={() => releaseSpot(selectedParkingLot!)}/>
                            </View>
                        )}

                        <Button title="Zatvori" onPress={() => setParkingLotInfoModalVisible(false)}/>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={findParkingModalVisible}
                onRequestClose={() => setFindParkingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text>Slobodna parking mesta u blizini {nearbyParkingLots.length}</Text>
                        <FlatList
                            data={nearbyParkingLots}
                            keyExtractor={(item) => item.id}
                            renderItem={renderParkingLotItem}
                        />
                        <Button title="Zatvori" onPress={() => setFindParkingModalVisible(false)}/>
                    </View>
                </View>
            </Modal>

            <View style={styles.controls}>
                <Button title={"Pronadji parking"} onPress={findParking}/>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    error: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        position: 'relative',
        flex: 1,
        alignItems: 'center',
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    controls: {
        width: '75%',
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    parkingOptions: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    parkingLot: {
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderColor: '#ddd',
        borderWidth: 1,
    },
});