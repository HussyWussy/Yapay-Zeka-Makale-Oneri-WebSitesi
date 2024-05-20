import React, { useEffect, useState } from 'react';
import { auth } from './firebase/config';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Web from './components/Web';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/main" element={<Web />} />
      </Routes>
    </div>
  );
};

export default App;
