import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  orderBy,
  onSnapshot,
  addDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';

import './App.css';
import './Game.css';
import './App2.css';


// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};






// Login/Signup Page
const LoginSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [skinColor, setSkinColor] = useState('#F5D0A9');
  const [hairStyle, setHairStyle] = useState(1);
  const [step, setStep] = useState(0);
  const { currentUser } = React.useContext(AuthContext);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        if (step === 0) {
          // Check if username exists
          const usernameQuery = query(collection(db, "users"), where("username", "==", username));
          const usernameSnapshot = await getDocs(usernameQuery);
          
          if (!usernameSnapshot.empty) {
            setError('Username already exists');
            return;
          }
          
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            username,
            createdAt: serverTimestamp(),
          });
          setStep(1);
        } else if (step === 1) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            dob,
            gender
          });
          setStep(2);
        } else if (step === 2) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            skinColor,
            hairStyle,
            coins: 100, // Starting coins
            hearts: 0,
            streak: 0,
            partner: null,
            lastActive: serverTimestamp(),
            // Add Elo ratings
            ratings: {
              luck: {
                rating: 1000,
                gamesPlayed: 0
              },
              skill: {
                rating: 1000,
                gamesPlayed: 0
              },
              knowledge: {
                rating: 1000,
                gamesPlayed: 0
              }
            }
                    });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Character customization UI
    const renderCharacterCustomization = () => {
      // Available skin colors
      const skinColors = [
        { id: 'skin1', color: '#F5D0A9', name: 'Fair' }, 
        { id: 'skin2', color: '#D4A76A', name: 'Medium' }, 
        { id: 'skin3', color: '#8B5A2B', name: 'Dark' }
      ];
      
      // Available hair styles (varies based on gender)
      const hairStyles = gender === 'male' ? [
        { id: 1, name: 'Short' },
        { id: 2, name: 'Medium' },
        { id: 3, name: 'Long' }
      ] : [
        { id: 1, name: 'Ponytail' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Long' }
      ];

      return (
        <div className="character-customization">
          <h2>Customize Your Character</h2>
          
          <div className="character-preview">
            <div className="character-container">
              {/* Base character with skin color */}
              <div 
                className="character-base" 
                style={{ backgroundColor: skinColor }}
              >
                {/* Expression - Default to normal */}
                <div className="expression normal"></div>
                
                {/* Hair style */}
                <div 
                  className="hair" 
                  style={{
                    backgroundImage: hairStyle ? 
                      `url(/assets/hair/${gender}/${hairStyle}.png)` : 
                      'none'
                  }}
                ></div>
                
                {/* Default clothes - Simple shirt and pants */}
                <div className="default-clothing">
                  <div 
                    className="default-shirt"
                    style={{
                      backgroundImage: `url(/assets/clothes/default/${gender}-shirt.png)`
                    }}
                  ></div>
                  <div 
                    className="default-bottom"
                    style={{
                      backgroundImage: `url(/assets/clothes/default/${gender}-bottom.png)`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="customization-options">
            <div className="option-section">
              <h3>Skin Color</h3>
              <div className="color-options">
                {skinColors.map(skin => (
                  <div 
                    key={skin.id} 
                    className={`color-option ${skinColor === skin.color ? 'selected' : ''}`}
                    style={{ backgroundColor: skin.color }}
                    onClick={() => setSkinColor(skin.color)}
                    title={skin.name}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="option-section">
              <h3>Hair Style</h3>
              <div className="hair-options">
                {hairStyles.map(style => (
                  <div 
                    key={style.id} 
                    className={`hair-option ${hairStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setHairStyle(style.id)}
                  >
                    <div 
                      className="hair-preview"
                      style={{
                        backgroundImage: `url(/assets/hair/${gender}/${style.id}-thumb.png)`
                      }}
                    ></div>
                    <span>{style.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <p className="customization-hint">
            More clothing and accessories can be unlocked when you receive gifts from your partner!
          </p>
        </div>
      );
    };

  return (
    <div className="auth-container">
      <h1>SaWish</h1>
      {error && <div className="error">{error}</div>}
      
      {isLogin ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email/Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          {step === 0 && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}
          
          {step === 2 && renderCharacterCustomization()}
          
          <button type="submit">
            {step === 0 ? 'Sign Up' : step === 1 ? 'Next' : 'Complete'}
          </button>
        </form>
      )}
      
      <p onClick={toggleMode}>
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
      </p>
    </div>
  );
};









// Dashboard
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [userExpression, setUserExpression] = useState('normal');
  const [partnerExpression, setPartnerExpression] = useState('normal');
  const [background, setBackground] = useState(null);
  const [displayItem, setDisplayItem] = useState(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Determine user expression based on recent events
          determineUserExpression(data);
          
          // Set background and display item if available
          if (data.appearance) {
            setBackground(data.appearance.background || null);
            setDisplayItem(data.appearance.item || null);
          }
          
          // Update last active timestamp
          await updateDoc(doc(db, 'users', currentUser.uid), {
            lastActive: serverTimestamp()
          });
          
          // Fetch partner data if exists
          if (data.partner) {
            const partnerDoc = await getDoc(doc(db, 'users', data.partner));
            if (partnerDoc.exists()) {
              const pData = partnerDoc.data();
              setPartnerData(pData);
              
              // Determine partner expression
              determinePartnerExpression(pData);
              
              // Check if streak is broken and update expressions accordingly
              checkStreakStatus(data, pData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
    
    // Set up interval to check for new gifts/events every minute
    const intervalId = setInterval(() => {
      fetchRecentEvents();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [currentUser, navigate]);

  // Function to determine character expression based on recent events
  const determineUserExpression = (userData) => {
    // Default to normal expression
    let expression = 'normal';
    
    // Check for recent gifts received
    if (userData.recentGiftsReceived && userData.recentGiftsReceived.length > 0) {
      const latestGift = userData.recentGiftsReceived[0];
      const giftTime = latestGift.receivedAt?.toMillis() || 0;
      
      // If gift received within the last 24 hours, show happy expression
      if (Date.now() - giftTime < 86400000) {
        expression = 'happy';
      }
    }
    
    // Check if streak is broken
    if (userData.streakBroken) {
      expression = 'sad';
    }
    
    setUserExpression(expression);
  };
  
  // Function to determine partner expression
  const determinePartnerExpression = (partnerData) => {
    // Default to normal expression
    let expression = 'normal';
    
    // Similar logic as user expression
    if (partnerData.recentGiftsReceived && partnerData.recentGiftsReceived.length > 0) {
      const latestGift = partnerData.recentGiftsReceived[0];
      const giftTime = latestGift.receivedAt?.toMillis() || 0;
      
      if (Date.now() - giftTime < 86400000) {
        expression = 'happy';
      }
    }
    
    // Check if streak is broken
    if (partnerData.streakBroken) {
      expression = 'angry';
    }
    
    setPartnerExpression(expression);
  };
  
  // Check streak status between partners
  const checkStreakStatus = (userData, partnerData) => {
    const lastGiftFromUser = userData.lastGiftSent?.toMillis() || 0;
    const lastGiftFromPartner = partnerData.lastGiftSent?.toMillis() || 0;
    
    const now = Date.now();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 48 hours
    
    // If user hasn't sent gift in 48 hours, partner is angry
    if (now - lastGiftFromUser > twoDaysInMs) {
      setPartnerExpression('angry');
    }
    
    // If partner hasn't sent gift in 48 hours, user is sad/angry
    if (now - lastGiftFromPartner > twoDaysInMs) {
      setUserExpression('angry');
    }
  };
  
  // Function to fetch recent events (gifts, streak updates)
  const fetchRecentEvents = async () => {
    if (!currentUser || !userData) return;
    
    try {
      // Check for new gifts
      const giftsQuery = query(
        collection(db, "gifts"),
        where("receiverId", "==", currentUser.uid),
        where("status", "==", "delivered"),
        where("deliveredAt", ">", userData.lastActive || serverTimestamp())
      );
      
      const giftsSnapshot = await getDocs(giftsQuery);
      if (!giftsSnapshot.empty) {
        // We have new gifts, update expression
        setUserExpression('happy');
        
        // Update userData with new gifts info
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      
      // If there's a partner, check their status as well
      if (userData.partner) {
        const partnerDoc = await getDoc(doc(db, 'users', userData.partner));
        if (partnerDoc.exists()) {
          setPartnerData(partnerDoc.data());
          determinePartnerExpression(partnerDoc.data());
        }
      }
    } catch (error) {
      console.error('Error fetching recent events:', error);
    }
  };


  
  if (!userData) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="logo">SaWish</div>
        <div className="currency">
          <div className="coin" onClick={() => navigate('/currency')}>
            <span className="icon">💰</span>
            <span>{userData.coins || 0}</span>
          </div>
          <div className="heart" onClick={() => navigate('/currency')}>
            <span className="icon">❤️</span>
            <span>{userData.hearts || 0}</span>
          </div>
        </div>
        <div className="controls">
          <div className="streak">
            <span className="icon">⭐</span>
            <span>Streak: {userData.streak || 0}</span>
          </div>
          <div className="design-btn" onClick={() => navigate('/dashboard-design')}>
            <span className="icon">🎨</span>
          </div>
          <div className="settings-btn" onClick={() => navigate('/settings')}>
            <span className="icon">⚙️</span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-middle">
        {/* Background with location image if available */}
        <div 
          className="dashboard-background" 
          style={{
            backgroundImage: background ? `url(/assets/backgrounds/${background}.png)` : 'none',
            backgroundColor: background ? 'transparent' : '#f0f0f0'
          }}
        ></div>
        
        {/* Items display (gifts, vehicles, etc.) */}
        <div className="dashboard-items">
          {displayItem && (
            <div className="display-item">
              <img 
                src={`/assets/items/${displayItem}.png`} 
                alt="Display Item" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/assets/placeholder-item.png";
                }}
              />
            </div>
          )}
        </div>
        
        <div className="dashboard-characters">
          {/* User Character */}
          <div 
            className="user-character" 
            onClick={() => navigate('/partner-info')}
          >
            <div className="character-container">
              {/* Base character with skin color */}
              <div 
                className="character-base" 
                style={{
                  backgroundColor: userData.skinColor || '#F5D0A9',
                }}
              >
                {/* Character expression */}
                <div className={`expression ${userExpression}`}>
                  {userExpression === 'angry' && (
                    <div className="expression-message">
                      Send a gift to improve your streak!
                    </div>
                  )}
                </div>
                
                {/* Hair style */}
                <div 
                  className="hair" 
                  style={{
                    backgroundImage: userData.hairStyle ? 
                      `url(/assets/hair/${userData.gender}/${userData.hairStyle}.png)` : 
                      'none'
                  }}
                ></div>
                
                {/* If user has appearance settings, render those items */}
                {userData.appearance && (
                  <>
                    {userData.appearance.headwear && (
                      <div 
                        className="headwear"
                        style={{
                          backgroundImage: `url(/assets/accessories/headwear/${userData.appearance.headwear}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.eyewear && (
                      <div 
                        className="eyewear"
                        style={{
                          backgroundImage: `url(/assets/accessories/eyewear/${userData.appearance.eyewear}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.shirt && (
                      <div 
                        className="shirt"
                        style={{
                          backgroundImage: `url(/assets/clothes/shirt/${userData.appearance.shirt}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.coat && (
                      <div 
                        className="coat"
                        style={{
                          backgroundImage: `url(/assets/clothes/coat/${userData.appearance.coat}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.bottom && (
                      <div 
                        className="bottom"
                        style={{
                          backgroundImage: `url(/assets/clothes/bottom/${userData.appearance.bottom}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.shoes && (
                      <div 
                        className="shoes"
                        style={{
                          backgroundImage: `url(/assets/clothes/shoes/${userData.appearance.shoes}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.neckwear && (
                      <div 
                        className="neckwear"
                        style={{
                          backgroundImage: `url(/assets/accessories/neckwear/${userData.appearance.neckwear}.png)`
                        }}
                      ></div>
                    )}
                    
                    {userData.appearance.wristwear && (
                      <div 
                        className="wristwear"
                        style={{
                          backgroundImage: `url(/assets/accessories/wristwear/${userData.appearance.wristwear}.png)`
                        }}
                      ></div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="character-name">{userData.username}</div>
          </div>
          
          {/* Partner character or Add partner button */}
          {partnerData ? (
            <div 
              className="partner-character" 
              onClick={() => navigate('/partner-info')}
            >
              <div className="character-container">
                {/* Base character with skin color */}
                <div 
                  className="character-base" 
                  style={{backgroundColor: partnerData.skinColor || '#F5D0A9'}}
                >
                  {/* Partner expression */}
                  <div className={`expression ${partnerExpression}`}>
                    {partnerExpression === 'angry' && (
                      <div className="expression-message">
                        Partner is upset! Send a gift to make them happy.
                      </div>
                    )}
                  </div>
                  
                  {/* Hair style */}
                  <div 
                    className="hair" 
                    style={{
                      backgroundImage: partnerData.hairStyle ? 
                        `url(/assets/hair/${partnerData.gender}/${partnerData.hairStyle}.png)` : 
                        'none'
                    }}
                  ></div>
                  
                  {/* If partner has appearance settings, render those items */}
                  {partnerData.appearance && (
                    <>
                      {partnerData.appearance.headwear && (
                        <div 
                          className="headwear"
                          style={{
                            backgroundImage: `url(/assets/accessories/headwear/${partnerData.appearance.headwear}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.eyewear && (
                        <div 
                          className="eyewear"
                          style={{
                            backgroundImage: `url(/assets/accessories/eyewear/${partnerData.appearance.eyewear}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.shirt && (
                        <div 
                          className="shirt"
                          style={{
                            backgroundImage: `url(/assets/clothes/shirt/${partnerData.appearance.shirt}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.coat && (
                        <div 
                          className="coat"
                          style={{
                            backgroundImage: `url(/assets/clothes/coat/${partnerData.appearance.coat}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.bottom && (
                        <div 
                          className="bottom"
                          style={{
                            backgroundImage: `url(/assets/clothes/bottom/${partnerData.appearance.bottom}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.shoes && (
                        <div 
                          className="shoes"
                          style={{
                            backgroundImage: `url(/assets/clothes/shoes/${partnerData.appearance.shoes}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.neckwear && (
                        <div 
                          className="neckwear"
                          style={{
                            backgroundImage: `url(/assets/accessories/neckwear/${partnerData.appearance.neckwear}.png)`
                          }}
                        ></div>
                      )}
                      
                      {partnerData.appearance.wristwear && (
                        <div 
                          className="wristwear"
                          style={{
                            backgroundImage: `url(/assets/accessories/wristwear/${partnerData.appearance.wristwear}.png)`
                          }}
                        ></div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="character-name">{partnerData.username}</div>
            </div>
          ) : (
            <div 
              className="add-partner" 
              onClick={() => navigate('/partner-request')}
            >
              <div className="add-icon">+</div>
              <div className="add-text">Add Friend</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-bottom">
        <div 
          className="nav-button game-button" 
          onClick={() => navigate('/game')}
        >
          <span className="nav-icon">🎮</span>
          <span className="nav-text">Game</span>
        </div>
        <div 
          className="nav-button gift-button" 
          onClick={() => navigate('/gift')}
        >
          <span className="nav-icon">🎁</span>
          <span className="nav-text">Gift</span>
        </div>
        <div 
          className="nav-button line-button" 
          onClick={() => navigate('/line')}
        >
          <span className="nav-icon">💬</span>
          <span className="nav-text">Line</span>
        </div>
      </div>
    </div>
  );
};



// Dashboard Design Page
const DashboardDesign = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('character');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [activeItems, setActiveItems] = useState({
    background: '',
    item: '',
    skin: '',
    hair: '',
    headwear: '',
    eyewear: '',
    shirt: '',
    coat: '',
    bottom: '',
    shoes: '',
    neckwear: '',
    wristwear: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Initialize active items from user data
          if (data.appearance) {
            setActiveItems(prev => ({
              ...prev,
              ...data.appearance,
              skin: data.skinColor || prev.skin,
              hair: data.hairStyle ? `${data.gender}/${data.hairStyle}` : prev.hair
            }));
          }
          
          // If user has a partner, fetch their data too
          if (data.partner) {
            const partnerDoc = await getDoc(doc(db, 'users', data.partner));
            if (partnerDoc.exists()) {
              setPartnerData(partnerDoc.data());
            }
          }
          
          // Fetch received gifts that can be used as items
          const giftsQuery = query(
            collection(db, "gifts"),
            where("receiverId", "==", currentUser.uid),
            where("status", "==", "delivered")
          );
          
          const giftsSnapshot = await getDocs(giftsQuery);
          const items = [];
          
          giftsSnapshot.forEach(doc => {
            const giftData = doc.data();
            items.push({
              id: doc.id,
              ...giftData
            });
          });
          
          // Update available items for each category
          updateAvailableItemsByCategory(selectedCategory, items);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [currentUser, navigate]);

  // Update available items based on selected category
  const updateAvailableItemsByCategory = (category, allItems = []) => {
    let filteredItems = [];
    
    switch(category) {
      case 'character':
        // Items for character customization
        if (selectedSubCategory === 'skin') {
          filteredItems = [
            { id: 'skin1', name: 'Fair', color: '#F5D0A9' },
            { id: 'skin2', name: 'Medium', color: '#D4A76A' },
            { id: 'skin3', name: 'Dark', color: '#8B5A2B' }
          ];
        } else if (selectedSubCategory === 'hair') {
          filteredItems = [
            { id: 'hair1', name: 'Style 1', value: '1' },
            { id: 'hair2', name: 'Style 2', value: '2' },
            { id: 'hair3', name: 'Style 3', value: '3' }
          ];
        } else if (selectedSubCategory === 'headwear') {
          filteredItems = allItems.filter(item => item.type === 'headwear');
        } else if (selectedSubCategory === 'eyewear') {
          filteredItems = allItems.filter(item => item.type === 'eyewear');
        } else if (selectedSubCategory === 'shirt') {
          filteredItems = allItems.filter(item => item.type === 'shirt');
        } else if (selectedSubCategory === 'coat') {
          filteredItems = allItems.filter(item => item.type === 'coat');
        } else if (selectedSubCategory === 'bottom') {
          filteredItems = allItems.filter(item => item.type === 'bottom');
        } else if (selectedSubCategory === 'shoes') {
          filteredItems = allItems.filter(item => item.type === 'shoes');
        } else if (selectedSubCategory === 'neckwear') {
          filteredItems = allItems.filter(item => item.type === 'neckwear');
        } else if (selectedSubCategory === 'wristwear') {
          filteredItems = allItems.filter(item => item.type === 'wristwear');
        }
        break;
        
      case 'item':
        // Filter items that can be displayed in dashboard
        filteredItems = allItems.filter(item => 
          ['cheapGift', 'middleGift', 'expensiveGift', 'vehicle'].includes(item.type)
        );
        break;
        
      case 'background':
        // Filter backgrounds (locations)
        filteredItems = allItems.filter(item => item.type === 'location');
        break;
        
      default:
        filteredItems = [];
    }
    
    setAvailableItems(filteredItems);
  };

  // Handle sub-category selection
  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
    updateAvailableItemsByCategory(selectedCategory);
  };

  // Handle item selection and update activeItems
  const handleItemSelect = (item) => {
    let updatedItems = { ...activeItems };
    
    if (selectedCategory === 'character') {
      if (selectedSubCategory === 'skin') {
        updatedItems.skin = item.color;
      } else {
        updatedItems[selectedSubCategory] = item.id;
      }
    } else if (selectedCategory === 'item') {
      updatedItems.item = item.id;
    } else if (selectedCategory === 'background') {
      updatedItems.background = item.id;
    }
    
    setActiveItems(updatedItems);
    saveAppearance(updatedItems);
  };

  // Save appearance to database
  const saveAppearance = async (appearance) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        appearance: appearance,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving appearance:', error);
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="dashboard-design">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Dashboard Design</h1>
      
      <div className="design-container">
        <div className="preview-section">
          <div className="preview">
            {/* Background Layer */}
            <div className="background-layer" style={{
              backgroundColor: '#e0e0e0',
              backgroundImage: activeItems.background ? `url(/assets/backgrounds/${activeItems.background}.png)` : 'none'
            }}>
              {/* Item Layer */}
              <div className="item-layer">
                {activeItems.item && (
                  <div className="item-box">
                    Item: {activeItems.item}
                  </div>
                )}
              </div>
              
              {/* Character Layer */}
              <div className="character-layer">
                {/* Base Character */}
                <div className="character-base" style={{ backgroundColor: activeItems.skin || userData.skinColor || '#F5D0A9' }}>
                  {/* Hair Layer */}
                  <div className="hair-layer" style={{
                    backgroundImage: `url(/assets/hair/${activeItems.hair || `${userData.gender}/${userData.hairStyle}`}.png)`
                  }}></div>
                  
                  {/* Clothes Layers */}
                  {activeItems.bottom && (
                    <div className="bottom-layer">Bottom: {activeItems.bottom}</div>
                  )}
                  
                  {activeItems.shirt && (
                    <div className="shirt-layer">Shirt: {activeItems.shirt}</div>
                  )}
                  
                  {activeItems.coat && (
                    <div className="coat-layer">Coat: {activeItems.coat}</div>
                  )}
                  
                  {/* Accessories Layers */}
                  {activeItems.shoes && (
                    <div className="shoes-layer">Shoes: {activeItems.shoes}</div>
                  )}
                  
                  {activeItems.neckwear && (
                    <div className="neckwear-layer">Neckwear: {activeItems.neckwear}</div>
                  )}
                  
                  {activeItems.wristwear && (
                    <div className="wristwear-layer">Wristwear: {activeItems.wristwear}</div>
                  )}
                  
                  {activeItems.eyewear && (
                    <div className="eyewear-layer">Eyewear: {activeItems.eyewear}</div>
                  )}
                  
                  {activeItems.headwear && (
                    <div className="headwear-layer">Headwear: {activeItems.headwear}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="options-section">
          <div className="category-tabs">
            <div 
              className={`category-tab ${selectedCategory === 'character' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('character');
                setSelectedSubCategory('');
              }}
            >
              Character
            </div>
            <div 
              className={`category-tab ${selectedCategory === 'item' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('item');
                setSelectedSubCategory('');
              }}
            >
              Items
            </div>
            <div 
              className={`category-tab ${selectedCategory === 'background' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('background');
                setSelectedSubCategory('');
              }}
            >
              Background
            </div>
          </div>
          
          {selectedCategory === 'character' && (
            <div className="subcategory-tabs">
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'skin' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('skin')}
              >
                Skin Color
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'hair' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('hair')}
              >
                Hair Style
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'headwear' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('headwear')}
              >
                Headwear
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'eyewear' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('eyewear')}
              >
                Eyewear
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'shirt' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('shirt')}
              >
                Shirts
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'coat' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('coat')}
              >
                Coats
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'bottom' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('bottom')}
              >
                Bottoms
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'shoes' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('shoes')}
              >
                Shoes
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'neckwear' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('neckwear')}
              >
                Neckwear
              </div>
              <div 
                className={`subcategory-tab ${selectedSubCategory === 'wristwear' ? 'active' : ''}`}
                onClick={() => handleSubCategoryClick('wristwear')}
              >
                Wristwear
              </div>
            </div>
          )}
          
          <div className="items-grid">
            {selectedSubCategory && availableItems.map(item => (
              <div 
                key={item.id} 
                className={`item-option ${activeItems[selectedSubCategory] === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
              >
                {/* Display item preview */}
                {selectedSubCategory === 'skin' ? (
                  <div className="color-preview" style={{ backgroundColor: item.color }}></div>
                ) : (
                  <div className="item-preview">
                    {/* Replace with actual images when available */}
                    <div className="placeholder-box">{item.name || item.id}</div>
                  </div>
                )}
              </div>
            ))}
            
            {selectedCategory === 'item' && availableItems.map(item => (
              <div 
                key={item.id} 
                className={`item-option ${activeItems.item === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
              >
                <div className="item-preview">
                  <div className="placeholder-box">{item.name || item.id}</div>
                </div>
              </div>
            ))}
            
            {selectedCategory === 'background' && availableItems.map(item => (
              <div 
                key={item.id} 
                className={`item-option ${activeItems.background === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
              >
                <div className="background-preview">
                  <div className="placeholder-box">{item.name || item.id}</div>
                </div>
              </div>
            ))}
            
            {((selectedCategory === 'character' && selectedSubCategory) || 
             selectedCategory === 'item' || 
             selectedCategory === 'background') && 
             availableItems.length === 0 && (
              <div className="no-items-message">
                No items available. Receive gifts from your partner to unlock customization options.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="save-button" onClick={() => navigate('/dashboard')}>
        Apply Changes
      </div>
    </div>
  );
};








// Settings Page
const Settings = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [instaId, setInstaId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [soundVolume, setSoundVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setInstaId(data.instaId || '');
        setPhoneNumber(data.phoneNumber || '');
        setSoundVolume(data.soundVolume || 50);
        setMusicVolume(data.musicVolume || 50);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username,
        bio,
        instaId,
        phoneNumber,
        soundVolume,
        musicVolume
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="settings">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Settings</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Instagram ID</label>
          <input
            type="text"
            value={instaId}
            onChange={(e) => setInstaId(e.target.value)}
          />
          <small>Only shown to partner after 30 days of streak</small>
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <small>Only shown to partner after 30 days of streak</small>
        </div>
        
        <div className="form-group">
          <label>Sound Effects Volume: {soundVolume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => setSoundVolume(Number(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label>Music Volume: {musicVolume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
          />
        </div>
        
        <button type="submit">Save Settings</button>
      </form>
      
      <div className="about-section">
        <p>Developed by Chinurag</p>
        <p><a href="https://instagram.com/chinurag" target="_blank" rel="noopener noreferrer">Send Feedback</a></p>
      </div>
      
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>
  );
};











// Partner Request Page
const PartnerRequest = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        
        // Fetch incoming requests
        const requestsQuery = query(
          collection(db, "partnerRequests"), 
          where("to", "==", currentUser.uid)
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = [];
        
        for (const requestDoc of requestsSnapshot.docs) {
          const requestData = requestDoc.data();
          const fromUserDoc = await getDoc(doc(db, 'users', requestData.from));
          
          if (fromUserDoc.exists()) {
            requests.push({
              id: requestDoc.id,
              fromUser: {
                id: requestData.from,
                ...fromUserDoc.data()
              }
            });
          }
        }
        
        setIncomingRequests(requests);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Search by username
      const usernameQuery = query(
        collection(db, "users"), 
        where("username", "==", searchQuery)
      );
      
      const usernameSnapshot = await getDocs(usernameQuery);
      const results = [];
      
      usernameSnapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
          results.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendPartnerRequest = async (toUserId) => {
    try {
      await setDoc(doc(collection(db, 'partnerRequests')), {
        from: currentUser.uid,
        to: toUserId,
        createdAt: serverTimestamp()
      });
      
      alert('Request sent successfully!');
    } catch (error) {
      console.error('Error sending partner request:', error);
    }
  };

  const acceptPartnerRequest = async (requestId, fromUserId) => {
    try {
      // Update both users
      await updateDoc(doc(db, 'users', currentUser.uid), {
        partner: fromUserId
      });
      
      await updateDoc(doc(db, 'users', fromUserId), {
        partner: currentUser.uid
      });
      
      // Delete the request
      // Note: In a real app, you'd also delete other requests involving these users
      await setDoc(doc(db, 'partnerRequests', requestId), {
        status: 'accepted'
      }, { merge: true });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting partner request:', error);
    }
  };

  const rejectPartnerRequest = async (requestId) => {
    try {
      await setDoc(doc(db, 'partnerRequests', requestId), {
        status: 'rejected'
      }, { merge: true });
      
      // Remove from local state
      setIncomingRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
    } catch (error) {
      console.error('Error rejecting partner request:', error);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}?invite=${currentUser.uid}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="partner-request">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Find a Partner</h1>
      
      <div className="invite-section">
        <h2>Invite a Friend</h2>
        <button onClick={copyInviteLink}>Copy Invite Link</button>
      </div>
      
      <div className="search-section">
        <h2>Search for Users</h2>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username"
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        
        <div className="search-results">
          {searchResults.map(user => (
            <div key={user.id} className="user-card">
              <div className="avatar" style={{backgroundColor: user.skinColor}}>
                <div className="hair" style={{backgroundImage: `url(/assets/hair/${user.gender}/${user.hairStyle}.png)`}}></div>
              </div>
              <div className="user-info">
                <div className="username">{user.username}</div>
                <div className="gender">{user.gender}</div>
              </div>
              <button onClick={() => sendPartnerRequest(user.id)}>Send Request</button>
            </div>
          ))}
          
          {searchResults.length === 0 && searchQuery && 
            <p>No users found with username "{searchQuery}"</p>
          }
        </div>
      </div>
      
      <div className="incoming-requests">
        <h2>Incoming Requests</h2>
        {incomingRequests.length > 0 ? (
          incomingRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="avatar" style={{backgroundColor: request.fromUser.skinColor}}>
                <div className="hair" style={{backgroundImage: `url(/assets/hair/${request.fromUser.gender}/${request.fromUser.hairStyle}.png)`}}></div>
              </div>
              <div className="user-info">
                <div className="username">{request.fromUser.username}</div>
                <div className="gender">{request.fromUser.gender}</div>
              </div>
              <div className="actions">
                <button 
                  className="accept" 
                  onClick={() => acceptPartnerRequest(request.id, request.fromUser.id)}
                >
                  Accept
                </button>
                <button 
                  className="reject" 
                  onClick={() => rejectPartnerRequest(request.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No incoming requests</p>
        )}
      </div>
    </div>
  );
};











// Currency Management Page
const CurrencyManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [lastShared, setLastShared] = useState(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setLastShared(userDoc.data().lastShared?.toDate() || null);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate]);

  const handlePurchaseCoins = async (amount, price) => {
    // In a real app, this would integrate with a payment gateway
    alert(`Would process payment of ₹${price} for ${amount} coins`);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        coins: (userData.coins || 0) + amount
      });
      
      // Update local state
      setUserData({
        ...userData,
        coins: (userData.coins || 0) + amount
      });
    } catch (error) {
      console.error('Error updating coins:', error);
    }
  };

  const handleShareAndEarn = async () => {
    const now = new Date();
    
    // Check if 2 minutes have passed since last share
    if (lastShared && now - lastShared < 2 * 60 * 1000) {
      const timeLeft = Math.ceil((2 * 60 * 1000 - (now - lastShared)) / 1000);
      alert(`Please wait ${timeLeft} seconds before sharing again`);
      return;
    }
    
    setShareLoading(true);
    
    try {
      const link = `${window.location.origin}?invite=${currentUser.uid}`;
      await navigator.clipboard.writeText(link);
      
      // Update hearts and last shared timestamp
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        hearts: (userData.hearts || 0) + 10,
        lastShared: serverTimestamp()
      });
      
      // Update local state
      setUserData({
        ...userData,
        hearts: (userData.hearts || 0) + 10
      });
      setLastShared(now);
      
      alert('Link copied and 10 hearts earned!');
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleGenerateDiscountCode = async (heartsRequired, discountPercentage) => {
    if ((userData.hearts || 0) < heartsRequired) {
      alert(`You need ${heartsRequired} hearts to generate this discount code`);
      return;
    }
    
    // In a real app, this would generate a unique code
    const discountCode = `SAWISH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    try {
      // Deduct hearts
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        hearts: (userData.hearts || 0) - heartsRequired
      });
      
      // Save discount code
      await setDoc(doc(collection(db, 'discountCodes')), {
        code: discountCode,
        percentage: discountPercentage,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        used: false
      });
      
      // Update local state
      setUserData({
        ...userData,
        hearts: (userData.hearts || 0) - heartsRequired
      });
      
      alert(`Your ${discountPercentage}% discount code is: ${discountCode}`);
    } catch (error) {
      console.error('Error generating discount code:', error);
    }
  };

  // Add this to your Dashboard component
const RatingDisplay = ({ userData }) => {
  return (
    <div className="ratings-display">
      <h3>Your Game Rankings</h3>
      <div className="ratings-grid">
        <div className="rating-card">
          <div className="rating-title">Luck Games</div>
          <div className="rating-value">{userData?.ratings?.luck?.rating || 1000}</div>
          <div className="games-played">{userData?.ratings?.luck?.gamesPlayed || 0} games played</div>
        </div>
        <div className="rating-card">
          <div className="rating-title">Skill Games</div>
          <div className="rating-value">{userData?.ratings?.skill?.rating || 1000}</div>
          <div className="games-played">{userData?.ratings?.skill?.gamesPlayed || 0} games played</div>
        </div>
        <div className="rating-card">
          <div className="rating-title">Knowledge Games</div>
          <div className="rating-value">{userData?.ratings?.knowledge?.rating || 1000}</div>
          <div className="games-played">{userData?.ratings?.knowledge?.gamesPlayed || 0} games played</div>
        </div>
      </div>
    </div>
  );
};

const RatingBadge = ({ rating, category }) => {
  // Determine tier based on rating
  let tier, tierClass;
  
  if (rating >= 1800) {
    tier = "Grandmaster";
    tierClass = "gm";
  } else if (rating >= 1600) {
    tier = "Expert";
    tierClass = "expert";
  } else if (rating >= 1400) {
    tier = "Advanced";
    tierClass = "advanced";
  } else if (rating >= 1200) {
    tier = "Intermediate";
    tierClass = "intermediate";
  } else if (rating >= 1000) {
    tier = "Beginner";
    tierClass = "beginner";
  } else {
    tier = "Novice";
    tierClass = "novice";
  }
  
  return (
    <div className={`rating-badge ${category} ${tierClass}`}>
      <div className="rating-value">{rating}</div>
      <div className="rating-tier">{tier}</div>
    </div>
  );
};




  if (!userData) return <div>Loading...</div>;

  return (
    <div className="currency-management">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Currency Management</h1>
      
      <div className="currency-card coins-card">
        <div className="icon">💰</div>
        <h2>Coins</h2>
        <div className="amount">{userData.coins || 0}</div>
        <div className="actions">
          <button onClick={() => handlePurchaseCoins(1000, 100)}>
            1,000 coins for ₹100
          </button>
          <button onClick={() => handlePurchaseCoins(10000, 1000)}>
            10,000 coins for ₹1,000
          </button>
          <button onClick={() => handlePurchaseCoins(100000, 10000)}>
            100,000 coins for ₹10,000
          </button>
        </div>
      </div>
      
      <div className="currency-card hearts-card">
        <div className="icon">❤️</div>
        <h2>Hearts</h2>
        <div className="amount">{userData.hearts || 0}</div>
        <div className="actions">
          <button 
            onClick={handleShareAndEarn}
            disabled={shareLoading}
          >
            {shareLoading ? 'Processing...' : 'Share and Earn 10 Hearts'}
          </button>
          <div className="discount-section">
            <h3>Generate Discount Codes</h3>
            <button onClick={() => handleGenerateDiscountCode(5000, 5)}>
              5% Discount (Under ₹1,000) - 5,000 Hearts
            </button>
            <button onClick={() => handleGenerateDiscountCode(7000, 10)}>
              10% Discount (₹1,000 - ₹5,000) - 7,000 Hearts
            </button>
            <button onClick={() => handleGenerateDiscountCode(10000, 5)}>
              5% Discount (Over ₹10,000) - 10,000 Hearts
            </button>
          </div>
        </div>
      </div>
      
      <div className="currency-card streak-card">
        <div className="icon">⭐</div>
        <h2>Streak</h2>
        <div className="amount">{userData.streak || 0}</div>
        <div className="streak-info">
          <p>Maintain a streak by gifting your partner daily</p>
          <ul>
            <li>10 Days: Unlock partner's personality description</li>
            <li>20 Days: Unlock relationship description</li>
            <li>30 Days: Unlock contact information</li>
            <li>365 Days: 25% discount on gifts under ₹500</li>
          </ul>
        </div>
      </div>
       {/* Add this where appropriate in your Dashboard layout */}
      <RatingDisplay userData={userData} />
      <div className="about-section">
        <h2>About SaWish</h2>
        <p>SaWish - See a Wish coming true. Build relationships through meaningful interactions, gifts, and games.</p>
        <p>Experience the joy of forming deeper connections as you progress through different stages of your relationship.</p>
        <p>Learn about each other through fun games and meaningful gestures.</p>
        <p>Developed by Chinurag</p>
      </div>
    </div>
  );
};








// Partner Info Page
const PartnerInfo = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [streakLevel, setStreakLevel] = useState(0);
  const [endCountdown, setEndCountdown] = useState(0);
  const [endTimerId, setEndTimerId] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        if (data.partner) {
          const partnerDoc = await getDoc(doc(db, 'users', data.partner));
          if (partnerDoc.exists()) {
            setPartnerData(partnerDoc.data());
            
            // Determine streak level
            const streak = data.streak || 0;
            if (streak >= 365) setStreakLevel(4);
            else if (streak >= 30) setStreakLevel(3);
            else if (streak >= 20) setStreakLevel(2);
            else if (streak >= 10) setStreakLevel(1);
            else setStreakLevel(0);
          }
        } else {
          navigate('/partner-request');
        }
      }
    };
    
    fetchData();
    
    // Clear any existing timer on unmount
    return () => {
      if (endTimerId) clearInterval(endTimerId);
    };
  }, [currentUser, navigate]);

  const startEndCountdown = () => {
    setIsEnding(true);
    setEndCountdown(200);
    
    const timerId = setInterval(() => {
      setEndCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setEndTimerId(timerId);
  };

  const cancelEndCountdown = () => {
    if (endTimerId) {
      clearInterval(endTimerId);
      setEndTimerId(null);
    }
    setIsEnding(false);
    setEndCountdown(0);
  };

  const endRelationship = async () => {
    if (!partnerData || endCountdown > 0) return;
    
    try {
      // Update both users
      await updateDoc(doc(db, 'users', currentUser.uid), {
        partner: null,
        relationshipEndedAt: serverTimestamp(),
        previousPartner: userData.partner
      });
      
      await updateDoc(doc(db, 'users', userData.partner), {
        partner: null,
        relationshipEndedAt: serverTimestamp(),
        previousPartner: currentUser.uid
      });
      
      navigate('/partner-request');
    } catch (error) {
      console.error('Error ending relationship:', error);
    }
  };

  const reconnectRelationship = async () => {
    if (!userData || !userData.previousPartner) return;
    
    try {
      // Send a new partner request
      await setDoc(doc(collection(db, 'partnerRequests')), {
        from: currentUser.uid,
        to: userData.previousPartner,
        isReconnect: true,
        createdAt: serverTimestamp()
      });
      
      alert('Reconnect request sent!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error sending reconnect request:', error);
    }
  };

  // Add this to your PartnerInfo component
const RatingSection = ({ partnerData }) => {
  return (
    <div className="partner-ratings">
      <h3>Game Rankings</h3>
      <div className="rating-details">
        <div className="rating-item">
          <span className="game-type">Luck:</span>
          <span className="rating-badge">{partnerData?.ratings?.luck?.rating || 1000}</span>
        </div>
        <div className="rating-item">
          <span className="game-type">Skill:</span>
          <span className="rating-badge">{partnerData?.ratings?.skill?.rating || 1000}</span>
        </div>
        <div className="rating-item">
          <span className="game-type">Knowledge:</span>
          <span className="rating-badge">{partnerData?.ratings?.knowledge?.rating || 1000}</span>
        </div>
      </div>
    </div>
  );
};



  if (!userData || (userData.partner && !partnerData)) return <div>Loading...</div>;

  return (
    <div className="partner-info">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Partner Information</h1>
      
      <div className="partner-profile">
        <div className="avatar" style={{backgroundColor: partnerData?.skinColor}}>
          <div className="hair" style={{backgroundImage: `url(/assets/hair/${partnerData?.gender}/${partnerData?.hairStyle}.png)`}}></div>
        </div>
        
        <div className="partner-details">
          <h2>{partnerData?.username}</h2>
          <p className="bio">{partnerData?.bio || 'No bio available'}</p>
          
          <div className="stats">
            <div className="stat">
              <span className="label">Zodiac Sign:</span>
              <span className="value">{/* Calculate from DOB */}</span>
            </div>
            <div className="stat">
              <span className="label">Gifted Hearts:</span>
              <span className="value">{userData?.giftsReceived || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Streak:</span>
              <span className="value">{userData?.streak || 0} days</span>
            </div>
          </div>
          {/* Add this where appropriate in your PartnerInfo layout */}
          <RatingSection partnerData={partnerData} />
          
          {streakLevel >= 1 && (
            <div className="personality-section">
              <h3>Personality</h3>
              <p>{/* Generated based on zodiac sign, game achievements, etc. */}</p>
            </div>
          )}
          
          {streakLevel >= 2 && (
            <div className="relationship-section">
              <h3>Relationship Dynamic</h3>
              <p>{/* Generated based on interaction patterns, gifts, etc. */}</p>
            </div>
          )}
          
          {streakLevel >= 3 && (
            <div className="contact-section">
              <h3>Contact Information</h3>
              {partnerData?.instaId && (
                <div className="contact-item">
                  <span className="label">Instagram:</span>
                  <span className="value">{partnerData.instaId}</span>
                </div>
              )}
              {partnerData?.phoneNumber && (
                <div className="contact-item">
                  <span className="label">Phone:</span>
                  <span className="value">{partnerData.phoneNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isEnding ? (
        <div className="end-relationship-section">
          <p className="warning">Warning: Ending this relationship will delete all progress.</p>
          <p className="countdown">Countdown: {endCountdown} seconds</p>
          <div className="actions">
            <button 
              className="proceed" 
              disabled={endCountdown > 0}
              onClick={endRelationship}
            >
              Proceed
            </button>
            <button className="cancel" onClick={cancelEndCountdown}>
              Cancel
            </button>
          </div>
        </div>
      ) : userData?.previousPartner ? (
        <div className="reconnect-section">
          <button className="reconnect-btn" onClick={reconnectRelationship}>
            Reconnect
          </button>
          <p>You have 7 days to reconnect before the streak is reset.</p>
        </div>
      ) : (
        <button className="end-btn" onClick={startEndCountdown}>
          End Relationship
        </button>
      )}
    </div>
  );
};






// Gift Page
const Gift = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('casual');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Define gift categories and subcategories
  const giftCategories = {
    casual: {
      name: 'Casual Gifts',
      subcategories: [
        { id: 'watches', name: 'Watches & Accessories' },
        { id: 'cloths', name: 'Casual Clothes' },
        { id: 'glasses', name: 'Eyewear' },
        { id: 'tech', name: 'Tech Gadgets' },
        { id: 'food', name: 'Food & Treats' },
        { id: 'books', name: 'Books & Novels' }
      ]
    },
    romantic: {
      name: 'Romantic Gifts',
      subcategories: [
        { id: 'flowers', name: 'Flowers' },
        { id: 'fashion', name: 'Premium Fashion' },
        { id: 'pets', name: 'Pets & Animals' },
        { id: 'jewelry', name: 'Jewelry & Accessories' },
        { id: 'trips', name: 'Trips & Experiences' },
        { id: 'vehicles', name: 'Vehicles' }
      ]
    }
  };
  
  // Sample gift data - in production this would come from your database
  // Each gift has a unique 5-digit code as required
  const giftItems = {
    watches: [
      { id: '10001', name: 'Simple Watch', price: 200, image: '/assets/gifts/watches/simple.png' },
      { id: '10002', name: 'Sports Watch', price: 300, image: '/assets/gifts/watches/sports.png' },
      { id: '10003', name: 'Digital Watch', price: 250, image: '/assets/gifts/watches/digital.png' }
      // More watches can be added here
    ],
    cloths: [
      { id: '20001', name: 'Casual T-Shirt', price: 150, image: '/assets/gifts/cloths/tshirt.png' },
      { id: '20002', name: 'Denim Jeans', price: 350, image: '/assets/gifts/cloths/jeans.png' },
      { id: '20003', name: 'Hoodie', price: 400, image: '/assets/gifts/cloths/hoodie.png' }
      // More clothes can be added here
    ],
    glasses: [
      { id: '30001', name: 'Classic Sunglasses', price: 200, image: '/assets/gifts/glasses/classic.png' },
      { id: '30002', name: 'Reading Glasses', price: 180, image: '/assets/gifts/glasses/reading.png' },
      { id: '30003', name: 'Sport Sunglasses', price: 250, image: '/assets/gifts/glasses/sport.png' }
      // More glasses can be added here
    ],
    tech: [
      { id: '40001', name: 'Wireless Earbuds', price: 500, image: '/assets/gifts/tech/earbuds.png' },
      { id: '40002', name: 'Smart Watch', price: 800, image: '/assets/gifts/tech/smartwatch.png' },
      { id: '40003', name: 'Phone Stand', price: 120, image: '/assets/gifts/tech/phonestand.png' }
      // More tech items can be added here
    ],
    food: [
      { id: '50001', name: 'Chocolate Box', price: 150, image: '/assets/gifts/food/chocolate.png' },
      { id: '50002', name: 'Gourmet Cookies', price: 120, image: '/assets/gifts/food/cookies.png' },
      { id: '50003', name: 'Coffee Set', price: 200, image: '/assets/gifts/food/coffee.png' }
      // More food items can be added here
    ],
    books: [
      { id: '60001', name: 'Mystery Novel', price: 180, image: '/assets/gifts/books/mystery.png' },
      { id: '60002', name: 'Romance Novel', price: 180, image: '/assets/gifts/books/romance.png' },
      { id: '60003', name: 'Self-Help Book', price: 200, image: '/assets/gifts/books/selfhelp.png' }
      // More books can be added here
    ],
    flowers: [
      { id: '70001', name: 'Rose Bouquet', price: 300, image: '/assets/gifts/flowers/roses.png' },
      { id: '70002', name: 'Tulip Arrangement', price: 350, image: '/assets/gifts/flowers/tulips.png' },
      { id: '70003', name: 'Mixed Flowers', price: 400, image: '/assets/gifts/flowers/mixed.png' }
      // More flowers can be added here
    ],
    fashion: [
      { id: '80001', name: 'Designer Shirt', price: 700, image: '/assets/gifts/fashion/shirt.png' },
      { id: '80002', name: 'Premium Dress', price: 900, image: '/assets/gifts/fashion/dress.png' },
      { id: '80003', name: 'Luxury Coat', price: 1500, image: '/assets/gifts/fashion/coat.png' }
      // More fashion items can be added here
    ],
    pets: [
      { id: '90001', name: 'Virtual Puppy', price: 800, image: '/assets/gifts/pets/puppy.png' },
      { id: '90002', name: 'Virtual Kitten', price: 800, image: '/assets/gifts/pets/kitten.png' },
      { id: '90003', name: 'Virtual Bird', price: 500, image: '/assets/gifts/pets/bird.png' }
      // More pets can be added here
    ],
    jewelry: [
      { id: 'A0001', name: 'Silver Bracelet', price: 600, image: '/assets/gifts/jewelry/bracelet.png' },
      { id: 'A0002', name: 'Pendant Necklace', price: 800, image: '/assets/gifts/jewelry/necklace.png' },
      { id: 'A0003', name: 'Elegant Earrings', price: 500, image: '/assets/gifts/jewelry/earrings.png' }
      // More jewelry can be added here
    ],
    trips: [
      { id: 'B0001', name: 'Beach Getaway', price: 2000, image: '/assets/gifts/trips/beach.png' },
      { id: 'B0002', name: 'Mountain Retreat', price: 1800, image: '/assets/gifts/trips/mountain.png' },
      { id: 'B0003', name: 'City Adventure', price: 1500, image: '/assets/gifts/trips/city.png' }
      // More trips can be added here
    ],
    vehicles: [
      { id: 'C0001', name: 'Sports Car', price: 5000, image: '/assets/gifts/vehicles/sportscar.png' },
      { id: 'C0002', name: 'Motorcycle', price: 3000, image: '/assets/gifts/vehicles/motorcycle.png' },
      { id: 'C0003', name: 'Luxury Yacht', price: 10000, image: '/assets/gifts/vehicles/yacht.png' }
      // More vehicles can be added here
    ]
  };
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          if (data.partner) {
            const partnerDoc = await getDoc(doc(db, 'users', data.partner));
            if (partnerDoc.exists()) {
              setPartnerData(partnerDoc.data());
            }
          } else {
            // No partner, redirect to partner request page
            navigate('/partner-request');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, navigate]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedGift(null);
    setConfirmPurchase(false);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedGift(null);
    setConfirmPurchase(false);
  };

  const handleGiftSelect = (gift) => {
    setSelectedGift(gift);
    setConfirmPurchase(false);
  };

  const handlePurchaseConfirm = () => {
    setConfirmPurchase(true);
  };

  const handlePurchase = async () => {
    if (!selectedGift || !userData || !partnerData) return;
    
    // Check if user has enough coins
    if ((userData.coins || 0) < selectedGift.price) {
      alert("You don't have enough coins for this gift!");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a gift record
      await setDoc(doc(collection(db, 'gifts')), {
        from: currentUser.uid,
        to: userData.partner,
        giftCode: selectedGift.id,
        giftName: selectedGift.name,
        price: selectedGift.price,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        sentAt: serverTimestamp(),
        opened: false
      });
      
      // Update user's coins
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: (userData.coins || 0) - selectedGift.price
      });
      
      // Update partner's hearts and gift count
      await updateDoc(doc(db, 'users', userData.partner), {
        hearts: (partnerData.hearts || 0) + Math.floor(selectedGift.price / 10), // 10% of price becomes hearts
        giftsReceived: (partnerData.giftsReceived || 0) + 1
      });
      
      // Check if streaks should be updated (once per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastGiftDate = userData.lastGiftSent?.toDate() || new Date(0);
      lastGiftDate.setHours(0, 0, 0, 0);
      
      if (today > lastGiftDate) {
        // Update streak if this is the first gift of the day
        await updateDoc(doc(db, 'users', currentUser.uid), {
          streak: (userData.streak || 0) + 1,
          lastGiftSent: serverTimestamp()
        });
      }
      
      alert('Gift sent successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPurchase = () => {
    setConfirmPurchase(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  
  if (!userData || !partnerData) return <div className="error">Error loading data</div>;

  return (
    <div className="gift-page">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Gift Shop</h1>
      
      <div className="user-info">
        <div className="coins">
          <span className="icon">💰</span>
          <span>{userData.coins || 0} Coins</span>
        </div>
        <div className="recipient">
          <span>Gift Recipient: </span>
          <span className="partner-name">{partnerData.username}</span>
        </div>
      </div>
      
      <div className="category-tabs">
        <div 
          className={`tab ${selectedCategory === 'casual' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('casual')}
        >
          Casual Gifts
        </div>
        <div 
          className={`tab ${selectedCategory === 'romantic' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('romantic')}
        >
          Romantic Gifts
        </div>
      </div>
      
      {!selectedSubcategory ? (
        <div className="subcategories">
          <h2>{giftCategories[selectedCategory].name}</h2>
          <div className="subcategory-grid">
            {giftCategories[selectedCategory].subcategories.map(subcategory => (
              <div 
                key={subcategory.id} 
                className="subcategory-card"
                onClick={() => handleSubcategorySelect(subcategory.id)}
              >
                <div className="subcategory-icon">
                  {/* Placeholder for subcategory icon */}
                  <div className="icon-placeholder"></div>
                </div>
                <div className="subcategory-name">{subcategory.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedGift ? (
        <div className="gift-items">
          <div className="subcategory-header">
            <button 
              className="back-to-categories" 
              onClick={() => setSelectedSubcategory(null)}
            >
              ← Back to Categories
            </button>
            <h2>{giftCategories[selectedCategory].subcategories.find(s => s.id === selectedSubcategory)?.name}</h2>
          </div>
          
          <div className="gift-grid">
            {giftItems[selectedSubcategory]?.map(gift => (
              <div 
                key={gift.id} 
                className="gift-card"
                onClick={() => handleGiftSelect(gift)}
              >
                <div className="gift-image">
                  {/* Image will be blurred until purchase as specified in requirements */}
                  <div className="blur-overlay"></div>
                  <img 
                    src={gift.image} 
                    alt={gift.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/gifts/placeholder.png';
                    }}
                  />
                </div>
                <div className="gift-details">
                  <div className="gift-name">{gift.name}</div>
                  <div className="gift-price">
                    <span className="coin-icon">💰</span>
                    <span>{gift.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !confirmPurchase ? (
        <div className="gift-details-view">
          <div className="details-header">
            <button 
              className="back-to-gifts" 
              onClick={() => setSelectedGift(null)}
            >
              ← Back to Gifts
            </button>
            <h2>{selectedGift.name}</h2>
          </div>
          
          <div className="gift-preview">
            <div className="gift-image-large">
              <div className="blur-overlay"></div>
              <img 
                src={selectedGift.image} 
                alt={selectedGift.name} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/gifts/placeholder.png';
                }}
              />
            </div>
            
            <div className="gift-info">
              <div className="gift-code">Gift Code: {selectedGift.id}</div>
              <div className="gift-price-large">
                <span className="price-label">Price:</span>
                <span className="coin-icon">💰</span>
                <span className="price-amount">{selectedGift.price}</span>
              </div>
              
              <div className="gift-actions">
                <button 
                  className="purchase-btn"
                  onClick={handlePurchaseConfirm}
                  disabled={(userData.coins || 0) < selectedGift.price}
                >
                  Send Gift to {partnerData.username}
                </button>
                
                {(userData.coins || 0) < selectedGift.price && (
                  <div className="insufficient-coins">
                    You need {selectedGift.price - (userData.coins || 0)} more coins!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="confirm-purchase">
          <h2>Confirm Gift Purchase</h2>
          
          <div className="purchase-summary">
            <div className="summary-item">
              <span className="label">Gift:</span>
              <span className="value">{selectedGift.name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Recipient:</span>
              <span className="value">{partnerData.username}</span>
            </div>
            <div className="summary-item">
              <span className="label">Price:</span>
              <span className="value">
                <span className="coin-icon">💰</span>
                <span>{selectedGift.price}</span>
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Your Balance After Purchase:</span>
              <span className="value">
                <span className="coin-icon">💰</span>
                <span>{(userData.coins || 0) - selectedGift.price}</span>
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Hearts They Will Receive:</span>
              <span className="value">
                <span className="heart-icon">❤️</span>
                <span>{Math.floor(selectedGift.price / 10)}</span>
              </span>
            </div>
          </div>
          
          <div className="confirm-actions">
            <button 
              className="confirm-btn"
              onClick={handlePurchase}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
            <button 
              className="cancel-btn"
              onClick={handleCancelPurchase}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};





// EloUtils.js - Create this new file

// Calculate K-factor based on games played (decreases as more games are played)
export const calculateKFactor = (gamesPlayed) => {
  if (gamesPlayed < 10) {
    return 40; // Very volatile for new players
  } else if (gamesPlayed < 30) {
    return 30; // Moderately volatile
  } else if (gamesPlayed < 100) {
    return 20; // Standard K factor
  } else {
    return 10; // Stable rating for experienced players
  }
};

// Calculate expected outcome based on ratings
export const calculateExpectedOutcome = (playerRating, opponentRating) => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

// Calculate new rating after a game
export const calculateNewRating = (currentRating, expectedOutcome, actualOutcome, kFactor) => {
  return Math.round(currentRating + kFactor * (actualOutcome - expectedOutcome));
};

// Adjust difficulty for computer "opponent" rating
export const getComputerRatingByDifficulty = (gameType, difficulty) => {
  const baseRatings = {
    luck: 1000, // Luck games are mostly random
    skill: 1000,
    knowledge: 1000
  };
  
  const difficultyMultipliers = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.2,
    expert: 1.4
  };
  
  return Math.round(baseRatings[gameType] * difficultyMultipliers[difficulty || 'medium']);
};


// Game Page
const Game = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [gameCategory, setGameCategory] = useState('luck'); // 'luck', 'skill', 'knowledge'
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For Dice Roll Game
  const [betAmount, setBetAmount] = useState(50);
  const [selectedNumber, setSelectedNumber] = useState(7);
  const [dice, setDice] = useState([1, 1, 1]);
  const [diceRolling, setDiceRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win', 'lose', null
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate]);

  const selectGameCategory = (category) => {
    setGameCategory(category);
    setSelectedGame(null);
    setGameResult(null);
  };
  
  const selectGame = (game) => {
    setSelectedGame(game);
    setGameResult(null);
    
    // Reset game state
    if (game === 'diceRoll') {
      setDice([1, 1, 1]);
      setBetAmount(50);
      setSelectedNumber(7);
    }
  };
  
  const playDiceRoll = async () => {
    // Check if user has enough coins
    if ((userData.coins || 0) < betAmount) {
      alert('Not enough coins to place this bet!');
      return;
    }
    
    setDiceRolling(true);
    setGameResult(null);
    
    // Animate dice rolling
    let rollCount = 0;
    const maxRolls = 10;
    const rollInterval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      
      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        finalizeDiceRoll();
      }
    }, 100);
  };
  
  const finalizeDiceRoll = async () => {
    // Generate final dice values
    const finalDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    
    setDice(finalDice);
    setDiceRolling(false);
    
    // Calculate sum of dice
    const sum = finalDice.reduce((acc, val) => acc + val, 0);
    
    // Check if user won
    const win = sum === selectedNumber;
    setGameResult(win ? 'win' : 'lose');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const newCoins = win ? 
        (userData.coins || 0) + betAmount : 
        (userData.coins || 0) - Math.floor(betAmount / 2); // Lose half the bet
      
    // Calculate new Elo rating
    const gamesPlayed = userData.ratings?.luck?.gamesPlayed || 0;
    const currentRating = userData.ratings?.luck?.rating || 1000;
    
    // Difficulty based on selected number (numbers closer to 10/11 are easier)
    let difficulty;
    const numberDifficulty = Math.abs(selectedNumber - 10.5);
    if (numberDifficulty <= 1.5) difficulty = 'easy';
    else if (numberDifficulty <= 3) difficulty = 'medium';
    else if (numberDifficulty <= 5) difficulty = 'hard';
    else difficulty = 'expert';
    
    const computerRating = getComputerRatingByDifficulty('luck', difficulty);
    const expectedOutcome = calculateExpectedOutcome(currentRating, computerRating);
    const actualOutcome = win ? 1 : 0;
    const kFactor = calculateKFactor(gamesPlayed);
    const newRating = calculateNewRating(currentRating, expectedOutcome, actualOutcome, kFactor);
    

      await updateDoc(userRef, {
        coins: newCoins,
        lastActive: serverTimestamp()
      });
      
    // Update local state
    setUserData({
      ...userData,
      coins: newCoins,
      ratings: {
        ...userData.ratings,
        luck: {
          rating: newRating,
          gamesPlayed: gamesPlayed + 1
        }
      }
    });
    
    // Show rating change in UI
    setRatingChange(newRating - currentRating);
    } catch (error) {
      console.error('Error updating coins:', error);
    }
  };
  




// Add this to your state declarations in the Game component
const [ratingChange, setRatingChange] = useState(0);

  const renderDiceRollGame = () => (
    <div className="dice-roll-game">
      <h2>Dice Roll</h2>
      <p>Bet on a number and roll three dice. If the sum equals your number, you win!</p>
      
    <div className="user-stats">
      <div className="stat-item">
        <span className="stat-label">Your Rating:</span>
        <span className="stat-value">{userData?.ratings?.luck?.rating || 1000}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Games Played:</span>
        <span className="stat-value">{userData?.ratings?.luck?.gamesPlayed || 0}</span>
      </div>
    </div>

      <div className="game-controls">
        <div className="bet-controls">
          <label>Your Bet: {betAmount} coins</label>
          <input
            type="range"
            min="50"
            max={Math.min(1000, userData?.coins || 50)}
            step="50"
            value={betAmount}
            onChange={(e) => setBetAmount(parseInt(e.target.value))}
            disabled={diceRolling}
          />
        </div>
        
        <div className="number-selection">
          <label>Select a number (3-18):</label>
          <input
            type="range"
            min="3"
            max="18"
            value={selectedNumber}
            onChange={(e) => setSelectedNumber(parseInt(e.target.value))}
            disabled={diceRolling}
          />
          <span>{selectedNumber}</span>
        </div>
      </div>
      
      <div className="dice-container">
        {dice.map((value, index) => (
          <div key={index} className="dice">
            {value}
          </div>
        ))}
      </div>
      
      <div className="dice-total">
        Total: {dice.reduce((acc, val) => acc + val, 0)}
      </div>
      
      <button 
        className="roll-button" 
        onClick={playDiceRoll}
        disabled={diceRolling}
      >
        {diceRolling ? 'Rolling...' : 'Roll Dice'}
      </button>
      
      {gameResult && (
        <div className={`game-result ${gameResult}`}>
          {gameResult === 'win' ? 
            `Congratulations! You won ${betAmount} coins!` : 
            `Sorry, you lost ${Math.floor(betAmount / 2)} coins.`}
                  {ratingChange !== 0 && (
          <div className="rating-change">
            Rating: {ratingChange > 0 ? '+' : ''}{ratingChange}
                      </div>
        )}
        </div>
      )}
    </div>
  );
  





// Quiz Game Component
const QuizGame = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizCategory, setQuizCategory] = useState('history'); // 'history', 'science', 'geography', 'math'
  const [quizDifficulty, setQuizDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSelected, setIsAnswerSelected] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate]);

  // Quiz questions organized by category and difficulty
  const quizQuestions = {
    history: {
      easy: [
        {
          question: "Who was the first President of the United States?",
          options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"],
          correctAnswer: "George Washington"
        },
        {
          question: "In which year did World War II end?",
          options: ["1943", "1944", "1945", "1946"],
          correctAnswer: "1945"
        },
        {
          question: "Which ancient civilization built the pyramids at Giza?",
          options: ["Romans", "Greeks", "Egyptians", "Persians"],
          correctAnswer: "Egyptians"
        },
        {
          question: "Which event marked the beginning of World War I?",
          options: ["Pearl Harbor attack", "Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "Fall of the Berlin Wall"],
          correctAnswer: "Assassination of Archduke Franz Ferdinand"
        },
        {
          question: "Who was the leader of the Soviet Union during the Cuban Missile Crisis?",
          options: ["Vladimir Lenin", "Joseph Stalin", "Nikita Khrushchev", "Mikhail Gorbachev"],
          correctAnswer: "Nikita Khrushchev"
        },
        {
          question: "In which year did the United States declare independence?",
          options: ["1776", "1783", "1789", "1798"],
          correctAnswer: "1776"
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Vincent van Gogh"],
          correctAnswer: "Leonardo da Vinci"
        },
        {
          question: "Which country was the first to circumnavigate the globe?",
          options: ["Spain", "Portugal", "England", "Netherlands"],
          correctAnswer: "Spain"
        },
        {
          question: "Who was the first female Prime Minister of the United Kingdom?",
          options: ["Queen Elizabeth II", "Margaret Thatcher", "Theresa May", "Queen Victoria"],
          correctAnswer: "Margaret Thatcher"
        },
        {
          question: "Which civilization built the ancient city of Machu Picchu?",
          options: ["Maya", "Aztec", "Inca", "Olmec"],
          correctAnswer: "Inca"
        }
      ],
      medium: [
        // Add medium difficulty history questions
        {
          question: "During which century did the Renaissance primarily occur?",
          options: ["13th and 14th centuries", "14th and 15th centuries", "15th and 16th centuries", "16th and 17th centuries"],
          correctAnswer: "15th and 16th centuries"
        },
        {
          question: "Which battle marked the end of Napoleon's rule in 1815?",
          options: ["Battle of Austerlitz", "Battle of Waterloo", "Battle of Trafalgar", "Battle of Borodino"],
          correctAnswer: "Battle of Waterloo"
        }
        // Add more medium difficulty history questions as needed
      ],
      hard: [
        // Add hard difficulty history questions
        {
          question: "Who was the Byzantine Emperor during the Fall of Constantinople in 1453?",
          options: ["Constantine XI Palaiologos", "Alexios I Komnenos", "Justinian I", "Basil II"],
          correctAnswer: "Constantine XI Palaiologos"
        },
        {
          question: "During which dynasty did the An Lushan Rebellion occur in ancient China?",
          options: ["Han Dynasty", "Song Dynasty", "Tang Dynasty", "Ming Dynasty"],
          correctAnswer: "Tang Dynasty"
        }
        // Add more hard difficulty history questions as needed
      ]
    },
    science: {
      easy: [
        {
          question: "What is the chemical symbol for water?",
          options: ["WA", "H2O", "W", "HO"],
          correctAnswer: "H2O"
        },
        {
          question: "Which planet is closest to the Sun?",
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correctAnswer: "Mercury"
        },
        {
          question: "What is the study of fossils called?",
          options: ["Geology", "Paleontology", "Archaeology", "Anthropology"],
          correctAnswer: "Paleontology"
        },
        {
          question: "What is the largest organ in the human body?",
          options: ["Heart", "Liver", "Brain", "Skin"],
          correctAnswer: "Skin"
        },
        {
          question: "Which part of the plant conducts photosynthesis?",
          options: ["Roots", "Stem", "Leaves", "Flowers"],
          correctAnswer: "Leaves"
        },
        {
          question: "What is the basic unit of life?",
          options: ["Atom", "Cell", "Tissue", "Organ"],
          correctAnswer: "Cell"
        },
        {
          question: "What is the hardest natural substance on Earth?",
          options: ["Gold", "Iron", "Diamond", "Platinum"],
          correctAnswer: "Diamond"
        },
        {
          question: "Which gas makes up the majority of Earth's atmosphere?",
          options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
          correctAnswer: "Nitrogen"
        },
        {
          question: "What is the study of weather called?",
          options: ["Geology", "Meteorology", "Hydrology", "Seismology"],
          correctAnswer: "Meteorology"
        },
        {
          question: "Which organ is responsible for pumping blood throughout the body?",
          options: ["Lungs", "Liver", "Heart", "Kidneys"],
          correctAnswer: "Heart"
        }
      ],
      medium: [
        // Add medium difficulty science questions
      ],
      hard: [
        // Add hard difficulty science questions
      ]
    },
    geography: {
      easy: [
        {
          question: "What is the largest continent by land area?",
          options: ["North America", "Europe", "Africa", "Asia"],
          correctAnswer: "Asia"
        },
        {
          question: "Which country has the largest population in the world?",
          options: ["India", "United States", "Russia", "China"],
          correctAnswer: "China"
        },
        {
          question: "What is the capital city of Australia?",
          options: ["Sydney", "Melbourne", "Canberra", "Perth"],
          correctAnswer: "Canberra"
        },
        {
          question: "Which river is the longest in the world?",
          options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
          correctAnswer: "Nile"
        },
        {
          question: "Which desert is the largest in the world?",
          options: ["Gobi", "Kalahari", "Sahara", "Antarctic"],
          correctAnswer: "Antarctic"
        },
        {
          question: "What is the capital of Japan?",
          options: ["Kyoto", "Tokyo", "Osaka", "Hiroshima"],
          correctAnswer: "Tokyo"
        },
        {
          question: "Which mountain range separates Europe from Asia?",
          options: ["Alps", "Himalayas", "Ural Mountains", "Andes"],
          correctAnswer: "Ural Mountains"
        },
        {
          question: "Which country is known as the 'Land of Fire and Ice'?",
          options: ["New Zealand", "Norway", "Iceland", "Canada"],
          correctAnswer: "Iceland"
        },
        {
          question: "What is the largest ocean on Earth?",
          options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
          correctAnswer: "Pacific Ocean"
        },
        {
          question: "Which of these countries is not in Africa?",
          options: ["Egypt", "Nigeria", "Thailand", "Kenya"],
          correctAnswer: "Thailand"
        }
      ],
      medium: [
        // Add medium difficulty geography questions
      ],
      hard: [
        // Add hard difficulty geography questions
      ]
    },
    math: {
      easy: [
        {
          question: "What is 7 × 8?",
          options: ["54", "56", "62", "48"],
          correctAnswer: "56"
        },
        {
          question: "If a triangle has angles measuring 90°, 45°, and 45°, what type of triangle is it?",
          options: ["Equilateral", "Isosceles right", "Scalene", "Obtuse"],
          correctAnswer: "Isosceles right"
        },
        {
          question: "What is the area of a rectangle with width 5 and length 10?",
          options: ["25", "50", "15", "30"],
          correctAnswer: "50"
        },
        {
          question: "What is the value of π (pi) rounded to two decimal places?",
          options: ["3.14", "3.41", "3.16", "3.12"],
          correctAnswer: "3.14"
        },
        {
          question: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
          options: ["24", "30", "32", "36"],
          correctAnswer: "32"
        },
        {
          question: "What is 15% of 200?",
          options: ["30", "35", "25", "15"],
          correctAnswer: "30"
        },
        {
          question: "If x + 5 = 12, what is the value of x?",
          options: ["5", "7", "8", "17"],
          correctAnswer: "7"
        },
        {
          question: "What is the perimeter of a square with side length 4?",
          options: ["8", "12", "16", "20"],
          correctAnswer: "16"
        },
        {
          question: "What is the sum of the interior angles of a triangle?",
          options: ["90°", "180°", "270°", "360°"],
          correctAnswer: "180°"
        },
        {
          question: "If a car travels at 60 mph, how many miles will it travel in 2.5 hours?",
          options: ["120", "150", "130", "175"],
          correctAnswer: "150"
        }
      ],
      medium: [
        // Add medium difficulty math questions
      ],
      hard: [
        // Add hard difficulty math questions
      ]
    }
  };

  // Set up quiz when category or difficulty changes
  const setUpQuiz = () => {
    // Get questions based on selected category and difficulty
    const selectedQuestions = quizQuestions[quizCategory][quizDifficulty];
    
    // Shuffle the questions to randomize order
    const shuffledQuestions = [...selectedQuestions].sort(() => 0.5 - Math.random());
    
    // Take only the first 10 questions (or fewer if there aren't 10 available)
    const quizSet = shuffledQuestions.slice(0, 10);
    
    setQuestions(quizSet);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setQuizComplete(false);
    setEarnedCoins(0);
    setQuizStarted(true);
  };

  const handleAnswerClick = (selectedOption) => {
    if (isAnswerSelected) return; // Prevent multiple selections
    
    setSelectedAnswer(selectedOption);
    setIsAnswerSelected(true);
    
    // Check if answer is correct
    const isCorrect = selectedOption === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    // Show feedback for a moment before moving to next question
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setIsAnswerSelected(false);
      } else {
        setShowScore(true);
        calculateReward();
      }
    }, 1000);
  };

  const calculateReward = async () => {
    const correctAnswers = score + (selectedAnswer === questions[currentQuestion].correctAnswer ? 1 : 0);
    const totalQuestions = questions.length;
    const percentage = Math.floor((correctAnswers / totalQuestions) * 100);
    
    let earnedCoins = 0;
    
    // Calculate coins earned for correct answers
    earnedCoins += correctAnswers * 15;
    
    // Subtract coins for wrong answers
    earnedCoins -= (totalQuestions - correctAnswers) * 3;
    
    // Add bonus based on percentage
    if (percentage >= 90) {
      earnedCoins += 100;
    } else if (percentage >= 70) {
      earnedCoins += 50;
    } else if (percentage >= 50) {
      earnedCoins += 30;
    }
    
    // Ensure the user doesn't lose coins
    if (earnedCoins < 0) earnedCoins = 0;
    
    setEarnedCoins(earnedCoins);
    setQuizComplete(true);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const newCoins = (userData.coins || 0) + earnedCoins;
      
    // Calculate new Elo rating
    const gamesPlayed = userData.ratings?.knowledge?.gamesPlayed || 0;
    const currentRating = userData.ratings?.knowledge?.rating || 1000;
    
    // For quiz game, winning is defined as scoring above 50%
    const win = percentage >= 50;
    
    // Higher percentage gives better outcome value
    let actualOutcome;
    if (percentage >= 90) actualOutcome = 1.0;
    else if (percentage >= 70) actualOutcome = 0.75;
    else if (percentage >= 50) actualOutcome = 0.5;
    else actualOutcome = 0.25;
    
    const computerRating = getComputerRatingByDifficulty('knowledge', quizDifficulty);
    const expectedOutcome = calculateExpectedOutcome(currentRating, computerRating);
    const kFactor = calculateKFactor(gamesPlayed);
    const newRating = calculateNewRating(currentRating, expectedOutcome, actualOutcome, kFactor);
    
    // Calculate rating change for display
    const ratingChange = newRating - currentRating;
    setRatingChange(ratingChange);
      
      await updateDoc(userRef, {
        coins: newCoins,
        lastActive: serverTimestamp(),
      'ratings.knowledge.rating': newRating,
      'ratings.knowledge.gamesPlayed': gamesPlayed + 1
      });
      
      // Update local state
      setUserData({
        ...userData,
        coins: newCoins,
      ratings: {
        ...userData.ratings,
        knowledge: {
          rating: newRating,
          gamesPlayed: gamesPlayed + 1
        }
      }
      });
    } catch (error) {
      console.error('Error updating coins:', error);
    }
  };

      // Add state for rating change
      const [ratingChange, setRatingChange] = useState(0);

  const renderQuizCategorySelection = () => (
    <div className="quiz-setup">
      <h2>Knowledge Quiz</h2>
      <p>Test your knowledge and earn coins!</p>
      
      <div className="quiz-options">
        <div className="category-selection">
          <h3>Select Category</h3>
          <div className="options-grid">
            <div 
              className={`option ${quizCategory === 'history' ? 'selected' : ''}`}
              onClick={() => setQuizCategory('history')}
            >
              World History
            </div>
            <div 
              className={`option ${quizCategory === 'science' ? 'selected' : ''}`}
              onClick={() => setQuizCategory('science')}
            >
              Science
            </div>
            <div 
              className={`option ${quizCategory === 'geography' ? 'selected' : ''}`}
              onClick={() => setQuizCategory('geography')}
            >
              Geography
            </div>
            <div 
              className={`option ${quizCategory === 'math' ? 'selected' : ''}`}
              onClick={() => setQuizCategory('math')}
            >
              Mathematics
            </div>
          </div>
        </div>
        
        <div className="difficulty-selection">
          <h3>Select Difficulty</h3>
          <div className="options-grid">
            <div 
              className={`option ${quizDifficulty === 'easy' ? 'selected' : ''}`}
              onClick={() => setQuizDifficulty('easy')}
            >
              Easy
            </div>
            <div 
              className={`option ${quizDifficulty === 'medium' ? 'selected' : ''}`}
              onClick={() => setQuizDifficulty('medium')}
            >
              Medium
            </div>
            <div 
              className={`option ${quizDifficulty === 'hard' ? 'selected' : ''}`}
              onClick={() => setQuizDifficulty('hard')}
            >
              Hard
            </div>
          </div>
        </div>
      </div>
      
      <div className="reward-info">
        <p>Rewards:</p>
        <ul>
          <li>+15 coins for each correct answer</li>
          <li>-3 coins for each wrong answer</li>
          <li>+30 coins bonus for scoring 50% or higher</li>
          <li>+50 coins bonus for scoring 70% or higher</li>
          <li>+100 coins bonus for scoring 90% or higher</li>
        </ul>
      </div>
      
      <button 
        className="start-quiz-button"
        onClick={setUpQuiz}
      >
        Start Quiz
      </button>
    </div>
  );

  const renderQuestion = () => (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="progress-indicator">
          Question {currentQuestion + 1}/{questions.length}
        </div>
        <div className="category-indicator">
          {quizCategory.charAt(0).toUpperCase() + quizCategory.slice(1)} - {quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}
        </div>
      </div>
      
      <div className="question-container">
        <h2 className="question-text">{questions[currentQuestion].question}</h2>
        
        <div className="options-container">
          {questions[currentQuestion].options.map((option, index) => (
            <div 
              key={index}
              className={`option-box ${selectedAnswer === option ? 
                (option === questions[currentQuestion].correctAnswer ? 'correct' : 'incorrect') : ''}`}
              onClick={() => handleAnswerClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      
      <div className="score-counter">
        Current Score: {score}/{currentQuestion}
      </div>
    </div>
  );

  const renderScoreScreen = () => (
    <div className="score-screen">
      <h2>Quiz Complete!</h2>
      
      <div className="score-display">
        <div className="score-circle">
          <div className="score-percentage">
            {Math.floor((score / questions.length) * 100)}%
          </div>
          <div className="score-text">
            You scored {score} out of {questions.length}
          </div>
        </div>
      </div>

          <div className="user-stats">
      <div className="stat-item">
        <span className="stat-label">Knowledge Rating:</span>
        <span className="stat-value">
          {userData?.ratings?.knowledge?.rating || 1000}
          {ratingChange !== 0 && (
            <span className={`rating-change ${ratingChange > 0 ? 'positive' : 'negative'}`}>
              {ratingChange > 0 ? '+' : ''}{ratingChange}
            </span>
          )}
        </span>
      </div>
    </div>
      
      <div className="reward-breakdown">
        <h3>Coins Earned: {earnedCoins}</h3>
        <div className="reward-details">
          <p>Correct answers: {score} × 15 = {score * 15} coins</p>
          <p>Incorrect answers: {questions.length - score} × (-3) = {(questions.length - score) * -3} coins</p>
          
          {Math.floor((score / questions.length) * 100) >= 90 && (
            <p>90% or higher bonus: +100 coins</p>
          )}
          
          {Math.floor((score / questions.length) * 100) >= 70 && Math.floor((score / questions.length) * 100) < 90 && (
            <p>70% or higher bonus: +50 coins</p>
          )}
          
          {Math.floor((score / questions.length) * 100) >= 50 && Math.floor((score / questions.length) * 100) < 70 && (
            <p>50% or higher bonus: +30 coins</p>
          )}
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="restart-button"
          onClick={() => {
            setQuizStarted(false);
            setShowScore(false);
          }}
        >
          Try Another Quiz
        </button>
        
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="quiz-game-page">
      <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
      <h1>Knowledge Quiz</h1>
      
      <div className="user-coins">
        <span className="icon">💰</span>
        <span>{userData?.coins || 0} coins</span>
      </div>
      
      {!quizStarted && renderQuizCategorySelection()}
      {quizStarted && !showScore && renderQuestion()}
      {showScore && renderScoreScreen()}
    </div>
  );
};








  const renderSkillGames = () => (
    <div className="skill-games">
      <h2>Skill Games</h2>
      <p>Coming soon - test your skills and earn coins!</p>
      <div className="game-list">
        <div className="game-card coming-soon">
          <h3>Sudoku</h3>
          <p>Solve puzzles of varying difficulty</p>

            {/* 
            Example Sudoku completion handler - add this to your Sudoku game component once implemented
            
            const handleSudokuCompletion = async (difficulty, timeUsed, isCorrect) => {
              if (!isCorrect) {
                // Handle incorrect solution
                return;
              }
              
              try {
                const userRef = doc(db, 'users', currentUser.uid);
                
                // Calculate coins based on difficulty and time
                let earnedCoins = 0;
                switch(difficulty) {
                  case 'easy':
                    earnedCoins = Math.max(100, 200 - Math.floor(timeUsed / 30));
                    break;
                  case 'medium':
                    earnedCoins = Math.max(150, 300 - Math.floor(timeUsed / 30));
                    break;
                  case 'hard':
                    earnedCoins = Math.max(200, 400 - Math.floor(timeUsed / 30));
                    break;
                }
                
                const newCoins = (userData.coins || 0) + earnedCoins;
                
                // Calculate new Elo rating
                const gamesPlayed = userData.ratings?.skill?.gamesPlayed || 0;
                const currentRating = userData.ratings?.skill?.rating || 1000;
                
                // Calculate actual outcome based on time used relative to expected completion time
                let expectedCompletionTime;
                switch(difficulty) {
                  case 'easy': expectedCompletionTime = 300; break; // 5 minutes
                  case 'medium': expectedCompletionTime = 600; break; // 10 minutes
                  case 'hard': expectedCompletionTime = 900; break; // 15 minutes
                }
                
                // Better time = better outcome (1.0 is perfect)
                const timeRatio = Math.min(expectedCompletionTime / timeUsed, 2); // Cap at 2x expected time
                const actualOutcome = Math.min(1.0, timeRatio * 0.5);
                
                const computerRating = getComputerRatingByDifficulty('skill', difficulty);
                const expectedOutcome = calculateExpectedOutcome(currentRating, computerRating);
                const kFactor = calculateKFactor(gamesPlayed);
                const newRating = calculateNewRating(currentRating, expectedOutcome, actualOutcome, kFactor);
                
                // Update user data in Firestore
                await updateDoc(userRef, {
                  coins: newCoins,
                  lastActive: serverTimestamp(),
                  'ratings.skill.rating': newRating,
                  'ratings.skill.gamesPlayed': gamesPlayed + 1
                });
                
                // Update local state
                setUserData({
                  ...userData,
                  coins: newCoins,
                  ratings: {
                    ...userData.ratings,
                    skill: {
                      rating: newRating,
                      gamesPlayed: gamesPlayed + 1
                    }
                  }
                });
                
                // Show rating change
                setRatingChange(newRating - currentRating);
                
              } catch (error) {
                console.error('Error updating skill game data:', error);
              }
            }; */}
        </div>
        <div className="game-card coming-soon">
          <h3>Crossword</h3>
          <p>Test your vocabulary knowledge</p>
        </div>
      </div>
    </div>
  );





  
const renderKnowledgeGames = () => (
  <div className="knowledge-games">
    <h2>Knowledge Games</h2>
    <p>Test your knowledge and earn coins!</p>
    <div className="game-list">
      <div 
        className={`game-card ${selectedGame === 'quizGame' ? 'selected' : ''}`}
        onClick={() => selectGame('quizGame')}
      >
        <h3>Knowledge Quiz</h3>
        <p>Test your knowledge in various subjects</p>
      </div>
      <div className="game-card coming-soon">
        <h3>Science Quiz</h3>
        <p>Answer questions about science</p>
      </div>
    </div>
  </div>
);
  
  const renderLuckGames = () => (
    <div className="luck-games">
      <h2>Luck Games</h2>
      <p>Try your luck and win coins!</p>
      <div className="game-list">
        <div 
          className={`game-card ${selectedGame === 'diceRoll' ? 'selected' : ''}`}
          onClick={() => selectGame('diceRoll')}
        >
          <h3>Dice Roll</h3>
          <p>Choose a number and roll three dice</p>
        </div>
        <div className="game-card coming-soon">
          <h3>Rock Paper Scissors</h3>
          <p>Play against the computer</p>
        </div>
      </div>
    </div>
  );
  
  const renderGameSelection = () => (
    <div className="game-selection">
      <div className="category-tabs">
        <div 
          className={`tab ${gameCategory === 'luck' ? 'active' : ''}`}
          onClick={() => selectGameCategory('luck')}
        >
          Luck
        </div>
        <div 
          className={`tab ${gameCategory === 'skill' ? 'active' : ''}`}
          onClick={() => selectGameCategory('skill')}
        >
          Skill
        </div>
        <div 
          className={`tab ${gameCategory === 'knowledge' ? 'active' : ''}`}
          onClick={() => selectGameCategory('knowledge')}
        >
          Knowledge
        </div>
      </div>
      
      {gameCategory === 'luck' && renderLuckGames()}
      {gameCategory === 'skill' && renderSkillGames()}
      {gameCategory === 'knowledge' && renderKnowledgeGames()}
    </div>
  );
  
  if (loading) return <div>Loading...</div>;

      // Game component render return statement
      return (
        <div className="game-page">
          <div className="back-btn" onClick={() => navigate('/dashboard')}>← Back</div>
          <h1>Games</h1>
          
          <div className="user-coins">
            <span className="icon">💰</span>
            <span>{userData?.coins || 0} coins</span>
          </div>
          
          {selectedGame === 'diceRoll' ? (
            <>
              <button className="back-to-games" onClick={() => setSelectedGame(null)}>
                ← Back to Games
              </button>
              {renderDiceRollGame()}
            </>
          ) : selectedGame === 'quizGame' ? (
            <>
              <button className="back-to-games" onClick={() => setSelectedGame(null)}>
                ← Back to Games
              </button>
              <QuizGame />
            </>
          ) : (
            renderGameSelection()
          )}
        </div>
      );
};







// Line Page
const Line = () => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmojiButton, setShowEmojiButton] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [unlockedLines, setUnlockedLines] = useState({
    casual: [],
    romantic: []
  });
  const [conversationId, setConversationId] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = React.useRef(null);
  
  // Predefined lines
  const predefinedLines = {
    casual: [
      { id: 'c1', text: "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat!" },
      { id: 'c2', text: "I just achieved a new high score in the knowledge game! If you beat it, react with 🎮" },
      { id: 'c3', text: "The weekend is finally here! What are your plans?" },
      { id: 'c4', text: "I saw something today that reminded me of you." },
      { id: 'c5', text: "If you're having a good day, react with 😊" },
      { id: 'c6', text: "Did you know that crows can recognize human faces and remember people who have threatened them?" },
      { id: 'c7', text: "I'm trying to break my personal streak record in this app!" },
      { id: 'c8', text: "The universe contains more stars than grains of sand on all the beaches on Earth." },
      { id: 'c9', text: "If we were animals, what do you think we'd be? React with your answer!" },
      { id: 'c10', text: "What's your favorite season? Spring 🌸, Summer ☀️, Fall 🍂, or Winter ❄️?" },
    ],
    romantic: [
      { id: 'r1', text: "Every moment with you feels like a page from my favorite story." },
      { id: 'r2', text: "You're the first thought in my morning and the last in my night." },
      { id: 'r3', text: "If I had a star for every time you brightened my day, I'd have a galaxy." },
      { id: 'r4', text: "Your smile is literally the cutest thing I've ever seen in my life." },
      { id: 'r5', text: "Being with you makes everything better." },
      { id: 'r6', text: "You're the missing piece I never knew I needed." },
      { id: 'r7', text: "I never knew what it was like to look at someone and smile for no reason until I met you." },
      { id: 'r8', text: "You're not just my partner, you're my best friend." },
      { id: 'r9', text: "If home is where the heart is, then my home is wherever you are." },
      { id: 'r10', text: "I love how we can be weird together and no one judges us." },
    ]
  };
  
  // Common emoji reactions
  const commonEmojis = ['❤️', '😊', '😍', '🥰', '😂', '👍', '👏', '🎉', '🤔', '🙄', '😘', '🥺', '😢', '😮', '😎'];
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          // Check if there's a partner
          if (data.partner) {
            const partnerDoc = await getDoc(doc(db, 'users', data.partner));
            if (partnerDoc.exists()) {
              setPartnerData(partnerDoc.data());
              
              // Create or get conversation ID (smaller user ID + larger user ID)
              const sortedIds = [currentUser.uid, data.partner].sort();
              const convId = `${sortedIds[0]}_${sortedIds[1]}`;
              setConversationId(convId);
              
              // Load unlocked lines from localStorage
              const savedUnlockedLines = localStorage.getItem(`unlockedLines_${currentUser.uid}`);
              if (savedUnlockedLines) {
                setUnlockedLines(JSON.parse(savedUnlockedLines));
              }
              
              // Create conversation document if it doesn't exist
              const conversationRef = doc(db, 'conversations', convId);
              const conversationDoc = await getDoc(conversationRef);
              if (!conversationDoc.exists()) {
                await setDoc(conversationRef, {
                  participants: [currentUser.uid, data.partner],
                  createdAt: serverTimestamp(),
                  lastMessageAt: serverTimestamp()
                });
              }
            }
          } else {
            navigate('/partner-request');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [currentUser, navigate]);
  
  // Set up real-time listener for messages when conversationId is available
  useEffect(() => {
    if (!conversationId) return;
    
    // Create messages subcollection if it doesn't exist
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const updatedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
        };
      });
      
      setMessages(updatedMessages);
      
      // Check if there's a new message from partner
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser?.uid) {
        // This is a message from partner
        setHasNewMessage(true);
        
        // If we're not focused on this page, show an alert
        if (!document.hasFocus()) {
          // Use browser notification if allowed
          if (Notification.permission === "granted") {
            new Notification("New message from " + partnerData?.username, { 
              body: lastMessage.text
            });
          } else {
            // Fallback to alert if notifications not permitted
            alert("New line from " + partnerData?.username + ": " + lastMessage.text);
          }
        }
      }
    });
    
    // Request notification permission
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    return () => unsubscribe();
  }, [conversationId, currentUser?.uid, partnerData?.username]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Clear new message flag when user views messages
    if (document.hasFocus()) {
      setHasNewMessage(false);
    }
  }, [messages]);
  
  // Listen for window focus to clear new message flag
  useEffect(() => {
    const handleFocus = () => setHasNewMessage(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  const openLineSelection = (category) => {
    setSelectedCategory(category);
    setShowEmojiPicker(false);
    setShowEmojiButton(false);
    setSelectedMessageId(null);
  };
  
  const unlockLine = (category, lineId) => {
    const line = predefinedLines[category].find(l => l.id === lineId);
    if (!line) return;
    
    const cost = category === 'casual' ? 3 : 5;
    
    if ((userData.hearts || 0) < cost) {
      alert(`You need ${cost} hearts to unlock this line`);
      return;
    }
    
    // Update user hearts in database
    updateDoc(doc(db, 'users', currentUser.uid), {
      hearts: (userData.hearts || 0) - cost
    });
    
    // Update local state
    setUserData({
      ...userData,
      hearts: (userData.hearts || 0) - cost
    });
    
    // Add to unlocked lines
    const updatedUnlockedLines = {
      ...unlockedLines,
      [category]: [...unlockedLines[category], lineId]
    };
    
    setUnlockedLines(updatedUnlockedLines);
    localStorage.setItem(`unlockedLines_${currentUser.uid}`, JSON.stringify(updatedUnlockedLines));
  };
  
  const sendLine = async (category, lineId) => {
    if (!conversationId) return;
    
    const line = predefinedLines[category].find(l => l.id === lineId);
    if (!line) return;
    
    const cost = category === 'casual' ? 10 : 20;
    
    if ((userData.hearts || 0) < cost) {
      alert(`You need ${cost} hearts to send this line`);
      return;
    }
    
    try {
      // Update user hearts in database
      await updateDoc(doc(db, 'users', currentUser.uid), {
        hearts: (userData.hearts || 0) - cost
      });
      
      // Update local state
      setUserData({
        ...userData,
        hearts: (userData.hearts || 0) - cost
      });
      
      // Add message to Firestore
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: line.text,
        senderId: currentUser.uid,
        senderName: userData.username,
        category,
        timestamp: serverTimestamp(),
        reactions: []
      });
      
      // Update conversation's lastMessageAt
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessageAt: serverTimestamp()
      });
      
      setSelectedCategory(null);
      
      // Play sound effect for sending a line
      playSound(category === 'casual' ? 'casual-line' : 'romantic-line');
    } catch (error) {
      console.error("Error sending line:", error);
      alert("Failed to send line. Please try again.");
    }
  };
  
  const addReaction = async (messageId, emoji) => {
    if (!conversationId) return;
    
    try {
      // Get the message document reference
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const reactions = [...(messageData.reactions || [])];
        
        // Add new reaction
        reactions.push({
          emoji,
          userId: currentUser.uid,
          timestamp: new Date().toISOString()
        });
        
        // Update the message document with new reaction
        await updateDoc(messageRef, { reactions });
      }
      
      setShowEmojiPicker(false);
      setShowEmojiButton(false);
      setSelectedMessageId(null);
      
      // Play sound effect for emoji reaction
      playSound('emoji-reaction');
    } catch (error) {
      console.error("Error adding reaction:", error);
      alert("Failed to add reaction. Please try again.");
    }
  };
  
  const toggleEmojiPicker = (messageId) => {
    setSelectedMessageId(messageId);
    setShowEmojiPicker(!showEmojiPicker);
    setShowEmojiButton(false);
  };
  
  const toggleEmojiButton = () => {
    setShowEmojiButton(!showEmojiButton);
    setShowEmojiPicker(false);
    setSelectedMessageId(null);
  };
  
  // Play sound effect for different actions
  const playSound = (type) => {
    const sounds = {
      'casual-line': '/assets/sounds/casual-line.mp3',
      'romantic-line': '/assets/sounds/romantic-line.mp3',
      'emoji-reaction': '/assets/sounds/emoji.mp3'
    };
    
    try {
      const audio = new Audio(sounds[type]);
      audio.play().catch(err => console.warn('Sound play failed:', err));
    } catch (error) {
      console.log(`Playing sound: ${type} (fallback)`);
    }
  };
  
  if (!userData || !partnerData) return <div className="loading">Loading...</div>;

  return (
    <div className="line-page">
      <div className="line-header">
        <div className="back-btn" onClick={() => navigate('/dashboard')}>
          <span>←</span> Back
        </div>
        <div className="partner-info">
          <h2>{partnerData.username}</h2>
          {hasNewMessage && <span className="new-message-badge">New message!</span>}
        </div>
        <div className="user-hearts">
          <span>{userData.hearts || 0}</span>
          <span className="heart-icon">❤️</span>
        </div>
      </div>
      
      <div className="conversation-container">
        <div className="conversation">
          {messages.length === 0 ? (
            <div className="empty-conversation">
              <p>No messages yet. Send a line to start the conversation!</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-info">
                    {message.senderId === currentUser.uid ? 'You' : partnerData.username} 
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="reactions">
                      {message.reactions.map((reaction, idx) => (
                        <span key={idx} className="reaction">{reaction.emoji}</span>
                      ))}
                    </div>
                  )}
                  
                  {message.senderId !== currentUser.uid && (
                    <div 
                      className="add-reaction" 
                      onClick={() => toggleEmojiPicker(message.id)}
                    >
                      React
                    </div>
                  )}
                </div>
                
                {showEmojiPicker && selectedMessageId === message.id && (
                  <div className="emoji-picker">
                    {commonEmojis.map(emoji => (
                      <span 
                        key={emoji} 
                        className="emoji" 
                        onClick={() => addReaction(message.id, emoji)}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="line-controls">
        <div 
          className="control-btn casual-btn" 
          onClick={() => openLineSelection('casual')}
        >
          Select Casual Line
        </div>
        <div 
          className="control-btn emoji-btn" 
          onClick={toggleEmojiButton}
        >
          Emojis
        </div>
        <div 
          className="control-btn romantic-btn" 
          onClick={() => openLineSelection('romantic')}
        >
          Select Romantic Line
        </div>
      </div>
      
      {/* Emoji Button Panel */}
      {showEmojiButton && (
        <div className="emoji-selector">
          <div className="selection-header">
            <h3>Select Emoji</h3>
            <span className="close-btn" onClick={() => setShowEmojiButton(false)}>×</span>
          </div>
          <div className="emoji-grid">
            {commonEmojis.map(emoji => (
              <div key={emoji} className="emoji-item">
                <span>{emoji}</span>
                <div className="emoji-description">{getEmojiDescription(emoji)}</div>
              </div>
            ))}
          </div>
          <div className="emoji-info">
            <p>Select an emoji to add it to your reactions collection</p>
          </div>
        </div>
      )}
      
      {selectedCategory && (
        <div className="line-selection">
          <div className="selection-header">
            <h3>{selectedCategory === 'casual' ? 'Casual Lines' : 'Romantic Lines'}</h3>
            <span className="close-btn" onClick={() => setSelectedCategory(null)}>×</span>
          </div>
          
          {unlockedLines[selectedCategory].length > 0 && (
            <div className="unlocked-lines">
              <h4>Unlocked Lines</h4>
              {predefinedLines[selectedCategory]
                .filter(line => unlockedLines[selectedCategory].includes(line.id))
                .map(line => (
                  <div key={line.id} className="line-card">
                    <p>{line.text}</p>
                    <button 
                      onClick={() => sendLine(selectedCategory, line.id)}
                      disabled={(userData.hearts || 0) < (selectedCategory === 'casual' ? 10 : 20)}
                      className={
                        (userData.hearts || 0) < (selectedCategory === 'casual' ? 10 : 20) 
                          ? 'disabled' 
                          : ''
                      }
                    >
                      Send ({selectedCategory === 'casual' ? '10' : '20'} ❤️)
                    </button>
                  </div>
                ))
              }
            </div>
          )}
          
          <div className="locked-lines">
            <h4>Locked Lines</h4>
            {predefinedLines[selectedCategory]
              .filter(line => !unlockedLines[selectedCategory].includes(line.id))
              .map(line => (
                <div key={line.id} className="line-card locked">
                  <p className="blurred-text">{line.text}</p>
                  <button 
                    onClick={() => unlockLine(selectedCategory, line.id)}
                    disabled={(userData.hearts || 0) < (selectedCategory === 'casual' ? 3 : 5)}
                    className={
                      (userData.hearts || 0) < (selectedCategory === 'casual' ? 3 : 5) 
                        ? 'disabled' 
                        : ''
                    }
                  >
                    Unlock ({selectedCategory === 'casual' ? '3' : '5'} ❤️)
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get emoji descriptions
const getEmojiDescription = (emoji) => {
  const descriptions = {
    '❤️': 'Love',
    '😊': 'Happy',
    '😍': 'Heart Eyes',
    '🥰': 'Adore',
    '😂': 'Laughing',
    '👍': 'Agree',
    '👏': 'Applause',
    '🎉': 'Celebrate',
    '🤔': 'Thinking',
    '🙄': 'Eye Roll',
    '😘': 'Kiss',
    '🥺': 'Pleading',
    '😢': 'Sad',
    '😮': 'Surprised',
    '😎': 'Cool'
  };
  
  return descriptions[emoji] || 'Emoji';
};











// Main App Component
const App = () => {
  const [inviteUserId, setInviteUserId] = useState(null);
  
  useEffect(() => {
    // Check for invite parameter in URL
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    
    if (inviteParam) {
      setInviteUserId(inviteParam);
      
      // Remove the parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            inviteUserId ? 
              <AcceptInvite inviteUserId={inviteUserId} /> : 
              <LoginSignup />
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/partner-info" element={<PartnerInfo />} />
          <Route path="/partner-request" element={<PartnerRequest />} />
          <Route path="/currency" element={<CurrencyManagement />} />
          <Route path="/dashboard-design" element={<DashboardDesign title="Dashboard Design" />} />
          <Route path="/game" element={<Game title="Games" />} />
          <Route path="/gift" element={<Gift title="Gifts" />} />
          <Route path="/line" element={<Line title="Lines" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};












// Accept Invite Component
const AcceptInvite = ({ inviteUserId }) => {
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [senderData, setSenderData] = useState(null);
  
  useEffect(() => {
    const handleInvite = async () => {
      try {
        // Get sender's data
        const senderDoc = await getDoc(doc(db, 'users', inviteUserId));
        
        if (senderDoc.exists()) {
          setSenderData(senderDoc.data());
        }
        
        if (currentUser) {
          // User is logged in, create a connection
          await setDoc(doc(collection(db, 'partnerRequests')), {
            from: inviteUserId,
            to: currentUser.uid,
            createdAt: serverTimestamp()
          });
          
          navigate('/partner-request');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error handling invite:', error);
        setLoading(false);
      }
    };
    
    if (inviteUserId) {
      handleInvite();
    } else {
      setLoading(false);
    }
  }, [currentUser, inviteUserId, navigate]);

  if (loading) return <div>Loading...</div>;
  
  if (!senderData) {
    return (
      <div className="invite-error">
        <h1>Invalid Invitation</h1>
        <p>This invitation link is invalid or has expired.</p>
        <button onClick={() => navigate('/')}>Go to Login</button>
      </div>
    );
  }
  
  return (
    <div className="invite-accept">
      <h1>You've Been Invited!</h1>
      <p>{senderData.username} has invited you to connect on SaWish!</p>
      
      {currentUser ? (
        <div className="redirect-message">
          <p>Redirecting to partner requests...</p>
        </div>
      ) : (
        <div className="signup-prompt">
          <p>Sign up to connect with {senderData.username}!</p>
          <button onClick={() => navigate('/')}>Sign Up Now</button>
        </div>
      )}
    </div>
  );
};




















export default App;