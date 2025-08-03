import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const AIChatBotScreen = ({ navigation, route }) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [username, setUsername] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [textEnabled, setTextEnabled] = useState(true);

  // Refs
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Groq API Configuration
  const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // Replace with your actual API key
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  useEffect(() => {
    // Initialize voice recognition and TTS
    initializeVoiceAndTTS();
    loadUsername();
    addWelcomeMessage();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Tts.stop();
    };
  }, []);

  // Initialize Voice Recognition and Text-to-Speech
  const initializeVoiceAndTTS = () => {
    // Voice Recognition Setup
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0]);
        handleSendMessage(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => {
      console.log('Voice error:', e);
      setIsListening(false);
    };

    // TTS Setup
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
  };

  // Load username from AsyncStorage
  const loadUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.log('Error loading username:', error);
    }
  };

  // Add welcome message
  const addWelcomeMessage = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: `Hello ${username || 'there'}! 👋 I'm your AI assistant. How can I help you today?`,
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([welcomeMessage]);
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      await Voice.start('en-US');
      startPulseAnimation();
    } catch (error) {
      Alert.alert('Error', 'Could not start voice recording');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
      stopPulseAnimation();
    } catch (error) {
      console.log('Error stopping voice recording:', error);
    }
  };

  // Pulse animation for voice recording
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  // Send message to Groq AI
  const sendToGroqAI = async (message) => {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for a food delivery app. Provide friendly, concise, and helpful responses. Keep responses under 150 words.',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.log('Groq API Error:', error);
      throw new Error('Failed to get AI response');
    }
  };

  // Handle sending message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await sendToGroqAI(text.trim());
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        setIsSpeaking(true);
        Tts.speak(aiResponse, {
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Toggle voice output
  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  // Render message bubble
  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <LinearGradient
        colors={message.isUser ? ['#667eea', '#764ba2'] : ['#f8f9fa', '#e9ecef']}
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message.text}
        </Text>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.aiAvatar}>
            <FontAwesome name="robot" size={24} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.voiceToggle, voiceEnabled && styles.voiceToggleActive]}
            onPress={toggleVoiceOutput}
          >
            <Ionicons
              name={voiceEnabled ? 'volume-high' : 'volume-mute'}
              size={20}
              color={voiceEnabled ? '#fff' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Voice Recording Animation */}
        {isListening && (
          <View style={styles.voiceAnimationContainer}>
            <Animated.View
              style={[
                styles.voiceWave,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name="mic" size={40} color="#ff4757" />
            </Animated.View>
            <Text style={styles.voiceStatus}>Listening...</Text>
          </View>
        )}

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening && styles.voiceButtonActive,
                ]}
                onPress={toggleVoiceInput}
              >
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={24}
                  color={isListening ? '#fff' : '#667eea'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? '#fff' : '#ccc'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  voiceToggleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#2d3436',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    marginBottom: 15,
    justifyContent: 'flex-start',
  },
  loadingBubble: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#667eea',
  },
  voiceAnimationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  voiceWave: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  voiceStatus: {
    fontSize: 14,
    color: '#ff4757',
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3436',
    maxHeight: 100,
    paddingVertical: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  voiceButtonActive: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
});

export default AIChatBotScreen; 