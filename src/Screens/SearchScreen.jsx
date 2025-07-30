import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import Chat from './Chat'
import AsyncStorage from '@react-native-async-storage/async-storage';




const SearchScreen = ({ navigation, route }) => {
  // State for search query input (UI only)
  const [searchQuery, setSearchQuery] = useState('');
  // Username and address from navigation params
const [username, setUsername] = useState('');
const [address, setAddress] = useState('');
  // All foods state
  const [allFoods, setAllFoods] = useState([]);

  // Firebase foods endpoint
  const FIREBASE_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods.json';

  const fetchFoods = async (search = '') => {
  try {
    let response;

    if (search.trim() === '') {
      response = await axios.get(FIREBASE_URL);  
    } else {
      response = await axios.get(FIREBASE_URL, {
        params: {
          orderBy: '"name"',
          startAt: `"${search}"`,
          endAt: `"${search}\uf8ff"`,
        },
      });
    }

    const data = response.data;

    if (data) {
      const foods = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
      }));
      setAllFoods(foods);
    } else {
      setAllFoods([]);
    }
  } catch (error) {
    console.error('Error fetching foods:', error);
  }
};






//  const fetchFoods = async (search = '') => {
//   try {
//     const response = await axios.get(FIREBASE_URL); // नेहमी पूर्ण डेटा घे

//     const data = response.data;

//     if (data) {
//       let foods = Object.keys(data).map(key => ({
//         id: key,
//         ...data[key],
//       }));

//       // जर search query आहे तर client-side filtering कर
//       if (search.trim() !== '') {
//         const lowerSearch = search.toLowerCase();
//         foods = foods.filter(item =>
//           item.name.toLowerCase().includes(lowerSearch)
//         );
//       }

//       setAllFoods(foods);
//     } else {
//       setAllFoods([]);
//     }
//   } catch (error) {
//     console.error('Error fetching foods:', error);
//   }
// };


  useEffect(() => {
  fetchFoods();
}, []);


useEffect(() => {
  const fetchUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAddress = await AsyncStorage.getItem('address');

      if (storedUsername) setUsername(storedUsername);
      if (storedAddress) setAddress(storedAddress);
    } catch (e) {
      console.log('❌ Error fetching data from AsyncStorage:', e);
    }
  };

  fetchUserData();
  fetchFoods(); 
}, []);

const handleSearch = (query) => {
  setSearchQuery(query);
  fetchFoods(query); 
};



  // Render a single food item
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() =>
        navigation.navigate('ItemCard', {
          id: item.id,
          username: username,
          address: address,
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.resultImage} />
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultName}>{item.name}</Text>
          <View style={styles.vegIndicator}>
            <View
              style={[
                styles.vegDot,
                { backgroundColor: item.isVeg ? '#4CAF50' : '#f44336' },
              ]}
            />
          </View>
        </View>
        {item.description && (
          <Text style={styles.descriptionText}>{item.description}</Text>
        )}
        {item.restaurantName && (
          <Text style={styles.restaurantText}>By {item.restaurantName}</Text>
        )}
        {item.offers && (
          <Text style={styles.offerText}>{item.offers}</Text>
        )}
        {item.isAvailable === false && (
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        )}
        <Text style={styles.priceText}>₹{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  // Main UI render (UI same as before, but always shows allFoods)
  return (
    <View style={{flex:1}}>
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Header with back button and search input (UI only) */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#667eea" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#667eea" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Foods</Text>
          {allFoods.length > 0 ? (
            <FlatList
              data={allFoods}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.resultsContainer}
            />
          ) : (
            <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
              No foods found.
            </Text>
          )}
          
        </View>
      </ScrollView>
      
    </SafeAreaView>
            <Chat  />

    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,

    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 10,

    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
    marginRight: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3436',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: '#667eea',
  },
  categoryText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 5,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  filtersContainer: {
    paddingRight: 20,
  },
  filterItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFilter: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 15,

    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    flex: 1,
    marginRight: 10,
  },
  vegIndicator: {
    padding: 2,
  },
  vegDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    fontSize: 14,
    color: '#2d3436',
    marginLeft: 3,
    fontWeight: '500',
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 3,
    fontWeight: '500',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 12,
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2d3436',
  },
  popularSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularSearchItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  popularSearchText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 5,
  },

  restaurantText: {
    fontSize: 12,
    color: '#b2bec3',
    fontStyle: 'italic',
  },

  offerText: {
    fontSize: 13,
    color: '#d63031',
    fontWeight: 'bold',
    marginTop: 5,
  },

  outOfStockText: {
    fontSize: 13,
    color: '#e17055',
    marginTop: 5,
    fontWeight: 'bold',
  },

}); 