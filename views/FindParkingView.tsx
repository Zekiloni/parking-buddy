import {Button, Text, StyleSheet, View} from "react-native";
import React, {useEffect, useState} from "react";
import * as Location from 'expo-location';
import MapView, {Marker, PROVIDER_DEFAULT} from "react-native-maps";


export default function FindParkingView() {
    const [location, setLocation] = useState<{
        latitude: number | null;
        longitude: number | null;
    }>({latitude: null, longitude: null});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Permission to access location was denied.');
                    return;
                }

                const {coords} = await Location.getCurrentPositionAsync({});
                setLocation({latitude: coords.latitude, longitude: coords.longitude});
            } catch (err) {
                setError(err.message);
            }
        })();
    }, []);

    if (location.latitude === null || location.longitude === null) {
        return (
            <View style={styles.container}>
                <Text>Fetching location...</Text>
            </View>
        );
    }

    function findParking() {

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
            >
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title="You are here!"
                />
            </MapView>
            <View style={styles.controls}>
                <Button title={"Find parking"} onPress={findParking}/>
                <Button title={"Create parking"} onPress={findParking}/>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
});