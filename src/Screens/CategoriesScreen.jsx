import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const categories = [
  { 
    id: '1', 
    name: 'Burgers', 
    image: require('../img/burger.jpeg'),
    icon: 'hamburger',
    itemCount: '24 items',
    color: ['#FF6B6B', '#FF8E8E']
  },
  { 
    id: '2', 
    name: 'Pizza', 
    image: require('../img/pizza.jpg'),
    icon: 'pizza',
    itemCount: '18 items',
    color: ['#4ECDC4', '#6EDDD6']
  },
  { 
    id: '3', 
    name: 'Salads', 
    image: require('../img/salad.jpg'),
    icon: 'food-apple',
    itemCount: '12 items',
    color: ['#45B7D1', '#6BC5D8']
  },
  { 
    id: '4', 
    name: 'Chicken', 
    image: require('../img/chiken.jpg'),
    icon: 'food-drumstick',
    itemCount: '15 items',
    color: ['#96CEB4', '#A8D5BA']
  },
  { 
    id: '5', 
    name: 'Desserts', 
    image: require('../img/dosa.jpg'),
    icon: 'cake-variant',
    itemCount: '20 items',
    color: ['#FFEAA7', '#FFE5B4']
  },
  { 
    id: '6', 
    name: 'Drinks', 
    image: require('../img/chole_bhature.jpg'),
    icon: 'cup-water',
    itemCount: '16 items',
    color: ['#DDA0DD', '#E6B3E6']
  },
  { 
    id: '7', 
    name: 'Asian', 
    image: require('../img/biryani.jpeg'),
    icon: 'food-variant',
    itemCount: '22 items',
    color: ['#FFB347', '#FFC266']
  },
  { 
    id: '8', 
    name: 'Indian', 
    image: require('../img/butter_chicken.jpg'),
    icon: 'food-indian',
    itemCount: '28 items',
    color: ['#FF6B9D', '#FF8FB1']
  },
  { 
    id: '9', 
    name: 'Healthy', 
    image: require('../img/paneer_tikka.jpg'),
    icon: 'food-apple',
    itemCount: '14 items',
    color: ['#98D8C8', '#A8E6CF']
  },
  { 
    id: '10', 
    name: 'Fast Food', 
    image: require('../img/chole_bhature.jpg'),
    icon: 'food-fork-drink',
    itemCount: '19 items',
    color: ['#F7DC6F', '#F8E5A0']
  },
];

const CategoriesScreen = ({ navigation }) => {
  const handleCategoryPress = (category) => {
    
    navigation.navigate('SearchScreen', { category: category.name });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
    >
      <LinearGradient
        colors={item.color}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={item.icon} size={30} color="#fff" />
          </View>
          
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.itemCount}>{item.itemCount}</Text>
          </View>
          
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.categoryImage} />
          </View>
        </View>
        
        <View style={styles.overlay}>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
     
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Food Categories</Text>
            <Text style={styles.headerSubtitle}>Explore all food types</Text>
          </View>
          
          <TouchableOpacity style={styles.searchBtn}onPress={() => navigation.navigate('SearchScreen')}
>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

     
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  searchBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  statLabel: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoriesList: {
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryGradient: {
    height: 160,
    position: 'relative',
  },
  categoryContent: {
    flex: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  imageContainer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  overlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 5,
  },
});
