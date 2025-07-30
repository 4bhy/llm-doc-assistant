import React from 'react';
import { Box, Flex, Container, Heading, Text, Button } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useColorMode } from '@chakra-ui/color-mode';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box minH="100vh" bg={colorMode === 'dark' ? 'gray.800' : 'gray.50'}>
      <Box as="header" py={4} bg={colorMode === 'dark' ? 'gray.700' : 'white'} boxShadow="sm">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <Heading size="md">LLM Document Assistant</Heading>
            </Flex>
            <Button onClick={toggleColorMode} size="sm" variant="ghost">
              {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </Button>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
      <Box as="footer" py={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}>
        <Container maxW="container.xl">
          <Text fontSize="sm" textAlign="center">
            © {new Date().getFullYear()} LLM Document Assistant - Internal Use Only
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
