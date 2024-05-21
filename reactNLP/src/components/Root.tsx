import {auth} from '../firebase/config.js'
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';


const Root = () => {
  
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
          <div><Link className='link'  to="/">NLP MAKALE ÖNERİ</Link></div> 
        </h1>
      </div>
      
      <div>
        <button className='quit'  onClick={logOut}>Çıkış Yap</button>
      </div>
      

      <Outlet></Outlet>

    </div>
  );
};

export default Root;