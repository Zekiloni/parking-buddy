import {Button, Text, StyleSheet, View, Modal, TextInput} from "react-native";
import React, {useEffect, useState} from "react";
import {ref, push} from 'firebase/database';
import * as Location from 'expo-location';
import MapView, {LongPressEvent, Marker, PROVIDER_DEFAULT} from "react-native-maps";
import {database} from "@/firebase.config";
import {ParkingModel} from "@/domain/parking.model";
import {User} from "firebase/auth";
import {LocationSubscription} from "expo-location";


export default function MainView(props: { user: User }) {
    const [location, setLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
    }>({latitude: null, longitude: null});
    const [error, setError] = useState<string | null>(null);
    const [parkingLots, setParkingLots] = useState<ParkingModel[]>([]);
    const [createParkingModalVisible, setCreateParkingModalVisible] = useState(false);
    const [parkingLocation, setParkingLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
    }>({latitude: null, longitude: null});
    const [parkingTitle, setParkingTitle] = useState('');
    const [parkingDescription, setParkingDescription] = useState('');
    const [parkingCapacity, setParkingCapacity] = useState('');
    const [loading, setLoading] = useState(true); // To show loading indicator
    let locationSubscription:  LocationSubscription | null = null;

    function askForLocationPermission() {
        (async () => {
            try {
                let {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Permission to access location was denied.');
                    return;
                }

                locationSubscription = await Location.watchPositionAsync(
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
            } catch (err) {
                setError(err.message);
            }
        })();
    }

    useEffect(() => {
        askForLocationPermission();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    if (location.latitude === null || location.longitude === null) {
        return (
            <View style={styles.error}>
                <Text>Fetching location...</Text>
                {error && <Text>{error}</Text>}
            </View>
        );
    }

    function findParking() {

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
        const parkingRef = ref(database, 'parkings');

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
            </MapView>
            <Modal
                animationType="slide"
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
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
});