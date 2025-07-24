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


const SearchScreen = ({ navigation,route  }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('Popular');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const { username, address } = route.params;
const FIREBASE_URL = 'https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods.json';

const [searchResults, setSearchResults] = useState([]);
  const categories = [
    { id: '1', name: 'All', icon: 'restaurant' },
    { id: '2', name: 'Pizza', icon: 'pizza' },
    { id: '3', name: 'Burgers', icon: 'hamburger' },
    { id: '4', name: 'Desserts', icon: 'cake-variant' },
    { id: '5', name: 'Drinks', icon: 'cup-water' },
    { id: '6', name: 'Asian', icon: 'food-variant' },
    { id: '7', name: 'Indian', icon: 'food-indian' },
    { id: '8', name: 'Healthy', icon: 'food-apple' },
  ];

  const filters = [
    { id: '1', name: 'Popular' },
    { id: '2', name: 'Rating' },
    { id: '3', name: 'Price: Low to High' },
    { id: '4', name: 'Price: High to Low' },
    { id: '5', name: 'Delivery Time' },
  ];

  const fetchSearchResults = async (query) => {
  try {
    const response = await axios.get(FIREBASE_URL);
    const data = response.data;

    if (!data) {
      setSearchResults([]);
      return;
    }

    // Filter by name
    const filtered = Object.keys(data)
      .map((key) => ({ id: key, ...data[key] }))
      .filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );

    setSearchResults(filtered);
  } catch (error) {
    console.error('Search fetch error:', error);
  }
};
const handleSearch = (query) => {
  setSearchQuery(query);
  setIsSearching(query.length > 0);

  if (query.trim().length > 0) {
    fetchSearchResults(query);
  } else {
    setSearchResults([]); // Empty search
  }
};

  const popularSearches = [
    'Pizza', 'Burger', 'Dosa', 'Cake', 'Coffee', 'Biryani', 'Noodles'
  ];

  useEffect(() => {

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.selectedCategory
      ]}
      onPress={() => handleCategorySelect(item.name)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color={selectedCategory === item.name ? '#fff' : '#667eea'}
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.name && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        selectedFilter === item.name && styles.selectedFilter
      ]}
      onPress={() => handleFilterSelect(item.name)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === item.name && styles.selectedFilterText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

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

      <View style={styles.resultInfo}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <View style={styles.deliveryContainer}>
          <Ionicons name="time-outline" size={14} color="#667eea" />
          <Text style={styles.deliveryText}>{item.deliveryTime}</Text>
        </View>
      </View>

      <View style={styles.resultFooter}>
        <Text style={styles.categoryTag}>{item.category}</Text>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

  const renderPopularSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.popularSearchItem}
      onPress={() => handleSearch(item)}
    >
      <Text style={styles.popularSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />

      {/* Header */}
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
              ref={searchInputRef}
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
        
        {isSearching ? (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Search Results</Text>
    {searchResults.length > 0 ? (
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.resultsContainer}
      />
    ) : (
      <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
        No results found.
      </Text>
    )}
  </View>
) : (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Popular Searches</Text>
    <View style={styles.popularSearchesContainer}>
      {popularSearches.map((search, index) => (
        <TouchableOpacity
          key={index}
          style={styles.popularSearchItem}
          onPress={() => handleSearch(search)}
        >
          <Text style={styles.popularSearchText}>{search}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}

      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
}); 