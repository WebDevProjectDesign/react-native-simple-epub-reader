import { Button, View } from 'react-native';
import React from 'react';

const Login = ({
  setToken,
}: {
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const handleLogin = async () => {
    const response = await fetch('https://api.rtck.pl/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'super@user.pl',
        password: 'Password123!',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      setToken(data.token);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default Login;
