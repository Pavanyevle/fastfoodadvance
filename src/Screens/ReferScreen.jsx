import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Image,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ReferScreen = ({ navigation,route }) => {
     const { username } = route.params; // ✅ username पास केला पाहिजे या screen ला
  const [referralCode, setReferralCode] = useState('...');




  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const res = await axios.get(
          `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${username}.json`
        );
        if (res.data && res.data.referralCode) {
          setReferralCode(res.data.referralCode);
        } else {
          setReferralCode('N/A');
        }
      } catch (err) {
        console.error('Error fetching referral code:', err);
        setReferralCode('ERROR');
      }
    };

    fetchReferralCode();
  }, []);


    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Get ₹100 off your first order on FastFood! Use my code ${referralCode} while signing up. Download now: https://fastfood.app.link/referral`,
            });
            if (result.action === Share.sharedAction) {
                console.log('Shared successfully!');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#22C55E" barStyle="light-content" />
            <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Refer & Earn</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <Image source={require('../img/refer.png')} style={styles.image} />

                <Text style={styles.title}>Earn ₹100 For Every Friend!</Text>
                <Text style={styles.subtitle}>
                    Invite your friends and earn rewards when they place their first order.
                </Text>

                <View style={styles.referralBox}>
                    <Text style={styles.referralLabel}>Your Referral Code</Text>
                    <Text style={styles.referralCode}>{referralCode}</Text>
                </View>

                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <LinearGradient colors={['#16A34A', '#15803D']} style={styles.shareGradient}>
                        <Ionicons name="share-social-outline" size={20} color="#fff" />
                        <Text style={styles.shareText}>Share with Friends</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ReferScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 6,
        marginRight: 70,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    headerText: {
        fontSize: 22,
        color: '#fff',
        fontWeight: 'bold',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    image: {
        width: 220,
        height: 220,
        marginBottom: 20,
        borderRadius:20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#065F46',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    referralBox: {
        backgroundColor: '#DCFCE7',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    referralLabel: {
        fontSize: 14,
        color: '#15803D',
        marginBottom: 5,
    },
    referralCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    shareBtn: {
        width: '100%',
    },
    shareGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    shareText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
