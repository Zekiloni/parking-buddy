import {useState} from "react";
import {Button, StyleSheet, TextInput, View} from "react-native";
import {signInWithEmailAndPassword, createUserWithEmailAndPassword} from "@firebase/auth";
import {auth} from "@/firebase.config";

export default function AuthView({onSignIn}: { onSignIn: () => void }) {
    const [signIn, setSignIn] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSignIn();
        } catch (error) {
            console.error('Error signing in:', error.message);
        }
    };

    const handleSignUp = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            onSignIn();
        } catch (error) {
            console.error('Error signing up:', error.message);
        }
    };

    return (
        <View style={styles.authContainer}>
            <TextInput
                style={styles.input}
                placeholder="E-Adresa"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Lozinka"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <View style={styles.buttonContainer}>
                <Button
                    title={signIn ? "Prijavi se" : "Kreiraj Nalog"}
                    onPress={signIn ? handleSignIn : handleSignUp}
                />
            </View>
            <View style={styles.switchAuthContainer}>
                <Button
                    title={signIn ? "Kreiraj Nalog" : "Prijavi se"}
                    onPress={() => setSignIn(!signIn)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingLeft: 10,
    },
    buttonContainer: {
        marginBottom: 5,
    },
    switchAuthContainer: {
        marginTop: 5,
    },
});

