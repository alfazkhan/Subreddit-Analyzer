import { useDispatch, useSelector } from "react-redux";
import { authSliceActions } from "@/store/authSlice";
import { Button } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { auth } from "../../../../firebase_config";


export default function LogoutButton() {
  const isAuthenticated = useSelector(
    (state) => state.authState.isAuthenticated,
  );

  const dispatch = useDispatch();
  const logoutAction = authSliceActions.logoutUser;

  async function logoutHandler() {
    try {
      await signOut(auth);
      dispatch(logoutAction());
      console.log("Successfully logged out of Firebase and Redux.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <>
      {isAuthenticated && (
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="red.500"
          onClick={logoutHandler}
        >
          Logout
        </Button>
      )}
    </>
  );
}
