import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "./components/Dashboard";
import ClaimReview from "./components/ClaimReview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/claims/:id" element={<ClaimReview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
