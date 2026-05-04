import React from "react";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>Hello Vitest</h1>;
}

describe("web test setup", () => {
  it("renders a React component in jsdom", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Hello Vitest" })).toBeInTheDocument();
  });
});
