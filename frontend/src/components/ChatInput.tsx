import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Input, 
  Button, 
  IconButton
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/color-mode';
import { ArrowUpIcon } from '@chakra-ui/icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, loading = false }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      position="sticky" 
      bottom={0} 
      py={4}
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
    >
      <Flex>
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question about your documentation..."
          size="md"
          mr={2}
          disabled={loading}
        />
        <IconButton
          colorScheme="blue"
          aria-label="Send message"
          type="submit"
          loading={loading}
          disabled={!message.trim() || loading}
        >
          <ArrowUpIcon />
        </IconButton>
      </Flex>
    </Box>
  );
};

export default ChatInput;
