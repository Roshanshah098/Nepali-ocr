import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders OCR Dataset Builder", () => {
  render(<App />);
  const titleElement = screen.getByText(/OCR Dataset Builder/i);
  expect(titleElement).toBeInTheDocument();
});
