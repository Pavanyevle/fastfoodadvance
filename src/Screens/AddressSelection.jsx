// src/Screens/SelectAddressScreen.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  PermissionsAndroid,
  Platform,
  TextInput,
  FlatList,
  Keyboard,
  Animated as RNAnimated,
} from 'react-native';
import MapView, { Marker,MarkerAnimated, PROVIDER_GOOGLE, AnimatedRegion, Circle } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com';

const DEFAULT_COORD = { latitude: 19.0760, longitude: 72.8777 }; // Mumbai fallback

function sanitizeUserKey(raw) {
  if (!raw) return '';
  return raw.replace(/[.#$\[\]]/g, '_');
}

function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const SelectAddressScreen = ({ navigation,route }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const { totalItems, totalPrice, itemIds, quantities, username,  } = route.params;

  const [dbLocation, setDbLocation] = useState(null);
const [selectedLocation, setSelectedLocation] = useState(null);
const [selectedMarkerCoordinate, setSelectedMarkerCoordinate] = useState(null);

  const [location, setLocation] = useState(null);
  const [markerCoordinate, setMarkerCoordinate] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasGPSPermission, setHasGPSPermission] = useState(Platform.OS === 'ios');

  const pulseAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        RNAnimated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    requestAndLoadInitialLocation();
  }, []);


  
  const requestPermissionIfNeeded = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'SpeedyBite needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasGPSPermission(ok);
      return ok;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const requestAndLoadInitialLocation = async () => {
    setLoading(true);
    try {
      const rawUser = await AsyncStorage.getItem('username');
      if (!rawUser) {
        Alert.alert('Error', 'User not logged in');
        setLoading(false);
        return;
      }
      const userKey = sanitizeUserKey(rawUser);

      // 1) Try from DB (deliveryLocation)
      const dbRes = await axios.get(`${FIREBASE_DB_URL}/users/${userKey}/currentLocation.json`);
      if (dbRes.data && dbRes.data.latitude && dbRes.data.longitude) {
        const { latitude, longitude, address: savedAddress } = dbRes.data;
        initializeMap({ latitude, longitude }, savedAddress || '');
        setLoading(false);
        return;
      }

      // 2) GPS fallback
      const hasPermission = await requestPermissionIfNeeded();
      if (!hasPermission) {
        initializeMap(DEFAULT_COORD, 'Select or use current location');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          initializeMap({ latitude, longitude }, '');
          try {
            const addr = await reverseGeocode(latitude, longitude);
            setAddress(addr);
          } catch (e) {
            console.log('Geocode failed initial:', e);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          initializeMap(DEFAULT_COORD, 'Select or use current location');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error('DB fetch error:', err);
      initializeMap(DEFAULT_COORD, 'Select or use current location');
      setLoading(false);
    }
  };

  const initializeMap = (coord, initialAddress) => {
  setDbLocation(coord);
  setAddress(initialAddress || '');
  setSelectedLocation(coord);
  setLocation(coord);  // **Add this line**

  const animated = new AnimatedRegion({
    latitude: coord.latitude,
    longitude: coord.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  setSelectedMarkerCoordinate(animated);

  setTimeout(() => {
    mapRef.current?.animateToRegion(
      {
        ...coord,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  }, 250);
};


  const reverseGeocode = async (latitude, longitude) => {
    const resp = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'json', lat: latitude, lon: longitude, addressdetails: 1 },
      headers: { 'User-Agent': 'SpeedyBite/1.0' },
    });
    return resp?.data?.display_name || 'Unknown address';
  };

const onMarkerDragEnd = async (e) => {
  const { latitude, longitude } = e.nativeEvent.coordinate;
  const newLoc = { latitude, longitude };
  setSelectedLocation(newLoc);
  setLocation(newLoc);  // **Add this line**
  setLoading(true);
  try {
    const addr = await reverseGeocode(latitude, longitude);
    setAddress(addr);
  } catch (err) {
    Alert.alert('Error', 'Could not fetch address for selected location');
  }
  setLoading(false);
};

const onMapPress = async (e) => {
  Keyboard.dismiss();
  const { latitude, longitude } = e.nativeEvent.coordinate;
  const newLoc = { latitude, longitude };
  if (selectedMarkerCoordinate) {
    selectedMarkerCoordinate.timing({ latitude, longitude, duration: 500, useNativeDriver: false }).start();
  }
  setSelectedLocation(newLoc);
  setLocation(newLoc);  // **Add this line**
  setLoading(true);
  try {
    const addr = await reverseGeocode(latitude, longitude);
    setAddress(addr);
  } catch (err) {
    Alert.alert('Error', 'Could not fetch address for selected location');
  }
  setLoading(false);
};



 


  const searchPlaces = useMemo(
    () =>
      debounce(async (text) => {
        if (!text || text.length < 3) {
          setSuggestions([]);
          return;
        }
        try {
          setSearchLoading(true);
          const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: { format: 'json', q: text, addressdetails: 1, limit: 8 },
            headers: { 'User-Agent': 'SpeedyBite/1.0' },
          });
          setSuggestions(
            (resp.data || []).map((item) => ({
              id: `${item.place_id}`,
              title: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            }))
          );
        } catch (e) {
          console.log('Search error', e?.message);
        } finally {
          setSearchLoading(false);
        }
      }, 450),
    []
  );

  const onSelectSuggestion = async (s) => {
  Keyboard.dismiss();
  setSuggestions([]);
  setSearchQuery(s.title);

  const coord = { latitude: s.latitude, longitude: s.longitude };
  if (selectedMarkerCoordinate) {
    selectedMarkerCoordinate.timing({ ...coord, duration: 600, useNativeDriver: false }).start();
  }
  setSelectedLocation(coord);
  mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 700);
  setLoading(true);
  try {
    const addr = await reverseGeocode(coord.latitude, coord.longitude);
    setAddress(addr);
  } catch {}
  setLoading(false);
};


  const handleConfirm = async () => {
    if (!location || !address) {
      Alert.alert('Error', 'Please select a delivery location');
      return;
    }

    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        address,
      }));

      const rawUser = await AsyncStorage.getItem('username');
      const userKey = sanitizeUserKey(rawUser);
      if (userKey) {
        await axios.patch(`${FIREBASE_DB_URL}/users/${userKey}.json`, {
          deliveryLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address,
            lastUpdated: new Date().toISOString(),
          },
        });
      }

       navigation.navigate('PaymentScreen', {
          totalItems: totalItems,
          totalPrice: totalPrice,
          itemIds: itemIds,
          quantities: quantities,
          username: username,
          address: address,
        });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Could not save location');
    }
  };

  const pulseSize = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Delivery Location</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#667eea" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search place, area, landmark"
          value={searchQuery}
          placeholderTextColor='gray'
          onChangeText={(t) => {
            setSearchQuery(t);
            searchPlaces(t);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchLoading ? <ActivityIndicator size="small" color="#667eea" /> : null}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => onSelectSuggestion(item)}>
                <Ionicons name="location-outline" size={18} color="#495057" style={{ marginRight: 8 }} />
                <Text numberOfLines={2} style={styles.suggestionText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={
          location
            ? { ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            : { ...DEFAULT_COORD, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
        showsCompass
        showsMyLocationButton
        showsBuildings
        showsTraffic={false}
        onPress={onMapPress}
        ref={mapRef}
        customMapStyle={mapStyle}
      >
        {/* Live Location Marker (Green, non-draggable) */}
      {dbLocation && (
    <Marker
      coordinate={dbLocation}
      title="Saved Location"
      pinColor="purple"
      draggable={false}
    />
  )}

        {/* Selected Location Marker (Blue, draggable) */}
       {selectedMarkerCoordinate && (
    <MarkerAnimated
      ref={markerRef}
      coordinate={selectedMarkerCoordinate}
      title="Selected Location"
      description={address || 'Fetching address...'}
      draggable
      onDragEnd={onMarkerDragEnd}
    >
       <View style={styles.markerWrapper}>
      {/* Pulse animation removed */}
      <View style={styles.selectedMarker}>
        <Ionicons name="location" size={40} color="#169147ff" />
      </View>
    </View>
    </MarkerAnimated>
  )}
      </MapView>
        {/* Floating Recenter Button */}
        
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />

        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={24} color="#667eea" />
          {loading ? (
            <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 10 }} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {address || 'Select or use current location'}
            </Text>
          )}
        </View>

     

        <View style={styles.buttonContainer}>
         

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Elegant light map style
const mapStyle = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#0f5637ff" }, { lightness: 20 }]
  }
];
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginLeft: 15 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },

  searchContainer: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#2d3436' },

  suggestionsBox: {
    position: 'absolute',
    top: 146,
    left: 16,
    right: 16,
    maxHeight: 220,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceff3',
  },
  suggestionText: { flex: 1, color: '#495057', fontSize: 13 },

  mapContainer: { flex: 1 },
  map: { flex: 1 },

  markerWrapper: { alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(102, 126, 234, 0.35)',
  },
  customMarker: {
    padding: 8,
    backgroundColor: '#667eea',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  bottomSheetHandle: { width: 42, height: 4, backgroundColor: '#dee2e6', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },

  addressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 14, borderRadius: 12, marginBottom: 10 },
  addressText: { flex: 1, fontSize: 14, color: '#495057', marginLeft: 10 },

  coordsRow: { flexDirection: 'row', marginBottom: 10 },
  coordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f5fb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  coordText: { fontSize: 12, color: '#495057', marginLeft: 6 },

  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  currentLocationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef1ff', padding: 12, borderRadius: 12, flex: 1, marginRight: 10 },
  currentLocationText: { color: '#667eea', marginLeft: 8, fontWeight: '600' },
  confirmButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', padding: 12, borderRadius: 12, flex: 1 },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', flex: 1, textAlign: 'center' },
});

export default SelectAddressScreen;