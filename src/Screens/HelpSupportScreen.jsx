import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const HelpSupportScreen = ({ navigation,route }) => {
  const { username, address } = route.params;




    const handleChatPress = () => {
  if (username && address) {
    navigation.navigate('ChatBot', {
      username,
      address,
    });
  } else {
    alert('User info not found. Please login again.');
  }
};


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

            {/* Header */}
            <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.card}>
                    <Text style={styles.faqQuestion}>How do I place an order?</Text>
                    <Text style={styles.faqAnswer}>
                        Browse food items, add to cart, and proceed to payment. Orders will be delivered to your saved address.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.faqQuestion}>Can I cancel my order?</Text>
                    <Text style={styles.faqAnswer}>
                        Orders can be canceled within 5 minutes of placement from the 'My Orders' section.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.faqQuestion}>How do I contact customer support?</Text>
                    <Text style={styles.faqAnswer}>
                        You can use the options below to chat or email our support team.
                    </Text>
                </View>

                {/* Contact Options */}
                <Text style={styles.sectionTitle}>Need More Help?</Text>
                <TouchableOpacity
  style={styles.supportOption}
  onPress={handleChatPress}
>
  <Icon name="chatbubbles-outline" size={24} color="#4f46e5" />
  <Text style={styles.optionText}>Live Chat with Support</Text>
</TouchableOpacity>


                <TouchableOpacity
                    style={styles.supportOption}
                    onPress={() => Linking.openURL('mailto:pavanyevle6@gmail.com')}
                >
                    <Icon name="mail-outline" size={24} color="#4f46e5" />
                    <Text style={styles.optionText}>Email us at pavanyevle6@gmail.com</Text>
                </TouchableOpacity>



                <TouchableOpacity
                    style={styles.supportOption}
                    onPress={() => Linking.openURL('tel:+919144612496')}
                >
                    <Icon name="call-outline" size={24} color="#4f46e5" />
                    <Text style={styles.optionText}>Call us at +91 91446 12496</Text>
                </TouchableOpacity>



            </ScrollView>
        </SafeAreaView>
    );
};

export default HelpSupportScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4f46e5',
    },
    headerTitle: {
        color: '#fff',
        marginTop: 30,

        fontSize: 20,
        fontWeight: '700',
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 25,
        marginTop: 30,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    supportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
        marginLeft: 12,
    },
    feedbackBtn: {
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    feedbackGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    feedbackText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});
