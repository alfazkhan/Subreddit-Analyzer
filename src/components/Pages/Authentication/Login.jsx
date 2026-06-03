import { auth } from "../../../../firebase_config";
import { useEffect, useState } from "react";
import {
  Field,
  Input,
  Grid,
  GridItem,
  AbsoluteCenter,
  Button,
  Stack,
  Text,
} from "@chakra-ui/react";
import Header from "@/components/ui-components/Header";
import { PasswordInput } from "@/components/ui/password-input";
import { signInWithEmailAndPassword } from "firebase/auth";
import { BASE_URL } from "@/Constants";
import { useDispatch } from "react-redux";
import { authSliceActions } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("khanalfaaz14@gmail.com");
  const [password, setPassword] = useState("superadmin123");
  const [errorMsg, setErrorMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate()


  async function loginHandler() {
    // console.log(email,password)
    setLoading(true);

    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const token = await userCredentials.user.getIdToken();
      
      const tokenDetails = {
        token: token,
        created_at: Date.now()
      }
      console.log(tokenDetails)
      localStorage.setItem("tokenDetails",JSON.stringify(tokenDetails))

      const response = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Database profile sync failed."); //Throwing error if there's a user mismatch
      
      const dbUser = await response.json();
      
      dispatch(
        authSliceActions.setCredentials({
          user: { uid: userCredentials.user.uid, email },
          token: token,
          role: dbUser.role,
        }),
      );

      setLoading(false);
      navigate('/dashboard');
      console.log(dbUser);

    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  }

  return (
    <>
      <AbsoluteCenter axis="both">
        <Grid>
          <GridItem width="full" pb="10">
            <Header text={"Login to Dashboard"} highlight="Dashboard" />
          </GridItem>
          <GridItem>
            <Text color="red.500">{errorMsg}</Text>
          </GridItem>
          <GridItem gap="4" width="full">
            <Field.Root required>
              <Field.Label>
                Email <Field.RequiredIndicator />
              </Field.Label>
              <Input
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
              {/* <Field.HelperText>Enter your email</Field.HelperText> */}
              <Field.ErrorText>{errorMsg}</Field.ErrorText>
            </Field.Root>
            <Field.Root required mt="5">
              <Field.Label>
                Password <Field.RequiredIndicator />
              </Field.Label>
              <PasswordInput
                value={password}
                visible={visible}
                onVisibleChange={setVisible}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* <Field.HelperText>Enter your password</Field.HelperText> */}
              <Field.ErrorText>{errorMsg}</Field.ErrorText>
            </Field.Root>
            <Stack mt="5">
              <Button
                size="sm"
                color="white"
                fontWeight="black"
                bg="orange.600"
                onClick={loginHandler}
                disabled={loading}
              >
                Login
              </Button>
            </Stack>
          </GridItem>
        </Grid>
      </AbsoluteCenter>
    </>
  );
}
