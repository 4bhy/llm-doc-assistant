'use client';

import { useState } from 'react';
import { ChakraProvider, Box, Container, defaultSystem } from '@chakra-ui/react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/tabs';
import Layout from '../components/Layout';
import Chat from '../components/Chat';
import AdminInterface from '../components/AdminInterface';

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  return (
    <ChakraProvider value={defaultSystem}>
      <Layout>
        <Tabs 
          isFitted 
          variant="enclosed" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={(index) => setActiveTab(index)}
        >
          <TabList mb="1em">
            <Tab>Chat</Tab>
            <Tab>Admin</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Chat apiUrl={apiUrl} />
            </TabPanel>
            <TabPanel p={0}>
              <AdminInterface apiUrl={apiUrl} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Layout>
    </ChakraProvider>
  );
}
