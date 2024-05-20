import {auth} from '../firebase/config.js'
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


const Root = () => {
  const navigate = useNavigate();

  const logOut = async () => {
    try {
      auth.signOut()
      
    }
    catch(e){
      console.log(e)
    }
    
  };
  
  return (
    <div className='Root'>
   
      <div>
        <h1 className='h1'>
          <div><Link className='link'  to="/">Ara Bulursun Akademik</Link></div> 
        </h1>
      </div>
      
      <div>
        <button onClick={logOut}>Çıkış Yap</button>
      </div>
      

      <Outlet></Outlet>

    </div>
  );
};

export default Root;