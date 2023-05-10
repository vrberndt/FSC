// src/components/ViewLeague.js
import React, { useState, useContext, useEffect } from 'react';
import { Container, Table, Button } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const ViewLeague = () => {
  const [league, setLeague] = useState(null);
  const { currentUser, joinLeague, declineLeague } = useContext(AuthContext);
  const { leagueId } = useParams();
  const navigate = useNavigate();

  const isUserInvited = () => {
    const invitation = league.invitations.find(
      (invitation) =>
        invitation.email === currentUser.email &&
        invitation.status === 'pending'
    );
    return invitation !== undefined;
  };
  
  const getMemberRole = (member) => {
    if (member._id === league.admin) {
      return 'Admin';
    }
    return 'Member';
  };

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/leagues/${leagueId}`, {
          method: 'GET',
          headers: {
            'x-auth-token': currentUser.token,
          },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Received league data:', data); 
            setLeague(data);
          } else {
            console.error('Fetch league failed:', response.status, await response.text());
          }
      } catch (error) {
        console.error('Error during fetch league:', error);
      }
    };

    if (currentUser) {
      fetchLeague();
    }
  }, [currentUser, leagueId]);

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

  return (
    <Container>
      <h2>{league.name}</h2>
      <h4>Members</h4>
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
            <td>{member.email}</td>
            <td>{getMemberRole(member)}</td>
            </tr>
          ))}
          {league.invitations
            .filter((invitation) => invitation.status === "pending")
            .map((invitation, index) => (
            <tr key={index}>
                <td>{invitation.email}</td>
                <td>{invitation.role} (Pending)</td>
            </tr>
            ))}
        </tbody>

      </Table>
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
