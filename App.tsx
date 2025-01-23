import {StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from "react";
import {User} from "firebase/auth";
import AuthView from "./views/AuthView";
import {auth} from "./firebase.config";
import MainView from "./views/MainView";

export default function App() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    function userAuthenticated() {
        console.log('authenticated')
    }

    return (
        <View style={styles.container}>
            {!user ? (
                <AuthView onSignIn={userAuthenticated}/>
            ) : (
                <MainView user={user}/>
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
