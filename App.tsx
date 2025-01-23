import {StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from "react";
import {User} from "firebase/auth";
import AuthView from "./views/AuthView";
import {auth} from "./firebase.config";
import FindParkingView from "./views/FindParkingView";

export default function App() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            {!user ? (
                <AuthView onSignIn={() => {
                }}/>
            ) : (
                <FindParkingView/>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
