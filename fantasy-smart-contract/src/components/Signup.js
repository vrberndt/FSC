import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import '../styles/Signup.scss';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await signup(username, email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        alert('Signup failed. Please try again.');
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
          <Col className="signup-container">
            <Card className="text-center mt-5">
              <Card.Body>
                <Card.Title>Create New Account</Card.Title>
                <Form onSubmit={handleSubmit} className="signup-form">
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
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </Form.Group>
                  <div className="text-end">
                    <Button variant="primary" type="submit" className="mb-2">
                      Create Account
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Signup;
