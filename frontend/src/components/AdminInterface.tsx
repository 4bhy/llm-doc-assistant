import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Text,
  Flex,
  useColorModeValue,
  Spinner
} from '@chakra-ui/react';
import axios from 'axios';

interface Escalation {
  escalationId: string;
  conversationId: string;
  status: 'pending' | 'in_progress' | 'resolved';
  reason: string;
  timestamp: string;
}

interface AdminInterfaceProps {
  apiUrl?: string;
}

const AdminInterface: React.FC<AdminInterfaceProps> = ({ apiUrl = 'http://localhost:3001/api' }) => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch escalations on component mount
  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/escalations`);
      setEscalations(response.data);
    } catch (error) {
      console.error('Error fetching escalations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch escalations.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEscalation = (escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setResponse('');
    onOpen();
  };

  const handleResolveEscalation = async () => {
    if (!selectedEscalation) return;

    setIsSubmitting(true);
    try {
      await axios.put(`${apiUrl}/admin/escalations/${selectedEscalation.escalationId}`, {
        status: 'resolved',
        response,
      });

      toast({
        title: 'Success',
        description: 'Escalation resolved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update local state
      setEscalations(prevEscalations =>
        prevEscalations.map(esc =>
          esc.escalationId === selectedEscalation.escalationId
            ? { ...esc, status: 'resolved' }
            : esc
        )
      );

      onClose();
    } catch (error) {
      console.error('Error resolving escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve escalation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'red';
      case 'in_progress':
        return 'yellow';
      case 'resolved':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      p={4}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Escalation Management</Heading>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={fetchEscalations}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner />
        </Flex>
      ) : escalations.length === 0 ? (
        <Text textAlign="center" py={8} color="gray.500">
          No escalations found.
        </Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Conversation</Th>
              <Th>Status</Th>
              <Th>Timestamp</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {escalations.map((escalation) => (
              <Tr key={escalation.escalationId}>
                <Td>{escalation.escalationId}</Td>
                <Td>{escalation.conversationId}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(escalation.status)}>
                    {escalation.status}
                  </Badge>
                </Td>
                <Td>{formatDate(escalation.timestamp)}</Td>
                <Td>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => handleViewEscalation(escalation)}
                    isDisabled={escalation.status === 'resolved'}
                  >
                    {escalation.status === 'resolved' ? 'View' : 'Respond'}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Escalation Response Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Respond to Escalation
            {selectedEscalation && (
              <Badge
                ml={2}
                colorScheme={getStatusColor(selectedEscalation.status)}
              >
                {selectedEscalation.status}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEscalation && (
              <>
                <Box mb={4}>
                  <Text fontWeight="bold">Reason:</Text>
                  <Text>{selectedEscalation.reason}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Conversation ID:</Text>
                  <Text>{selectedEscalation.conversationId}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Timestamp:</Text>
                  <Text>{formatDate(selectedEscalation.timestamp)}</Text>
                </Box>
                {selectedEscalation.status !== 'resolved' && (
                  <FormControl>
                    <FormLabel>Response</FormLabel>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Enter your response to the user..."
                      rows={5}
                    />
                  </FormControl>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedEscalation && selectedEscalation.status !== 'resolved' && (
              <Button
                colorScheme="blue"
                onClick={handleResolveEscalation}
                isLoading={isSubmitting}
                isDisabled={!response.trim()}
              >
                Resolve
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminInterface;
