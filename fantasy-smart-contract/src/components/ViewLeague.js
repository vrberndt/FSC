// src/components/ViewLeague.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Container, Table, Button, Row, Col, Form } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const ViewLeague = () => {
  const [league, setLeague] = useState(null);
  const { currentUser, joinLeague, declineLeague, inviteMember } = useContext(AuthContext);
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [editingMembers, setEditingMembers] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);
  const { updateLeague } = useContext(AuthContext);
  const [newEmail, setNewEmail] = useState('');
  const [emailExistsMap, setEmailExistsMap] = useState({});

  const isUserInvited = () => {
    const invitation = league.invitations.find(
      (invitation) =>
        invitation.email === currentUser.email &&
        invitation.status === 'pending'
    );
    return invitation !== undefined;
  };

  const getMemberRole = (member) => {
    const adminMember = league.members.find((m) => m._id === league.admin);
    if (member._id === adminMember._id) {
      return 'Admin';
    }
    return 'Member';
  };

  const checkEmailExists = useCallback(
    async (email) => {
      if (!currentUser) {
        console.error('currentUser is null');
        return;
      }
  
      if (!league || !league.members) {
        console.error('league or league.members is not defined');
        return;
      }
  
      try {
        const response = await fetch(
          `http://localhost:5001/api/users/check-email/${email}`,
          {
            method: 'GET',
            headers: {
              'x-auth-token': currentUser.token,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setEmailExistsMap((prev) => ({ ...prev, [email]: data.exists }));
        } else {
          console.error('Email check failed:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error during email check:', error);
      }
    },
    [currentUser, league]
  );
  
  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/leagues/${leagueId}`,
          {
            method: 'GET',
            headers: {
              'x-auth-token': currentUser.token,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setLeague(data);
          console.log('Received league data:', data);
        } else {
          console.error('Failed to fetch league:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching league:', error);
      }
    };
  
    if (currentUser) {
      fetchLeague();
    }
  }, [currentUser, leagueId]);  

  useEffect(() => {
    if (league && league.members) {
      league.members.forEach((member) => {
        checkEmailExists(member.email);
      });
  
      league.invitations
        .filter((invitation) => invitation.status === 'pending')
        .forEach((invitation) => {
          checkEmailExists(invitation.email);
        });
    }
  }, [league, league?.members, checkEmailExists]);  

  const handleJoinLeague = async () => {
    const success = await joinLeague(leagueId);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleDeclineLeague = async () => {
    const success = await declineLeague(leagueId);
    if (success) {
      navigate('/dashboard');
    }
  };

  if (!league) {
    return <Container>Loading...</Container>;
  }

  const handleEditMembers = () => {
    setEditingMembers(!editingMembers);
    setEditingLeague(league);
  };

  const handleMemberChange = (index, key, value) => {
    const newMembers = [...league.members];
    newMembers[index][key] = value;
    setEditingLeague({ ...editingLeague, members: newMembers });
  };

  const handleSave = async () => {
    const updatedLeague = await updateLeague(editingLeague._id, editingLeague.name, editingLeague.members);
    if (updatedLeague) {
      setLeague(updatedLeague);
      setEditingLeague(null)
      setEditingMembers(false);
    } else {
      alert('League update failed. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingMembers(false);
    setEditingLeague(null)
  };

  const handleInvite = async () => {
    if (newEmail) {
      const success = await inviteMember(leagueId, newEmail, 'Member');
      if (success) {
        setLeague({
          ...league,
          invitations: [...league.invitations, { email: newEmail, status: 'pending', role: 'Member' }],
        });
        setNewEmail('');
      } else {
        alert('Failed to invite the member. Please try again.');
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  return (
    <Container>
      <h2>
        {league.name}
        {currentUser.id === league.admin && !editingMembers && (
          <Button onClick={handleEditMembers} className="float-right" variant="outline-primary">
            Edit
          </Button>
        )}
      </h2>
      <h4>Members</h4>
      {editingMembers ? (
        <div>
          <Container>
            {league.members.map((member, index) => (
              <Row key={index} className="mb-3">
                <Col>
                  {member.email}
                  {member.username && ` (${member.username})`}
                  {emailExistsMap[member.email] && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-success ml-2"
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </Col>
                <Col>
                  <select
                    value={getMemberRole(member)}
                    onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </Col>
              </Row>
            ))}
            {league.invitations
              .filter((invitation) => invitation.status === 'pending')
              .map((invitation, index) => (
                <Row key={index} className="mb-3">
                  <Col>
                    {invitation.email}
                    {emailExistsMap[invitation.email] && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-success ml-2"
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </Col>
                  <Col>
                    <span>{invitation.role} (Pending)</span>
                  </Col>
                </Row>
              ))}
          </Container>
          <Form.Group controlId="newEmail">
            <Form.Label>Invite new member:</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </Form.Group>
          <Button onClick={handleInvite} className="mb-3" variant="primary">
            Invite
          </Button>
          <Row>
            <Col>
              <Button onClick={handleSave} className="mr-3" variant="success">
                Save
              </Button>
              <Button onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
            </Col>
          </Row>
        </div>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {league.members.map((member, index) => (
              <tr key={index}>
                <td>
                  {member.email}
                  {member.username && ` (${member.username})`}
                  {emailExistsMap[member.email] && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-success ml-2"
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </td>
                <td>{getMemberRole(member)}</td>
              </tr>
            ))}
            {league.invitations
              .filter((invitation) => invitation.status === 'pending')
              .map((invitation, index) => (
                <tr key={index}>
                  <td>
                    {invitation.email}
                    {emailExistsMap[invitation.email] && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-success ml-2"
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </td>
                  <td>{invitation.role} (Pending)</td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}
      {isUserInvited() && (
        <div className="mt-3">
          <Button className="mr-3" onClick={handleJoinLeague}>
            Join League
          </Button>
          <Button variant="secondary" onClick={handleDeclineLeague}>
            Decline
          </Button>
        </div>
      )}
    </Container>
  );
};
  
export default ViewLeague;
    