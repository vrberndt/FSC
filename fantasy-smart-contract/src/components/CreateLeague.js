// src/components/CreateLeague.js
import React, { useState, useContext, useEffect } from 'react';
import { useCallback } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const CreateLeague = () => {
  const [name, setName] = useState('');
  const [numMembers, setNumMembers] = useState(2);
  const [members, setMembers] = useState([]);
  const { createLeague, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      console.log('currentUser:', currentUser);
      setMembers([{ email: currentUser.email, role: 'Admin', exists: true, status: 'accepted' }]);
    }
  }, [currentUser]);  

  const addMemberFields = useCallback(() => {
    setMembers((prevMembers) => {
      const newMembers = [...prevMembers];
  
      // Remove extra member fields when the number of members decreases
      if (newMembers.length > numMembers) {
        newMembers.splice(numMembers);
      }
  
      // Add new member fields when the number of members increases
      while (newMembers.length < numMembers) {
        newMembers.push({ email: '', role: 'Member', exists: false });
      }
  
      return newMembers;
    });
  }, [numMembers]);
  
  useEffect(() => {
    addMemberFields();
  }, [numMembers, addMemberFields]);  


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invitations = members.slice(1).map((member) => ({
        email: member.email,
        role: member.role,
        status: member.status || 'pending',
      }));
      console.log('name:', name, 'invitations:', invitations); 
      const league = await createLeague(name, invitations);
      if (league) {
        navigate(`/leagues/${league._id}`);
      } else {
        alert('League creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    }
  };  
  

  const handleMemberChange = (index, key, value) => {
    const newMembers = [...members];
    newMembers[index][key] = value;
    setMembers(newMembers);
  };

  const checkEmailExists = async (email) => {
    if (!currentUser) {
      console.error('currentUser is null');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5001/api/users/check-email/${email}`, {
        method: 'GET',
        headers: {
          'x-auth-token': currentUser.token,
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        const memberIndex = members.findIndex((m) => m.email === email);
  
        if (memberIndex !== -1) {
          const newMembers = [...members];
          newMembers[memberIndex].exists = data.exists;
          setMembers(newMembers);
        }
      } else {
        console.error('Email check failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during email check:', error);
    }
  };  

  return (
    <Container>
      <h2>Create League</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>League Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="League Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>How Many League Members (Including Yourself)?</Form.Label>
          <Form.Select
          value={numMembers}
          onChange={(e) => {
            setNumMembers(parseInt(e.target.value));
          }}
        >
          {Array.from({ length: 13 }, (_, i) => (
            <option key={i + 2} value={i + 2}>{i + 2}</option>
          ))}
        </Form.Select>
        </Form.Group>
        <h4>League Members</h4>
        {members.map((member, index) => (
          <Row key={index} className="mb-3">
            <Col>
              <Form.Label>Member Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Member Email"
                value={member.email}
                onChange={(e) => {
                  handleMemberChange(index, 'email', e.target.value);
                  checkEmailExists(e.target.value);
                }}
                disabled={index === 0}
              />
              {member.exists && <FontAwesomeIcon icon={faCheck} className="ml-2" />}
            </Col>
            <Col>
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={member.role}
                onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Col>
          </Row>
        ))}
        <Button variant="primary" type="submit">
          Create League
        </Button>
      </Form>
    </Container>
  );
};

export default CreateLeague;
