import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';


const Web = () => {
  const [user, setUser] = useState(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [bad_history, setBad_history] = useState<string[]>([]);
  const [name, setName] = useState('No name provided');
  const [newInterest, setNewInterest] = useState('');
  const [exampleInterests, setExampleInterests] = useState<string[]>([]);
  const [fasttextResults, setFasttextResults] = useState<{ data: string, key: string[], precision: boolean }[]>([]);
  const [scibertResults, setScibertResults] = useState<{ data: string, key: string[], precision: boolean }[]>([]);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, e => {
      if (auth.currentUser == null) {
        navigate('/signin');
      }
    });
  }, [navigate]);

  useEffect(() => {
    getRecomended();
  }, [interests]);

  useEffect(() => {
    const fetchExampleInterests = async () => {
      try {
        const interestsCollection = collection(firestore, 'interests');
        const querySnapshot = await getDocs(interestsCollection);
        const interestsList = querySnapshot.docs.map(doc => doc.id); 
        setExampleInterests(interestsList);
        console.log('Example interests:', interestsList);
      } catch (error) {
        console.error('Error fetching example interests:', error);
      }
    };
    
    fetchExampleInterests();
  }, []);

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
            setHistory(userData.history || []);
            setBad_history(userData.bad_history || []);
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getKeys();
  }, []);

  const getRecomended = (text="") => {
    fetch('/api/getrecomended', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, history, bad_history,text }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setFasttextResults(data.fasttext_results);
        setScibertResults(data.scibert_results);
        console.log('Response from server: ', data);
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
  };

  const getRecomendedBySearch = () => {
    getRecomended1(interests, history, bad_history, searchTerm);
  };

  const getRecomended1 = (interests: string[], history: string[], bad_history: string[], text = "") => {
    fetch('/api/getrecomended', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, history, bad_history, text }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setFasttextResults(data.fasttext_results);
        setScibertResults(data.scibert_results);
        console.log('Response from server: ', data);
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
  };

  const getKeys = async () => {
    try {
      const response = await fetch('/api/getfrequentkeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 30 }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const interestsCollection = collection(firestore, 'interests');

      for (let i = 0; i < data.length; i++) {
        const [interest, count] = data[i];

        const q = query(interestsCollection, where('interest', '==', interest));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(interestsCollection, { interest, count });
        } else {
         
        }
      }
    } catch (error) {
      console.error('Error sending data:', error);
    }
  };

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

  const handleRemoveInterest = async (interestToRemove: string) => {
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

  const handleAccept = async (result: { data: string, key: string[], precision: boolean }) => {
    if (user) {
      const db = getFirestore();
      const updatedHistory = [...history, result.data];
      try {
        await updateDoc(doc(db, 'users', user.uid), { history: updatedHistory });
        setHistory(updatedHistory);
      } catch (error) {
        console.error('Error updating history:', error);
      }
    }
  };

  const handleReject = async (result: { data: string, key: string[], precision: boolean }) => {
    if (user) {
      const db = getFirestore();
      const updatedBadHistory = [...bad_history, result.data];
      try {
        await updateDoc(doc(db, 'users', user.uid), { bad_history: updatedBadHistory });
        setBad_history(updatedBadHistory);
      } catch (error) {
        console.error('Error updating bad history:', error);
      }
    }
  };

  const resetArticles = async () => {
    if (user) {
      const db = getFirestore();
      try {
        await updateDoc(doc(db, 'users', user.uid), { history: [], bad_history: [] });
        setHistory([]);
        setBad_history([]);
      } catch (error) {
        console.error('Error resetting articles:', error);
      }
    }
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prevState => ({ ...prevState, [index]: !prevState[index] }));
  };

  const calculatePrecision = (results) => {
    const total = results.length;
    const trueCount = results.filter(result => result.precision).length;
    return `${trueCount}/${total}`;
  };

  return (
    <div>
  
  {user ? (
    <div className="user-info">
      <div className="interests-container">
        {interests.length > 0 ? (
          interests.map((interest, index) => (
            <div className="interest-item" key={index}>
              {interest}
              <button className="remove-button" onClick={() => handleRemoveInterest(interest)}>✖</button>
            </div>
          ))
        ) : (
          <p>No interests found</p>
        )}
      </div>
      <div className="add-interest-container">
        <select
          className="interest-select"
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
        <button className='add-interests-button' onClick={handleAddInterest}>Add Interest</button>
      </div>
      <div className="search-bar-container">
        <input
          className="search-bar"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-button" onClick={getRecomendedBySearch}>
          <img src="search-icon.png" alt="Search" />
        </button>
      </div>
    </div>
  ) : (
    <p>Please sign in to view user information.</p>
  )}
      
      <div className="container">
        <div className="results-container">
          <h2>FastText Results (Precision: {calculatePrecision(fasttextResults)})</h2>
          {fasttextResults.map((result, index) => (
            <div className={`result-card ${history.includes(result.data) ? 'accepted' : ''} ${bad_history.includes(result.data) ? 'rejected' : ''}`} key={index} onClick={() => toggleCardExpansion(index)}>
              <div className="result-content">
                {expandedCards[index] ? result.data : result.data.split(' ').slice(0, 7).join(' ') + '...'}
                <div className="keys">
                  {result.key.map((k, i) => (
                    <span key={i}>{k}</span>
                  ))}
                </div>
                {expandedCards[index] && (
                  <div className="precision">
                    Precision: {result.precision ? 'True' : 'False'}
                  </div>
                )}
              </div>
              <div className="actions">
                <button className="green" onClick={() => handleAccept(result)}>✔</button>
                <button className="red" onClick={() => handleReject(result)}>✖</button>
              </div>
            </div>
          ))}
        </div>
        <div className="results-container">
          <h2>SciBERT Results (Precision: {calculatePrecision(scibertResults)})</h2>
          {scibertResults.map((result, index) => (
            <div className={`result-card ${history.includes(result.data) ? 'accepted' : ''} ${bad_history.includes(result.data) ? 'rejected' : ''}`} key={index} onClick={() => toggleCardExpansion(index)}>
              <div className="result-content">
                {expandedCards[index] ? result.data : result.data.split(' ').slice(0, 7).join(' ') + '...'}
                <div className="keys">
                  {result.key.map((k, i) => (
                    <span key={i}>{k}</span>
                  ))}
                </div>
                {expandedCards[index] && (
                  <div className="precision">
                    Precision: {result.precision ? 'True' : 'False'}
                  </div>
                )}
              </div>
              <div className="actions">
                <button className="green" onClick={() => handleAccept(result)}>✔</button>
                <button className="red" onClick={() => handleReject(result)}>✖</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className='Update' onClick={() => getRecomended1(interests, history, bad_history)}>Update</button>
      <button className='Reset' onClick={resetArticles}>Reset Articles</button>
    </div>
  );
};

export default Web;
