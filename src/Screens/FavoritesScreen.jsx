import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const FavoritesScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('restaurants');
 
    
  const tabs = [
    { id: 'restaurants', label: 'Restaurants', icon: 'restaurant-outline' },
    { id: 'dishes', label: 'Dishes', icon: 'fast-food-outline' },
  ];

  const removeFromFavorites = (type, id) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFavorites(prev => ({
              ...prev,
              [type]: prev[type].filter(item => item.id !== id)
            }));
          }
        },
      ]
    );
  };

  const renderTabButton = (tab) => {
    const isSelected = selectedTab === tab.id;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[styles.tabButton, isSelected && styles.selectedTabButton]}
        onPress={() => setSelectedTab(tab.id)}
      >
        <Icon 
          name={tab.icon} 
          size={20} 
          color={isSelected ? '#fff' : '#6366f1'} 
        />
        <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
    >
      <LinearGradient
        colors={['#fff', '#f8fafc']}
        style={styles.restaurantCardGradient}
      >
        <View style={styles.restaurantImageContainer}>
          <Image source={{ uri: item.image }} style={styles.restaurantImage} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => removeFromFavorites('restaurants', item.id)}
          >
            <Icon name="heart" size={20} color="#dc2626" />
          </TouchableOpacity>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <View style={styles.cuisineBadge}>
              <Text style={styles.cuisineText}>{item.cuisine}</Text>
            </View>
          </View>

          <View style={styles.restaurantDetails}>
            <View style={styles.detailItem}>
              <Icon name="time-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.deliveryTime}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="bicycle-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.deliveryFee}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="card-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>Min ₹{item.minOrder}</Text>
            </View>
          </View>

          <View style={styles.popularDishes}>
            <Text style={styles.popularDishesTitle}>Popular Dishes:</Text>
            <Text style={styles.popularDishesText}>
              {item.dishes.slice(0, 2).join(', ')}
            </Text>
          </View>

          <View style={styles.restaurantFooter}>
            <View style={styles.reviewsInfo}>
              <Icon name="chatbubble-outline" size={14} color="#64748b" />
              <Text style={styles.reviewsText}>{item.reviews} reviews</Text>
            </View>
            <TouchableOpacity style={styles.orderButton}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.orderButtonGradient}
              >
                <Text style={styles.orderButtonText}>Order Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDishCard = ({ item }) => (
    <TouchableOpacity
      style={styles.dishCard}
      onPress={() => navigation.navigate('DishDetail', { dish: item })}
    >
      <LinearGradient
        colors={['#fff', '#f8fafc']}
        style={styles.dishCardGradient}
      >
        <View style={styles.dishImageContainer}>
          <Image source={{ uri: item.image }} style={styles.dishImage} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => removeFromFavorites('dishes', item.id)}
          >
            <Icon name="heart" size={20} color="#dc2626" />
          </TouchableOpacity>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.dishInfo}>
          <View style={styles.dishHeader}>
            <Text style={styles.dishName}>{item.name}</Text>
            <Text style={styles.dishPrice}>{item.price}</Text>
          </View>

          <Text style={styles.restaurantName}>{item.restaurant}</Text>
          <Text style={styles.dishDescription}>{item.description}</Text>

          <View style={styles.dishFooter}>
            <View style={styles.ratingInfo}>
              <Icon name="star" size={14} color="#fbbf24" />
              <Text style={styles.ratingValue}>{item.rating}</Text>
              <Text style={styles.reviewsCount}>({item.reviews})</Text>
            </View>
            <TouchableOpacity style={styles.addToCartButton}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.addToCartGradient}
              >
                <Icon name="add" size={16} color="#fff" />
                <Text style={styles.addToCartText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="heart-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyStateTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyStateDescription}>
        Start adding your favorite restaurants and dishes to see them here!
      </Text>
      <TouchableOpacity style={styles.exploreButton}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.exploreButtonGradient}
        >
          <Icon name="search-outline" size={20} color="#fff" />
          <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const currentData = favorites[selectedTab];
  const isEmpty = currentData.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      <LinearGradient
        colors={['#1e293b', '#334155']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          {tabs.map(renderTabButton)}
        </View>

        {isEmpty ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={currentData}
            renderItem={selectedTab === 'restaurants' ? renderRestaurantCard : renderDishCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            numColumns={selectedTab === 'restaurants' ? 1 : 2}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 30,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedTabButton: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 6,
  },
  selectedTabText: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  restaurantCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantCardGradient: {
    flexDirection: 'row',
  },
  restaurantImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
  },
  restaurantInfo: {
    flex: 1,
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  cuisineBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cuisineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  restaurantDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  popularDishes: {
    marginBottom: 12,
  },
  popularDishesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  popularDishesText: {
    fontSize: 11,
    color: '#64748b',
  },
  restaurantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  orderButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  dishCard: {
    flex: 1,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dishCardGradient: {
    padding: 12,
  },
  dishImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    marginBottom: 12,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dishInfo: {
    flex: 1,
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  dishDescription: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 14,
  },
  dishFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 2,
  },
  reviewsCount: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 2,
  },
  addToCartButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addToCartText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  exploreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default FavoritesScreen; 