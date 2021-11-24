import {React, useState} from 'react';
import { GoogleLogin } from 'react-google-login';
const Google = () => {
  const [isLoggedIn] = useState(false)  
    const responseGoogle = (response) => {
      console.log(response);
    }
        let gContent;
        if(isLoggedIn) {

        } else {
          gContent = ( <GoogleLogin
          clientId="257542629286-hp20ldd6p85s25bop0mkso6hivdqhkts.apps.googleusercontent.com"
          buttonText="Login"
          onSuccess={responseGoogle}
          onFailure={responseGoogle}
          cookiePolicy={'single_host_origin'}
          />)

        }
        return <div>{gContent}</div>;
    }
export default Google;