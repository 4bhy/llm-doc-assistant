import React from 'react';
import { Box, Flex, Text, Badge, useColorModeValue, Link } from '@chakra-ui/react';
import { FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface Source {
  source: string;
  page?: number | null;
  chunk?: number | null;
}

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: Source[];
}

const Message: React.FC<MessageProps> = ({ role, content, timestamp, sources }) => {
  const isUser = role === 'user';
  const bgColor = useColorModeValue(
    isUser ? 'blue.50' : 'gray.50',
    isUser ? 'blue.900' : 'gray.700'
  );
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue(
    isUser ? 'blue.200' : 'gray.200',
    isUser ? 'blue.700' : 'gray.600'
  );
  const iconBg = useColorModeValue(
    isUser ? 'blue.500' : 'gray.500',
    isUser ? 'blue.200' : 'gray.200'
  );

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Flex
      direction={isUser ? 'row-reverse' : 'row'}
      mb={4}
      maxW="100%"
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg={iconBg}
        color="white"
        w="40px"
        h="40px"
        mr={isUser ? 0 : 2}
        ml={isUser ? 2 : 0}
        flexShrink={0}
      >
        {isUser ? <FaUser /> : <FaRobot />}
      </Flex>
      <Box
        maxW="80%"
        bg={bgColor}
        color={textColor}
        borderRadius="lg"
        p={3}
        borderWidth="1px"
        borderColor={borderColor}
        position="relative"
      >
        <Box mb={2}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
        
        {sources && sources.length > 0 && (
          <Box mt={2} pt={2} borderTopWidth="1px" borderColor={borderColor}>
            <Text fontSize="xs" fontWeight="bold" mb={1}>
              Sources:
            </Text>
            {sources.map((source, index) => (
              <Badge
                key={index}
                mr={2}
                mb={1}
                variant="subtle"
                colorScheme="blue"
                fontSize="xs"
              >
                {source.source}
                {source.page && ` (p.${source.page})`}
              </Badge>
            ))}
          </Box>
        )}
        
        <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
          {formattedTime}
        </Text>
      </Box>
    </Flex>
  );
};

export default Message;
