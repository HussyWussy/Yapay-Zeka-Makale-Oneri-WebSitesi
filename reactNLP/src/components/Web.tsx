import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const Web = () => {
  const [user, setUser] = useState(null);
  const [interests, setInterests] = useState([]);
  const [history, setHistory] = useState([]);
  const [bad_history, setBadHistory] = useState([]);
  const [name, setName] = useState('No name provided');
  const [newInterest, setNewInterest] = useState('');
  const navigate = useNavigate();

  const exampleInterests = ['coding', 'design', 'marketing', 'music', 'sports'];


  useEffect(()=>{
    onAuthStateChanged(auth,e =>  {if(auth.currentUser==null){
      navigate('/signin')
    }})
  },[]);

  useEffect(()=>{
    getRecomended();
  },[interests,history]);

  const getRecomended = () => {
    fetch('/api/getrecomended',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests: interests , history : history ,bad_history : bad_history}),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      return response.json();
    })
    .then(data => {
      console.log('Response from server: ', data);
    })
    .catch(error => {
      console.error('Error sending data:', error);
    });
  }


  useEffect(() => {
    const db = getFirestore();

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setName(`${userData.firstName} ${userData.lastName}`);
            setInterests(userData.interests || []);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddInterest = async () => {
    if (newInterest && user && !interests.includes(newInterest)) {
      const updatedInterests = [...interests, newInterest];
      try {
        const db = getFirestore();
        await updateDoc(doc(db, 'users', user.uid), {
          interests: updatedInterests
        });
        setInterests(updatedInterests);
        setNewInterest('');
      } catch (error) {
        console.error('Error updating interests:', error);
      }
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    if (user) {
      const updatedInterests = interests.filter(interest => interest !== interestToRemove);
      try {
        const db = getFirestore();
        await updateDoc(doc(db, 'users', user.uid), {
          interests: updatedInterests
        });
        setInterests(updatedInterests);
      } catch (error) {
        console.error('Error updating interests:', error);
      }
    }
  };

  return (
    <div>
      <h1>User Information</h1>
      {user ? (
        <div>
          <p>Email: {user.email}</p>
          <p>Name: {name}</p>
          <p>Interests:</p>
          <ul>
            {interests.length > 0 ? (
              interests.map((interest, index) => (
                <li key={index}>
                  {interest} <button onClick={() => handleRemoveInterest(interest)}>Remove</button>
                </li>
              ))
            ) : (
              <li>No interests found</li>
            )}
          </ul>
          <select
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
          >
            <option value="" disabled>Select an interest</option>
            {exampleInterests.map((interest, index) => (
              <option key={index} value={interest}>
                {interest}
              </option>
            ))}
          </select>
          <button onClick={handleAddInterest}>Add Interest</button>
        </div>
      ) : (
        <p>Please sign in to view user information.</p>
      )}
    </div>
  );
};

export default Web;
