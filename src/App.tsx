import { Route, Routes } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./features/login/LoginPage";
import Test from "./features/test/Test";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/test" element={<Test />} />
    </Routes>
  );
}

export default App;
