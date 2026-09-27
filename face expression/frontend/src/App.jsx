import { RouterProvider } from "react-router";
import router from "./app.routes";
import "./feature/shared/style/global.scss"
import { AuthContextProvider } from "./feature/auth/auth.context"
import { SongContextProvider } from "./feature/home/songContext"

function App() {
  return (
  <AuthContextProvider>
    <SongContextProvider>
    <RouterProvider router={router} />;

    </SongContextProvider>
  </AuthContextProvider>);

}

export default App;