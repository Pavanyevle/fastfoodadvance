import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator ,TouchableOpacity } from 'react-native';
import MapView, { Marker, AnimatedRegion, Polyline } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import polyline from '@mapbox/polyline';

const OrderTrackingScreen = ({ navigation,route }) => {
  const { username, order } = route.params;

  const [customerLocation, setCustomerLocation] = useState(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(''); 

  const mapRef = useRef(null);

  const deliveryLocation = useRef(
    new AnimatedRegion({
      latitude: 18.5202,
      longitude: 73.8567,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    })
  ).current;

  const FIREBASE_URL = "https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com";
  const GOOGLE_MAPS_API_KEY = "AIzaSyBnnea6FsohOdYqXhj3EEBsh1qVeSEUyf0"; // इथे actual API key टाक

  // Decode polyline points
  const decodePolyline = (encoded) => {
    const points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng
    }));
  };

  // Google Directions API call
  const getRoute = async (origin, destination) => {
  try {
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    console.log("Directions API Response:", res.data);

    if (res.data.routes.length) {
      const points = res.data.routes[0].overview_polyline.points;
      const coords = decodePolyline(points);
      setRouteCoords(coords);

      // ETA मिळवणे
      const leg = res.data.routes[0].legs[0];
      if (leg?.duration?.text) {
        setEta(leg.duration.text); // Example: "12 mins"
      }

      // Zoom map to fit route
      if (mapRef.current && coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } else {
      console.warn("No routes found:", res.data.status);
    }
  } catch (err) {
    console.error("Error fetching route:", err);
  }
};
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Customer location
        const customerRes = await axios.get(
          `${FIREBASE_URL}/users/${username}/deliveryLocation.json`
        );

        let tempCustomerLocation = null;
        if (customerRes.data?.latitude && customerRes.data?.longitude) {
          tempCustomerLocation = {
            latitude: parseFloat(customerRes.data.latitude),
            longitude: parseFloat(customerRes.data.longitude),
          };
          setCustomerLocation(tempCustomerLocation);
          setCustomerAddress(customerRes.data.address || '');
        }

        // Delivery Partner location
        const partnerRes = await axios.get(
          `${FIREBASE_URL}/deliveryPartner.json`
        );

        if (partnerRes.data?.latitude && partnerRes.data?.longitude) {
          const newLat = parseFloat(partnerRes.data.latitude);
          const newLng = parseFloat(partnerRes.data.longitude);

          deliveryLocation.timing({
            latitude: newLat,
            longitude: newLng,
            duration: 1000,
            useNativeDriver: false,
          }).start();

          setPartnerName(partnerRes.data.name || '');

          // जर दोन्ही लोकेशन उपलब्ध असतील तर route काढ
          if (tempCustomerLocation) {
            getRoute(
              { latitude: newLat, longitude: newLng },
              tempCustomerLocation
            );
          }
        }

      } catch (err) {
        console.log("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, [username]);

  if (loading || !customerLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7e5f" />
        <Text style={{ marginTop: 8 }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Delivery Partner Marker */}
        <Marker.Animated coordinate={deliveryLocation}>
          <Ionicons name="location" size={32} color="green" />
        </Marker.Animated>

        {/* Customer Marker */}
        <Marker coordinate={customerLocation}>
          <Ionicons name="location" size={32} color="red" />
        </Marker>

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#1E90FF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.orderId}>Order ID: {order.id}</Text>
        <Text style={styles.partner}>Partner: {partnerName}</Text>
        <Text style={styles.eta}>Delivered in {eta}</Text>
        <Text style={styles.addressLabel}>Delivery Address:</Text>
        <Text style={styles.address}>{customerAddress}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
   backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#8f8988ff',
    padding: 8,
    borderRadius: 50,
    zIndex: 10,
    elevation: 5,
  },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomCard: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  orderId: { fontSize: 18, fontWeight: 'bold' },
  partner: { fontSize: 16, color: '#555', marginTop: 5 },
  eta: { fontSize: 16, color: '#ff7e5f', marginVertical: 5 },
  addressLabel: { marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  address: { fontSize: 14, color: '#333', marginTop: 3 },
});

export default OrderTrackingScreen;
