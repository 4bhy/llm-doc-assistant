import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  Flex,
  Heading
} from '@chakra-ui/react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/alert';
import { Divider } from '@chakra-ui/layout';
import { useToast } from '@chakra-ui/toast';
import { useColorModeValue } from '@chakra-ui/color-mode';
import axios from 'axios';
import Message from './Message';
import ChatInput from './ChatInput';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: Array<{
    source: string;
    page?: number | null;
    chunk?: number | null;
  }>;
}

interface ChatProps {
  apiUrl?: string;
}

const Chat: React.FC<ChatProps> = ({ apiUrl = 'http://localhost:3001/api' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Hello! I\'m your documentation assistant. Ask me anything about your organization\'s documentation.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call API
      const response = await axios.post(`${apiUrl}/chat/message`, {
        message: content,
        conversationId,
      });

      // Store conversation ID if this is the first message
      if (!conversationId && response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.text,
        timestamp: response.data.timestamp || new Date().toISOString(),
        sources: response.data.sources,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Check if escalation is needed
      if (response.data.escalate) {
        setNeedsEscalation(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to get a response from the assistant.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalation = async () => {
    if (!conversationId) return;

    try {
      await axios.post(`${apiUrl}/chat/escalate`, {
        conversationId,
        reason: escalationReason || 'User requested assistance',
      });

      toast({
        title: 'Escalation Submitted',
        description: 'Your request has been sent to an admin.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Add system message about escalation
      const escalationMessage: ChatMessage = {
        role: 'system',
        content: 'Your request has been escalated to an administrator. Someone will follow up with you shortly.',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, escalationMessage]);
      setNeedsEscalation(false);
      setEscalationReason('');
    } catch (err) {
      console.error('Error escalating conversation:', err);
      toast({
        title: 'Escalation Failed',
        description: 'Failed to escalate your request. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      height="70vh"
      display="flex"
      flexDirection="column"
    >
      <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md">Documentation Assistant</Heading>
      </Box>

      <Box 
        flex="1" 
        overflowY="auto" 
        p={4}
      >
        <VStack gap="4" alignItems="stretch">
          {messages.map((msg, index) => (
            <Message
              key={index}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              sources={msg.sources}
            />
          ))}
          
          {isLoading && (
            <Box alignSelf="flex-start" ml={12}>
              <Text fontSize="sm" color="gray.500">
                Thinking...
              </Text>
            </Box>
          )}
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Error:</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {needsEscalation && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Need human assistance?</AlertTitle>
                <AlertDescription display="block">
                  It seems I might not have the complete answer. Would you like to escalate this to a human expert?
                  
                  <Flex mt={2}>
                    <Button size="sm" colorScheme="blue" onClick={handleEscalation} mr={2}>
                      Yes, please
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setNeedsEscalation(false)}
                    >
                      No, continue
                    </Button>
                  </Flex>
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Divider />
      
      <Box p={4}>
        <ChatInput onSendMessage={handleSendMessage} loading={isLoading} />
      </Box>
    </Box>
  );
};

export default Chat;
