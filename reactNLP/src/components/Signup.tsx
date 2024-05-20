import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../firebase/config';
import { collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

// ...



const defaultTheme = createTheme();
export default function SignUp() {
  const [interests, setInterests] = React.useState([]);
  const navigate = useNavigate();

  useEffect(()=>{
    onAuthStateChanged(auth,e =>  {if(auth.currentUser!=null){
      navigate('/')
    }})
  },[]);


  const handleInterestChange = (event) => {
    const interest = event.target.name;
    if (event.target.checked) {
      setInterests([...interests, interest]); // ilgi alanlarını ekleyin
    } else {
      setInterests(interests.filter(item => item !== interest)); // ilgi alanlarını kaldırın
    }
  };
  

  const signUp = async (email, password, firstName, lastName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(firestore, "users", auth.currentUser.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        interests: interests, // güncellenmiş ilgi alanlarını gönderin
      });
      navigate('/signin');
      console.log('User account created & signed in!');
    } catch (error) {
      console.error('There was an error while signing up:', error);
    }
  };
  
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    const firstName = data.get('firstName');
    const lastName = data.get('lastName');
    if (email && password) {
      await signUp(email.toString(), password.toString(), firstName.toString(), lastName.toString());
      console.log({
        firstName: firstName,
        lastName: lastName,
        email: email,
        interests: interests,
      });
    }
  };

  return (
      <ThemeProvider theme={defaultTheme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
              sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign up
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                      autoComplete="given-name"
                      name="firstName"
                      required
                      fullWidth
                      id="firstName"
                      label="First Name"
                      autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                      required
                      fullWidth
                      id="lastName"
                      label="Last Name"
                      name="lastName"
                      autoComplete="family-name"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                  />
                </Grid>
              </Grid>
              <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="#" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {['coding', 'design', 'marketing'].map((interest) => (
                    <Grid item xs={6} key={interest}>
                      <FormControlLabel
                          control={<Checkbox onChange={handleInterestChange} name={interest} />}
                          label={interest}
                      />
                    </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
  );
}