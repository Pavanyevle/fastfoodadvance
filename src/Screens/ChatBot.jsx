import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GROQ API key for AI assistant (replace with your own key in production)
const GROQ_API_KEY = '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'; // Replace with your actual GROQ API key

/**
 * ChatBot screen
 * Provides a chat interface for users to interact with an AI assistant.
 * Features:
 * - Loads/saves chat history from Firebase
 * - Fetches food menu and user orders for context
 * - Sends user messages to AI API and displays responses
 * - Shows typing indicator and handles loading states
 */
const ChatBot = ({ navigation }) => {
  // State for chat messages
  const [messages, setMessages] = useState([]);
  // State for input text
  const [input, setInput] = useState('');
  // Loading state for AI response
  const [loading, setLoading] = useState(false);
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  // Ref for FlatList to scroll to bottom
  const flatListRef = useRef(null);
  // Username from navigation params
  const [username, setUsername] = useState('');
  // Loading state for chat history
  const [chatLoading, setChatLoading] = useState(true);

  /**
   * Save a message to Firebase under the user's chat history
   */
  const saveMessageToFirebase = async (msg) => {
    try {
      const userKey = username.replace('.', '_');
      await axios.post(
        `https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${userKey}/chats.json`,
        {
          text: msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        }
      );
    } catch (err) { /* Ignore errors for now */ }
  };

  /**
   * Fetch available food items from Firebase
   * Returns a formatted string list of available foods
   */
  const fetchFoodItems = async () => {
    try {
      const res = await axios.get('https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/foods.json');
      const data = res.data;
      if (data) {
        const foodList = Object.entries(data)
          .filter(([id, item]) => item.available)
          .map(([id, item]) => `• [${id}] ${item.name} (${item.category})`);
        return foodList.join('\n');
      } else {
        return "No food items are currently available.";
      }
    } catch (error) {
      return "Error fetching food items.";
    }
  };


  useEffect(() => {
    const getUsernameFromStorage = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          Alert.alert("Error", "Username not found in storage.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error retrieving username:", error);
      }
    };

    getUsernameFromStorage();
  }, []);

  /**
   * On mount: fetch chat history from Firebase
   */
  useEffect(() => {
    if (!username) return; // username तयार नसताना history fetch करू नको

    const fetchChatHistory = async () => {
      try {
        const userKey = username.replace('.', '_');
        const res = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${userKey}/chats.json`);
        const data = res.data;
        if (data) {
          const messagesArray = Object.values(data).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })).sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messagesArray);
        }
      } catch (error) {
        console.log("❌ Error fetching chat history:", error);
      } finally {
        setChatLoading(false);
      }
    };

    fetchChatHistory();
  }, [username]); // ✅ dependency मध्ये username ठेवलं आहे

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  /**
   * Format messages for GROQ API (user/assistant roles)
   */
  const formatMessagesForGROQ = (chatMessages) => {
    return chatMessages.map((msg) => ({
      role: msg.sender === 'me' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  /**
   * Fetch user's order history from Firebase
   * Returns a formatted string list of orders
   */
  const fetchUserOrders = async () => {
    try {
      const userKey = username.replace('.', '_');
      const res = await axios.get(`https://fooddeliveryapp-395e7-default-rtdb.firebaseio.com/users/${userKey}/orders.json`);
      const data = res.data;
      if (data) {
        const orders = Object.values(data)
          .map(order => `• ${order.name} (Qty: ${order.quantity}, Status: ${order.status}, Price: ${order.price}, OrderTime: ${order.orderTime}, Status: ${order.status}, Address: ${order.address}, totalAmount: ${order.totalAmount})`);
        return orders.join('\n');
      } else {
        return "No orders placed yet.";
      }
    } catch (err) {
      return "Error fetching user orders.";
    }
  };

  /**
   * Send user message to AI, get response, and update chat
   */
  const sendMessage = async () => {
    if (input.trim() === '') return;

    // Create user message object
    const userMsg = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}-me`,
      text: input,
      sender: 'me',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    saveMessageToFirebase(userMsg);
    setInput('');
    setLoading(true);
    setIsTyping(true);
    // Add typing indicator message after user message
    const typingMsg = {
      id: 'typing-indicator',
      sender: 'typing'
    };
    setMessages(prev => [...prev, typingMsg]);


    try {
      let aiText = '';
      // Fetch live food data and user orders for context
      const [liveFoodData, userOrderData] = await Promise.all([
        fetchFoodItems(),
        fetchUserOrders()
      ]);

      // Call GROQ AI API with chat context and system prompt
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are *ChetBot*, a smart, polite, and friendly virtual assistant for a food delivery app.

               👤 User: ${username}

               📦 User Orders:
               order time convert IST to Indian time, and proper formating to show order
               and order display in a list format and show in a proper format,and give the user a list of orders and their details two lines gap for each order,order details on proper format,and show the order details in a list format with two lines gap between each order and give order type symbols like star.
               
                ${userOrderData}

               🍔 Available Food Menu:
               you show only avilable food on my database
               ${liveFoodData}

               Your Role:
               - You are an AI assistant who helps users with food items, delivery info, and order details.
               - DO NOT place, cancel, or modify any orders.
               - Your tone should always be helpful, warm, and respectful.
               - If the user's query is unrelated to food delivery, politely say that you are limited to this app's services.

               How to Respond:
               - Suggest food items based on available menu when asked for recommendations.
               - Answer delivery time or order status queries from the "User Orders" list.
               - If a food item is not available, politely inform the user.
               - If user asks to cancel/confirm any order, respond:  
               "I'm here to assist you, but I cannot place or cancel orders. Please contact support or use the app options."

               Tone Style:
               - Friendly, short, clear, natural, and professional.
               - Avoid robotic or generic replies. Respond like a helpful human assistant.`
            },
            ...formatMessagesForGROQ([...messages, userMsg])
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      aiText = data?.choices?.[0]?.message?.content || 'Sorry, no response.';

      // Create AI message object
      const aiMsg = {
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}-ai`,
        text: aiText,
        sender: 'other',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== 'typing-indicator');
        return [...updated, aiMsg];
      });

      saveMessageToFirebase(aiMsg);
    } catch (error) {
      Alert.alert('Error', 'AI API failed to respond');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Format timestamp for display (hh:mm)
   */
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Render a single chat message bubble
   */
  const renderItem = ({ item }) => {
    if (item.sender === 'typing') {
      return (
        <View style={styles.typingContainer}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          </View>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
        {item.sender === 'other' && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, item.sender === 'me' ? styles.myMessageText : styles.otherMessageText]}>
            {item.text.trim()}
          </Text>
          <Text style={[styles.timestamp, item.sender === 'me' ? styles.myTimestamp : styles.otherTimestamp]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };


  // Main UI render
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      {/* Header with back button and bot info */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.headerTitle}>Chat Bot</Text>
              <Text style={styles.headerSubtitle}>{isTyping ? 'Typing...' : 'Online'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      {/* Show loader while loading chat history */}
      {chatLoading ? (
        <View style={styles.chatLoaderContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={{ color: '#667eea', marginTop: 8 }}>Loading chat history...</Text>
        </View>
      ) : (
        <View style={styles.messageWrapper}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSubtitle}>Start the conversation by typing a message below!</Text>
              </View>
            }
          />


        </View>
      )}
      {/* Input area for typing and sending messages */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={loading ? 'Waiting for reply...' : 'Type your message...'}
                placeholderTextColor="#999"
                editable={!loading}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendButton, input.trim() === '' && styles.sendButtonDisabled]}
              disabled={loading || input.trim() === ''}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </KeyboardAvoidingView>
  );
};

export default ChatBot;



const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#f8f9fa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
  },
  botAvatarHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    alignItems: 'center',
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  moreBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  messageWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#2d3436',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#636e72',
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  typingBubble: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 2,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,

  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3436',
    maxHeight: 100,
    paddingVertical: 5,
  },
  attachBtn: {
    padding: 5,
  },
  sendButton: {
    backgroundColor: '#667eea',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 200,
  },

  emptyChatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 5,
  },

  emptyChatSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

});