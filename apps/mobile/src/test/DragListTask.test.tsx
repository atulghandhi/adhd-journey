import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { DragListTask } from "../components/tasks/DragListTask";

describe("DragListTask", () => {
  const onCompletionChange = jest.fn();

  beforeEach(() => {
    onCompletionChange.mockClear();
  });

  it("starts incomplete with no items", () => {
    render(
      <DragListTask
        config={{ minItems: 3 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(onCompletionChange).toHaveBeenCalledWith(false, undefined);
  });

  it("shows instruction text from config", () => {
    render(
      <DragListTask
        config={{ instruction: "List your priorities" }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(screen.getByText("List your priorities")).toBeTruthy();
  });

  it("adds items and marks complete when minimum reached", () => {
    render(
      <DragListTask
        config={{ minItems: 2 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Add an interest, project, or hobby...",
    );
    const addButton = screen.getByText("Add");

    fireEvent.changeText(input, "First item");
    fireEvent.press(addButton);

    fireEvent.changeText(input, "Second item");
    fireEvent.press(addButton);

    // After adding 2 items with minItems=2, should be complete
    expect(onCompletionChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ items: ["First item", "Second item"] }),
    );
  });

  it("does not add empty items", () => {
    render(
      <DragListTask
        config={{ minItems: 1 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Add an interest, project, or hobby...",
    );
    const addButton = screen.getByText("Add");

    fireEvent.changeText(input, "   ");
    fireEvent.press(addButton);

    // Should never have been called with complete=true
    const completeCalls = onCompletionChange.mock.calls.filter(
      ([complete]: [boolean]) => complete === true,
    );
    expect(completeCalls).toHaveLength(0);
  });

  it("shows minimum count indicator", () => {
    render(
      <DragListTask
        config={{ minItems: 3 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    expect(screen.getByText("0/3 minimum")).toBeTruthy();
  });

  it("does not add more items when maxItems reached", () => {
    render(
      <DragListTask
        config={{ maxItems: 2, minItems: 1 }}
        onCompletionChange={onCompletionChange}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Add an interest, project, or hobby...",
    );
    const addButton = screen.getByText("Add");

    fireEvent.changeText(input, "Item 1");
    fireEvent.press(addButton);
    fireEvent.changeText(input, "Item 2");
    fireEvent.press(addButton);

    // Try to add a third item — should be ignored
    fireEvent.changeText(input, "Item 3");
    fireEvent.press(addButton);

    // Only 2 items should exist (verify via completion data)
    const lastCompleteCall = onCompletionChange.mock.calls
      .filter(([complete]: [boolean]) => complete === true)
      .pop();
    expect(lastCompleteCall?.[1]?.items).toHaveLength(2);
  });
});
