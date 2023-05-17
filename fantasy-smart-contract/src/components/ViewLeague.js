// src/components/ViewLeague.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Container, Table, Button, Row, Col, Form } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const ViewLeague = () => {
  const [league, setLeague] = useState(null);
  const { currentUser, joinLeague, declineLeague } = useContext(AuthContext);
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [editingMembers, setEditingMembers] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);
  const { updateLeague } = useContext(AuthContext);
  const [emailExistsMap, setEmailExistsMap] = useState({});
  const [emailInputs, setEmailInputs] = useState([]);
  const [invitations, setInvitations] = useState([]);
  

  const isUserInvited = () => {
    const invitation = invitations.find(
      (invitation) =>
        invitation.email === currentUser.email &&
        invitation.status === 'pending'
    );
    return invitation !== undefined;
  };
  
  const getMemberRole = (member) => {
    if (!invitations) {
      console.error('Invitations is not defined');
      return;
    }
  
    if (member._id === league.admin._id) {
      return 'Admin';
    } else {
      // Find the member in the invitations
      const memberInvitation = invitations.find(invitation => invitation.email === member.email);
      // If the member was found, return its role
      if (memberInvitation) {
        return memberInvitation.role;
      }
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

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/leagues/${leagueId}/invitations`,
          {
            method: 'GET',
            headers: {
              'x-auth-token': currentUser.token,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setInvitations(data);
          console.log('Received invitations:', data);
        } else {
          console.error('Failed to fetch invitations:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      }
    };
  
    if (currentUser && league) {
      fetchInvitations();
    }
  }, [currentUser, leagueId, league]);

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

  const isAdmin = () => {
    return currentUser.id === league.admin._id;
  };

  const handleEditMembers = () => {
    setEditingMembers(!editingMembers);
    setEditingLeague(league);
  };

  const handleMemberChange = (email, newRole) => {
    const newInvitations = [...editingLeague.invitations];
    const invitationIndex = newInvitations.findIndex(
      (invitation) => invitation.email === email
    );
    
    // If this member has an invitation (which should store the role), update the role
    if (invitationIndex !== -1) {
      newInvitations[invitationIndex].role = newRole;
    }
    
    // If the new role is 'Admin', update the league's admin
    if (newRole === 'Admin') {
      editingLeague.admin = email;
    }
    
    setEditingLeague({ ...editingLeague, invitations: newInvitations });
  };
  
  const handleSave = async () => {
    // Create new invitations array with existing invitations and new ones from emailInputs
    const newInvitations = [
      ...editingLeague.invitations,
      ...emailInputs.filter(email => email).map(email => ({
        email,
        status: 'pending',
        role: 'Member',
      })),
    ];
  
    // Update the editingLeague state with the newInvitations
    setEditingLeague({
      ...editingLeague,
      invitations: newInvitations,
    });
  
    // Wait for the state update to finish
    await new Promise(resolve => setTimeout(resolve, 0));
  
    // Call updateLeague with the updated invitations and admin
    const updatedLeague = await updateLeague(
      editingLeague._id,
      editingLeague.name,
      editingLeague.members,
      newInvitations,
      editingLeague.admin,
    );
  
    if (updatedLeague) {
      setLeague(updatedLeague);
      setEditingLeague(null);
      setEditingMembers(false);
    } else {
      alert('League update failed. Please try again.');
    }
  };  

  const handleCancel = () => {
    setEditingMembers(false);
    setEditingLeague(null)
  };

  const handleEmailInputChange = (index, event) => {
    const values = [...emailInputs];
    values[index] = event.target.value;
    setEmailInputs(values);
  };
  
  const handleAddMemberClick = () => {
    setEmailInputs([...emailInputs, '']);
  };  

  return (
    <Container>
      <h2>
        {league.name}
        {isAdmin() && !editingMembers && (
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
                    onChange={(e) => handleMemberChange(member.email, e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </Col>
              </Row>
            ))}
            {invitations
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
          {emailInputs.map((email, index) => (
        <Form.Group controlId={`newEmail${index}`} key={index}>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => handleEmailInputChange(index, e)}
          />
        </Form.Group>
      ))}
      <Button onClick={handleAddMemberClick}>
        Add Member
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
            {invitations
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
  