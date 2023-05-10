import React, { useContext, useState, useEffect } from 'react';
import { Container, Button, ListGroup, Card } from 'react-bootstrap';
import { AuthContext } from '../AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, getPendingInvites, getLeaguesByStatus } = useContext(AuthContext);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [activeLeagues, setActiveLeagues] = useState([]);

  useEffect(() => {
    const fetchPendingInvites = async () => {
      if (currentUser) {
        try {
          const invites = await getPendingInvites();
          console.log("Fetched pending invites:", invites); 
          setPendingInvites(invites);
        } catch (error) {
          console.error('Error during fetch pending invites:', error);
        }
      }
    };
  
    const fetchActiveLeagues = async () => {
      if (currentUser) {
        try {
          const leagues = await getLeaguesByStatus("accepted");
          console.log("Fetched active leagues:", leagues); 
          setActiveLeagues(leagues);
        } catch (error) {
          console.error('Error during fetch active leagues:', error);
        }
      }
    };
  
    fetchPendingInvites();
    fetchActiveLeagues();
  }, [getPendingInvites, getLeaguesByStatus, currentUser]);  

  return (
    <div>
      <Container>
        <h2>Welcome {currentUser && currentUser.username}</h2>
        {/* Add a Card component to wrap the sections and the button */}
        <Card className="mb-4 p-4" style={{ border: '1px solid #ccc' }}>
          <h4>Pending Invites</h4>
          <ListGroup>
            {pendingInvites.length === 0 ? (
              <ListGroup.Item>No pending invites</ListGroup.Item>
            ) : (
              pendingInvites.map((invite) => (
                <ListGroup.Item key={invite._id}>
                  <Link to={`/league/${invite.league._id}`}>{invite.league.name}</Link>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
          <h4 className="mt-4">Active Leagues</h4>
          <ListGroup>
            {activeLeagues.length === 0 ? (
              <ListGroup.Item>No active leagues</ListGroup.Item>
            ) : (
              activeLeagues.map((league) => (
                <ListGroup.Item key={league._id}>
                  <Link to={`/league/${league._id}`}>{league.name}</Link>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
          <div className="mt-4">
            <Link to="/createleague">
              <Button>Create a League</Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Dashboard;
