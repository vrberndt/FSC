// src/components/LandingPage.js
import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/LandingPage.scss';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <>
      <Container>
        <Row className="justify-content-center">
          <Col className="login-container">
            <Card className="text-center mt-5">
              <Card.Body>
                <Card.Title>Smart Contracts for Your Fantasy Sports Leagues</Card.Title>
                <Card.Text>
                  Create leagues, join leagues, and manage smart contracts for
                  your fantasy sports experience.
                </Card.Text>
                <Form onSubmit={handleSubmit} className="login-form">
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Group>
                  <div className="text-end">
                    <Button variant="primary" type="submit" className="mb-2">
                      Sign In
                    </Button>
                  </div>
                </Form>
                <div className="mt-2">
                  <span>Don't have an account?</span>
                  <Button as={Link} to="/signup" variant="primary" className="ms-2">
                    Create Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default LandingPage;
