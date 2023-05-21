// src/components/ViewLeague.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Container, Table, Button, Row, Col, Form } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';

const ViewLeague = () => {
  const [league, setLeague] = useState(null);
  const { currentUser, joinLeague, declineLeague } = useContext(AuthContext);
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [editingMembers, setEditingMembers] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);
  const { updateLeague, inviteToLeague } = useContext(AuthContext);
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

  const checkEmailExists = useCallback(
    async (email) => {
      if (!currentUser) {
        console.error('currentUser is null');
        return;
      }
  
      if (!league || !league.invitations) {
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
  
  const fetchLeague = useCallback(async () => {
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
        return data;
      } else {
        console.error('Failed to fetch league:', response.status, await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error fetching league:', error);
      return null;
    }
  }, [currentUser, leagueId]);

  const fetchInvitations = useCallback(async () => {
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
  }, [currentUser, leagueId]);
  
  useEffect(() => {
    if (currentUser && league) {
      fetchInvitations();
    }
  }, [currentUser, leagueId, league, fetchInvitations]);  

  useEffect(() => {
    if (currentUser) {
      fetchLeague();
    }
  }, [currentUser, leagueId, fetchLeague]);  

  useEffect(() => {
    if (league && league.invitations) {
      league.invitations.forEach((invitation) => {
        checkEmailExists(invitation.email);
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

  const isAdmin = () => {
    const userInvitation = league.invitations.find(
      invitation => invitation.email === currentUser.email && invitation.status === 'accepted'
    );
    return userInvitation?.role === 'Admin';
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
      editingLeague.admin = email.trim();
    }  
    
    setEditingLeague({ ...editingLeague, invitations: newInvitations });
  };
  
  const handleSave = async () => {
    // Separate invitations into existing and new
    const existingInvitations = editingLeague.invitations;
    const newInvitations = emailInputs.filter(email => email).map(email => ({
      email,
      status: 'pending',
      role: 'Member',
    }));
  
    // Call updateLeague with the existing invitations if there are changes
    if (existingInvitations.some(invitation => invitation.role !== league.invitations.find(i => i.email === invitation.email)?.role)) {
      const updatedLeague = await updateLeague(
        editingLeague._id,
        existingInvitations.map(invitation => ({ email: invitation.email, role: invitation.role })),
      );
  
      if (!updatedLeague) {
        alert('League update failed. Please try again.');
        return;
      }
    }
  
    // Call inviteToLeague with the new invitations if there are new invitations
    if (newInvitations.length > 0) {
      for (let invitation of newInvitations) {
        const success = await inviteToLeague(league._id, { 
          email: invitation.email, 
          role: invitation.role, 
          status: invitation.status 
        });
        if (!success) {
          alert('Failed to invite user. Please try again.');
          return;
        }
      }
    }
  
    // Fetch the updated league from the server
    const updatedLeague = await fetchLeague();
  
    // If all updates and invitations were successful, update the league in the state
    if (updatedLeague) {
      setLeague(updatedLeague);
      setEditingLeague(null); // Reset the editingLeague state
      setEditingMembers(false);
      setEmailInputs([]); // Reset the emailInputs state
    } else {
      alert('Failed to fetch updated league. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingMembers(false);
    setEditingLeague(null); // Reset the editingLeague state
    setEmailInputs([]); // Reset the emailInputs state
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
          {league.invitations.map((invitation, index) => (
            <Row key={index} className="mb-3">
              <Col>
                {invitation.email}
                {invitation.user && ` (${invitation.user.username})`}
                {emailExistsMap[invitation.email] && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="green-icon ml-2"
                  />
                )}
              </Col>
              <Col>
                {invitation.status === 'accepted' ? (
                  <select
                    value={invitation.role}
                    onChange={(e) => handleMemberChange(invitation.email, e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                ) : (
                  <div>{invitation.role}</div>
                )}
              </Col>
            </Row>
          ))}
          </Container>
          {emailInputs.map((email, index) => (
            <Form.Group controlId={`newEmail${index}`} key={index} className="mb-3">
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => handleEmailInputChange(index, e)}
              />
            </Form.Group>
          ))}
          <FontAwesomeIcon
            icon={faPlus}
            className="green-icon mb-3"
            style={{ cursor: 'pointer' }}
            onClick={handleAddMemberClick}
          />
          <Row className="mt-3">
            <Col>
            <Button onClick={handleSave} className="mr-3" variant="primary">
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
            {league.invitations.map((invitation, index) => (
              <tr key={index}>
                <td>
                  {invitation.email}
                  {invitation.user && ` (${invitation.user.username})`}
                  {emailExistsMap[invitation.email] && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="green-icon ml-2"
                    />
                  )}
                </td>
                <td>{invitation.role} {invitation.status === 'pending' && '(Pending)'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {isUserInvited() && (
        <div className="mt-3">
          <Button className="mr-3" variant='primary' onClick={handleJoinLeague}>
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
  
  