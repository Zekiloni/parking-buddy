import {Button, Text, StyleSheet, View} from "react-native";
import React, {useEffect, useState} from "react";
import Geolocation from '@react-native-community/geolocation';
import * as Location from 'expo-location';
import MapView, {Marker} from "react-native-maps";


export default function FindParkingView() {
    const [location, setLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
    }>({ latitude: null, longitude: null });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // Ask for location permissions
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Permission to access location was denied.');
                    return;
                }

                // Get the user's current position
                const { coords } = await Location.getCurrentPositionAsync({});
                setLocation({ latitude: coords.latitude, longitude: coords.longitude });
            } catch (err) {
                setError(err.message);
            }
        })();
    }, []);

    if (location.latitude === null || location.longitude === null) {
        return (
            <View style={styles.container}>
                <Text>Fetching location...</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text>Current Location:</Text>
            <Text>
                Latitude: {location.latitude}, Longitude: {location.longitude}
            </Text>
            <MapView
                style={styles.map}
                onMapReady={() => console.log('Map is ready')}
                onError={(e) => console.error('Map error:', e.nativeEvent.error)}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="You are here!"
                />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
    map: {
        width: '100%',
        height: '70%',
    },
});