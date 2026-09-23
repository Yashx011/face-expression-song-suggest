import { RouterProvider } from "react-router";
import router from "./app.routes";
import "./feature/shared/style/global.scss"
import { AuthContextProvider } from "./feature/auth/auth.context"
function App() {
  return (
  <AuthContextProvider>
    <RouterProvider router={router} />;

  </AuthContextProvider>);

}

export default App;