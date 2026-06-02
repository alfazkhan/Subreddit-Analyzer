import {configureStore} from "@reduxjs/toolkit"
import userInput from "./userInput"
import serverStatus from "./serverStatus"
import authState from "./authSlice"



const store = configureStore({
    reducer: {
        userInputState: userInput, serverStatusState: serverStatus, authState: authState
    }
})

export default store