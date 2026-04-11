import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { JournalTask } from "../components/tasks/JournalTask";

describe("JournalTask", () => {
  const onCompletionChange = jest.fn();

  beforeEach(() => {
    onCompletionChange.mockClear();
  });

  it("starts incomplete with empty entry", () => {
    render(
      <JournalTask
        config={{ minCharacters: 20, prompt: "Reflect on today" }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(onCompletionChange).toHaveBeenCalledWith(false, undefined);
  });

  it("displays the prompt text", () => {
    render(
      <JournalTask
        config={{ prompt: "What did you learn today?" }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(screen.getByText("What did you learn today?")).toBeTruthy();
  });

  it("shows character count progress", () => {
    render(
      <JournalTask
        config={{ minCharacters: 50 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(screen.getByText("0/50 characters")).toBeTruthy();
  });

  it("marks complete when minimum characters reached", () => {
    render(
      <JournalTask
        config={{ minCharacters: 10, prompt: "Write" }}
        onCompletionChange={onCompletionChange}
      />,
    );

    const input = screen.getByPlaceholderText("Start writing...");

    fireEvent.changeText(input, "This is enough text");

    expect(onCompletionChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ entry: "This is enough text" }),
    );
  });

  it("remains incomplete when text is too short", () => {
    render(
      <JournalTask
        config={{ minCharacters: 50, prompt: "Write" }}
        onCompletionChange={onCompletionChange}
      />,
    );

    const input = screen.getByPlaceholderText("Start writing...");

    fireEvent.changeText(input, "Too short");

    const lastCall =
      onCompletionChange.mock.calls[onCompletionChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe(false);
  });

  it("uses default config when null is passed", () => {
    render(
      <JournalTask config={null} onCompletionChange={onCompletionChange} />,
    );

    // Default minCharacters is 50
    expect(screen.getByText("0/50 characters")).toBeTruthy();
  });
});
