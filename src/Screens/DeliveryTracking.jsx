import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const DeliveryTracking = () => {
  
  const deliveryBoyLocation = {
    latitude: 18.5204,
    longitude: 73.8567,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: deliveryBoyLocation.latitude,
          longitude: deliveryBoyLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={deliveryBoyLocation}
          title="Delivery Boy"
          description="Current Location"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default DeliveryTracking;
