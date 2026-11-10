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
import { Header } from "@/components/ui-components/Layout";
import { PasswordInput } from "@/components/ui/password-input";
import { signInWithEmailAndPassword } from "firebase/auth";
import { fetchUserCredentials } from "@/util/api";
import { useDispatch, useSelector } from "react-redux";
import { authSliceActions } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/util/Types";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.authState);

  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate("/dashboard");
    }
  }, [authState.isAuthenticated, navigate]);

  async function loginHandler() {
    setLoading(true);

    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const credentials = await fetchUserCredentials(userCredentials.user);

      dispatch(authSliceActions.setCredentials(credentials));

      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "An error occurred");
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
            <Stack mt="5">
              <Button
                size="sm"
                color="black"
                fontWeight="bold"
                bg="gray.100"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Back
              </Button>
            </Stack>
          </GridItem>
        </Grid>
      </AbsoluteCenter>
    </>
  );
}